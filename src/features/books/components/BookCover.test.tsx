import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_COVER_URL } from '../constants';
import { BookCover } from './BookCover';

describe('BookCover', () => {
  it('falls back to the exact placeholder URL when the image fails, without looping', () => {
    render(<BookCover src="https://example.com/broken.jpg" title="Dune" />);
    const image = screen.getByRole('img', { name: 'Cover of Dune' });
    expect(image).toHaveAttribute('src', 'https://example.com/broken.jpg');

    fireEvent.error(image);
    expect(PLACEHOLDER_COVER_URL).toBe('https://placehold.co/400x600/FF5039/FFF?text=Book+Cover');
    expect(image).toHaveAttribute('src', PLACEHOLDER_COVER_URL);

    // The placeholder failing too must not reassign the src (that would loop on error events).
    const assigned: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    Object.defineProperty(image, 'src', {
      get: () => descriptor.get!.call(image) as string,
      set: (value: string) => assigned.push(value),
      configurable: true,
    });
    fireEvent.error(image);
    expect(assigned).toEqual([]);
  });

  /** jsdom does not decode images: set the natural size the browser would report, then load. */
  function loadWithSize(image: HTMLElement, width: number, height: number) {
    Object.defineProperty(image, 'naturalWidth', { value: width, configurable: true });
    Object.defineProperty(image, 'naturalHeight', { value: height, configurable: true });
    fireEvent.load(image);
  }

  it('replaces a strip-shaped image with the fallback, then with the placeholder', () => {
    render(<BookCover src="https://x/large.png" fallbackSrc="https://x/thumb.jpg" title="Dune" />);
    const image = screen.getByRole('img', { name: 'Cover of Dune' });

    loadWithSize(image, 800, 128);
    expect(image).toHaveAttribute('src', 'https://x/thumb.jpg');

    loadWithSize(image, 128, 20);
    expect(image).toHaveAttribute('src', PLACEHOLDER_COVER_URL);
  });

  it('keeps a book-shaped image and uses the fallback on error', () => {
    render(<BookCover src="https://x/large.jpg" fallbackSrc="https://x/thumb.jpg" title="Dune" />);
    const image = screen.getByRole('img', { name: 'Cover of Dune' });

    loadWithSize(image, 800, 1200);
    expect(image).toHaveAttribute('src', 'https://x/large.jpg');

    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://x/thumb.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', PLACEHOLDER_COVER_URL);
  });
});
