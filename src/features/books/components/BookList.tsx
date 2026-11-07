import type { CSSProperties } from 'react';
import type { Book } from '../types';
import { BookCard } from './BookCard';

interface BookListProps {
  books: Book[];
  /** Play the staggered entrance. Only for the first appearance of results (see SearchPage). */
  animate?: boolean;
}

/**
 * Mobile-first grid: one card per row on phones, two columns from the `lg` breakpoint.
 * `--i` is the position in the list: the entrance animation is staggered with it (see _cards.scss).
 */
export function BookList({ books, animate = false }: BookListProps) {
  return (
    <ul className="list-unstyled row g-3 mb-0">
      {books.map((book, index) => (
        <li
          key={book.id}
          className={`col-12 col-lg-6${animate ? ' book-list-item--enter' : ''}`}
          style={{ '--i': index } as CSSProperties}
        >
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
