import type { Book } from '../types';
import { BookCard } from './BookCard';

/** Mobile-first grid: one card per row on phones, two columns from the `lg` breakpoint. */
export function BookList({ books }: { books: Book[] }) {
  return (
    <ul className="list-unstyled row g-3 mb-0">
      {books.map((book) => (
        <li key={book.id} className="col-12 col-lg-6">
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
