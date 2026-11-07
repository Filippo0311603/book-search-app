import type { SyntheticEvent } from 'react';
import { PLACEHOLDER_COVER_URL } from '../constants';
import { hasBookShape } from '../covers';

interface BookCoverProps {
  src: string;
  title: string;
  large?: boolean;
  /** Tried before the placeholder when `src` fails or is not book-shaped (detail: the thumbnail). */
  fallbackSrc?: string;
}

export function BookCover({ src, title, large = false, fallbackSrc }: BookCoverProps) {
  // src -> fallbackSrc -> placeholder, and never past the placeholder (no error loops).
  const showNext = (image: HTMLImageElement) => {
    const current = image.getAttribute('src');
    if (current === PLACEHOLDER_COVER_URL) return;
    image.src = fallbackSrc && current !== fallbackSrc ? fallbackSrc : PLACEHOLDER_COVER_URL;
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => showNext(event.currentTarget);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!hasBookShape(image.naturalWidth, image.naturalHeight)) showNext(image);
  };

  return (
    // The frame keeps the layout box and sets the perspective; .book-cover-book is the 3D object.
    // The two empty spans are decorative (back cover, page edges), drawn entirely in CSS.
    <span className={`book-cover-frame${large ? ' book-cover-frame--large' : ''}`}>
      <span className="book-cover-book">
        <span className="book-cover-back" aria-hidden="true" />
        <span className="book-cover-pages" aria-hidden="true" />
        <img
          src={src}
          alt={`Cover of ${title}`}
          className="book-cover"
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleError}
          onLoad={handleLoad}
        />
      </span>
    </span>
  );
}
