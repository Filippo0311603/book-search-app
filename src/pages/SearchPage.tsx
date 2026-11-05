import { useState } from 'react';
import { useNavigationType } from 'react-router';
import { useAppDispatch } from '../app/hooks';
import { PageSizeSelect } from '../components/PageSizeSelect';
import { Paginator } from '../components/Paginator';
import { SearchBar } from '../components/SearchBar';
import { StatusMessage } from '../components/StatusMessage';
import { BookList } from '../features/books/components/BookList';
import { BookListSkeleton } from '../features/books/components/BookListSkeleton';
import { PAGE_SIZES } from '../features/books/constants';
import { getErrorMessage, isBadRequestError, isRateLimitError } from '../features/books/errors';
import { useBookSearch } from '../features/books/hooks/useBookSearch';
import { useResultBounds } from '../features/books/hooks/useResultBounds';
import { useSearchState } from '../features/books/hooks/useSearchState';
import {
  applyBounds,
  getEffectiveTotal,
  getLastKnownPage,
  getStartIndex,
  getTotalPages,
} from '../features/books/pagination';
import { pageSizeChanged } from '../features/books/preferencesSlice';

export function SearchPage() {
  const dispatch = useAppDispatch();
  const { q, page, pageSize, setQuery, setPage, setPageSize } = useSearchState();

  // The input is local state (a trimmed query could not hold a trailing space while typing).
  // Every change goes straight to the URL (one search per typed character, as the brief asks);
  // the URL entry is *replaced* so typing does not flood the history.
  const [input, setInput] = useState(q);
  const handleInputChange = (value: string) => {
    setInput(value);
    setQuery(value.trim());
  };

  // Follow the URL on every navigation except our own REPLACE ones (typing, page normalisation,
  // neither changes the query): they can arrive after the user typed more characters, and
  // applying them would drop those. Back/forward and links (e.g. the logo) do sync the input.
  const navigationType = useNavigationType();
  const [knownQ, setKnownQ] = useState(q);
  if (q !== knownQ) {
    setKnownQ(q);
    if (navigationType !== 'REPLACE' && q !== input.trim()) setInput(q);
  }

  const search = useBookSearch(q ? { q, page, pageSize } : null);

  // What the pages fetched so far prove about the end of this query's results.
  const isRejectedDeepPage = search.isError && isBadRequestError(search.error) && page > 1;
  const bounds = useResultBounds(
    q,
    search.data && search.dataArgs
      ? {
          startIndex: getStartIndex(search.dataArgs.page, search.dataArgs.pageSize),
          itemCount: search.data.books.length,
          pageSize: search.dataArgs.pageSize,
        }
      : isRejectedDeepPage
        ? { startIndex: getStartIndex(page, pageSize), itemCount: 0, pageSize }
        : null,
  );

  const handlePageSizeChange = (size: (typeof PAGE_SIZES)[number]) => {
    dispatch(pageSizeChanged(size));
    setPageSize(size);
  };

  return (
    <>
      <title>{q ? `${q} - BookSearch` : 'BookSearch'}</title>
      <h1 className="visually-hidden">Search books</h1>
      <div className="row g-3 align-items-center mb-4">
        <div className="col-12 col-md">
          <SearchBar
            value={input}
            onChange={handleInputChange}
            onClear={() => handleInputChange('')}
          />
        </div>
        <div className="col-12 col-md-auto">
          <PageSizeSelect value={pageSize} options={PAGE_SIZES} onChange={handlePageSizeChange} />
        </div>
      </div>
      {renderResults()}
    </>
  );

  /**
   * "No more results" with one button that lands on a page that has results: the last page
   * known to contain data for this query, else the estimate from the totals, else page 1.
   */
  function renderNoMoreResults(
    message: string,
    emptyPage: number,
    size: number,
    estimatedLastPage: number,
  ) {
    const known = getLastKnownPage(bounds, size);
    const target = Math.max(1, Math.min(known || estimatedLastPage || 1, emptyPage - 1));
    return (
      <StatusMessage
        icon="bi-signpost-split"
        title="No more results"
        action={{
          label: known || estimatedLastPage ? 'Go to the last page' : 'Go to the first page',
          onClick: () => setPage(target),
        }}
      >
        {message}
      </StatusMessage>
    );
  }

  function renderResults() {
    if (!q) {
      return (
        <StatusMessage icon="bi-search" title="Find your next book">
          Start typing a title, an author or an ISBN: results appear as you type.
        </StatusMessage>
      );
    }
    if (isRejectedDeepPage) {
      // Deep pages may be rejected (HTTP 400): treat it as the end of the results.
      return renderNoMoreResults(`There are no results this far for “${q}”.`, page, pageSize, 0);
    }
    if (search.isError) {
      return (
        <StatusMessage
          icon={isRateLimitError(search.error) ? 'bi-hourglass-split' : 'bi-exclamation-triangle'}
          title="Search failed"
          role="alert"
          action={{ label: 'Retry', onClick: search.retry }}
        >
          {getErrorMessage(search.error)}
        </StatusMessage>
      );
    }
    // Skeleton only for the first load of a query; page changes keep the previous results.
    if (!search.data || !search.dataArgs) return <BookListSkeleton count={pageSize} />;

    const { books, totalItems } = search.data;
    const shown = search.dataArgs;
    const startIndex = getStartIndex(shown.page, shown.pageSize);
    const total = applyBounds(
      getEffectiveTotal({
        totalItems,
        startIndex,
        itemCount: books.length,
        pageSize: shown.pageSize,
      }),
      bounds,
    );
    const totalPages = getTotalPages(total, shown.pageSize);

    if (books.length === 0) {
      // Past the real end (Google's totalItems is only an estimate): let the user step back.
      if (shown.page > 1 && totalPages > 0) {
        return renderNoMoreResults(
          `There are no further results for “${q}”.`,
          shown.page,
          shown.pageSize,
          totalPages,
        );
      }
      return (
        <StatusMessage icon="bi-emoji-frown" title="No results">
          Nothing found for &ldquo;{q}&rdquo;. Try different keywords.
        </StatusMessage>
      );
    }

    return (
      <>
        <p className="text-secondary small" aria-live="polite">
          Showing {startIndex + 1}&ndash;{startIndex + books.length} of about {total} results
        </p>
        <div
          className={search.isFetching ? 'results-fade' : undefined}
          aria-busy={search.isFetching}
        >
          <BookList books={books} />
        </div>
        <div className="mt-4">
          <Paginator currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </>
    );
  }
}
