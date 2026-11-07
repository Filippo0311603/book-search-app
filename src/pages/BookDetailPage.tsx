import type { CSSProperties } from 'react';
import { useLocation, useParams } from 'react-router';
import { BoxArrowUpRightIcon, ExclamationTriangleIcon } from '../components/icons';
import { StatusMessage } from '../components/StatusMessage';
import type { BookRouteState } from '../features/books/components/BookCard';
import { BookBackLink } from '../features/books/components/BookBackLink';
import { BookSpecs } from '../features/books/components/BookSpecs';
import { CategoryChips } from '../features/books/components/CategoryChips';
import { BookCover } from '../features/books/components/BookCover';
import { getCategoryLabels } from '../features/books/categories';
import { getErrorMessage, isNotFoundError } from '../features/books/errors';
import { useGetBookQuery } from '../services/googleBooksApi';

export function BookDetailPage() {
  const { id = '' } = useParams();
  const { data: book, error, isLoading, refetch } = useGetBookQuery(id);
  const location = useLocation();
  const routeState = location.state as BookRouteState | null;
  const from = routeState?.from ?? '';
  const cameFromResults = routeState?.from !== undefined;

  if (isLoading) {
    return (
      <div role="status" className="text-center py-5">
        <div className="spinner-border text-primary" aria-hidden="true" />
        <span className="visually-hidden">Loading book...</span>
      </div>
    );
  }

  if (error || !book) {
    return (
      <>
        <BookBackLink search={from} cameFromResults={cameFromResults} />
        <StatusMessage
          icon={ExclamationTriangleIcon}
          title={isNotFoundError(error) ? 'Book not found' : 'Could not load the book'}
          role="alert"
          headingLevel={1}
          action={isNotFoundError(error) ? undefined : { label: 'Retry', onClick: refetch }}
        >
          {getErrorMessage(error)}
        </StatusMessage>
      </>
    );
  }

  const categoryLabels = getCategoryLabels(book.categories);

  return (
    <article>
      <title>{`${book.title} - BookSearch`}</title>
      <BookBackLink search={from} cameFromResults={cameFromResults} />
      {/* Blurred, darkened copy of the cover as backdrop (see _detail.scss). The thumbnail is
          enough once blurred, and it is the most reliable size Google serves. */}
      <div
        className="book-hero"
        style={{ '--cover': `url(${JSON.stringify(book.thumbnail)})` } as CSSProperties}
      >
        <div className="row g-4 align-items-center">
          <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
            <BookCover
              src={book.coverLarge}
              fallbackSrc={book.thumbnail}
              title={book.title}
              large
            />
          </div>
          <div className="col-12 col-md-8 col-lg-9">
            <h1 className="book-hero-title mb-2">{book.title}</h1>
            {book.subtitle && <p className="book-hero-subtitle">{book.subtitle}</p>}
            {book.authors.length > 0 && (
              <p className="book-hero-authors">by {book.authors.join(', ')}</p>
            )}
            <BookSpecs book={book} />
            <CategoryChips labels={categoryLabels} />
            {book.infoLink && (
              <a
                href={book.infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg book-hero-cta"
              >
                View on Google Books <BoxArrowUpRightIcon className="ms-1" />
              </a>
            )}
          </div>
        </div>
      </div>
      {book.descriptionHtml && (
        <div className="row">
          <section
            aria-labelledby="description-title"
            className="col-12 col-md-8 offset-md-4 col-lg-9 offset-lg-3 book-description"
          >
            <h2 id="description-title" className="h5">
              Description
            </h2>
            {/* Sanitized in the mapper (DOMPurify, formatting tags only). */}
            <div dangerouslySetInnerHTML={{ __html: book.descriptionHtml }} />
          </section>
        </div>
      )}
    </article>
  );
}
