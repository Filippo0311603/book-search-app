import { Link, useLocation } from 'react-router';
import type { Book } from '../types';
import { BookCover } from './BookCover';

export interface BookRouteState {
  /** Query string of the results page, so the detail page can link back to it. */
  from?: string;
}

export function BookCard({ book }: { book: Book }) {
  const { search } = useLocation();
  const state: BookRouteState = { from: search };

  return (
    <article className="card book-card position-relative h-100">
      <div className="card-body d-flex gap-3">
        <BookCover src={book.thumbnail} title={book.title} />
        <div className="min-w-0">
          <h2 className="h5 card-title mb-1">
            <Link
              to={`/books/${encodeURIComponent(book.id)}`}
              state={state}
              className="book-title-link"
            >
              {book.title}
            </Link>
          </h2>
          <p className="mb-1 text-secondary small">
            {book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'}
            {book.publishedDate && <span> &middot; {book.publishedDate}</span>}
          </p>
          {book.description && <p className="card-text line-clamp-2 mb-0">{book.description}</p>}
        </div>
      </div>
    </article>
  );
}
