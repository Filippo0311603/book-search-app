import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { BookSpecs } from './BookSpecs';

const base: Book = {
  id: 'x',
  title: 'T',
  authors: [],
  description: '',
  descriptionHtml: '',
  thumbnail: '',
  coverLarge: '',
  categories: [],
};

describe('BookSpecs', () => {
  it('shows publisher, date, pages and the language as a readable name', () => {
    render(
      <BookSpecs
        book={{
          ...base,
          publisher: 'Einaudi',
          publishedDate: '2015-12-08',
          pageCount: 320,
          language: 'it',
        }}
      />,
    );
    expect(screen.getByText('Einaudi')).toBeInTheDocument();
    expect(screen.getByText('8 Dec 2015')).toBeInTheDocument();
    expect(screen.getByText('320 pages')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('leaves out the missing values and renders nothing when there are none', () => {
    const { container, rerender } = render(<BookSpecs book={{ ...base, publisher: 'Einaudi' }} />);
    expect(screen.queryByText('Pages')).not.toBeInTheDocument();
    rerender(<BookSpecs book={base} />);
    expect(container).toBeEmptyDOMElement();
  });
});
