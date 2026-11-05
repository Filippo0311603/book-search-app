import { useLocation, useParams } from 'react-router';
import { BoxArrowUpRightIcon, ExclamationTriangleIcon } from '../components/icons';
import { StatusMessage } from '../components/StatusMessage';
import type { BookRouteState } from '../features/books/components/BookCard';
import { BookBackLink } from '../features/books/components/BookBackLink';
import { BookCover } from '../features/books/components/BookCover';
import { getErrorMessage, isNotFoundError } from '../features/books/errors';
import { formatLanguage, formatPublishedDate } from '../features/books/format';
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

  const details: [string, string | undefined][] = [
    ['Authors', book.authors.join(', ') || undefined],
    ['Publisher', book.publisher],
    ['Published', formatPublishedDate(book.publishedDate)],
    ['Pages', book.pageCount ? String(book.pageCount) : undefined],
    ['Categories', book.categories.join(', ') || undefined],
    ['Language', formatLanguage(book.language)],
  ];

  return (
    <article>
      <title>{`${book.title} - BookSearch`}</title>
      <BookBackLink search={from} cameFromResults={cameFromResults} />
      <div className="row g-4">
        <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
          <BookCover src={book.coverLarge} title={book.title} large />
        </div>
        <div className="col-12 col-md-8 col-lg-9">
          <h1 className="h2 mb-1">{book.title}</h1>
          {book.subtitle && <p className="lead text-body-secondary">{book.subtitle}</p>}
          <dl className="row mb-4">
            {details.map(
              ([label, value]) =>
                value && (
                  <div key={label} className="col-12 col-sm-6 mb-2">
                    <dt className="small text-body-secondary fw-normal">{label}</dt>
                    <dd className="mb-0">{value}</dd>
                  </div>
                ),
            )}
          </dl>
          {book.descriptionHtml && (
            <section aria-labelledby="description-title" className="mb-4">
              <h2 id="description-title" className="h5">
                Description
              </h2>
              {/* Sanitized in the mapper (DOMPurify, formatting tags only). */}
              <div dangerouslySetInnerHTML={{ __html: book.descriptionHtml }} />
            </section>
          )}
          {book.infoLink && (
            <a
              href={book.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              View on Google Books <BoxArrowUpRightIcon className="ms-1" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
