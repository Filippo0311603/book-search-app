import { useRef, useState } from 'react';
import { useNavigationType } from 'react-router';
import { useAppDispatch } from '../app/hooks';
import {
  BookHalfIcon,
  EmojiFrownIcon,
  ExclamationTriangleIcon,
  HourglassSplitIcon,
  SignpostSplitIcon,
} from '../components/icons';
import { PageSizeSelect } from '../components/PageSizeSelect';
import { Paginator } from '../components/Paginator';
import { SearchBar } from '../components/SearchBar';
import { StatusMessage } from '../components/StatusMessage';
import { BookList } from '../features/books/components/BookList';
import { BookListSkeleton } from '../features/books/components/BookListSkeleton';
import { SuggestedSearches } from '../features/books/components/SuggestedSearches';
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
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  // The rejection is checked first: while a deep page is rejected the previous page's data may
  // still be on screen (`search.data`), and the rejection is the more recent observation.
  const bounds = useResultBounds(
    q,
    isRejectedDeepPage
      ? { startIndex: getStartIndex(page, pageSize), itemCount: 0, pageSize, totalItems: 0 }
      : search.data && search.dataArgs
        ? {
            startIndex: getStartIndex(search.dataArgs.page, search.dataArgs.pageSize),
            itemCount: search.data.books.length,
            pageSize: search.dataArgs.pageSize,
            totalItems: search.data.totalItems,
          }
        : null,
  );

  // The clicked suggestion disappears with the empty state: hand focus to the search box.
  const handleSuggestion = (term: string) => {
    handleInputChange(term);
    searchInputRef.current?.focus();
  };

  const handlePageSizeChange = (size: (typeof PAGE_SIZES)[number]) => {
    dispatch(pageSizeChanged(size));
    setPageSize(size);
  };

  // What is on screen for the current results, shared by the count line and the results block.
  const view = getShownResults();

  return (
    <>
      <title>{q ? `${q} - BookSearch` : 'BookSearch'}</title>
      <h1 className="visually-hidden">Search books</h1>
      <div className={q ? undefined : 'hero'}>
        {!q && (
          <div className="text-center mb-4">
            <span className="hero-mark mb-3" aria-hidden="true">
              <BookHalfIcon />
            </span>
            <h2 className="hero-title">Find your next great read</h2>
            <p className="hero-lead lead text-body-secondary mb-0">
              Start typing a title, an author or an ISBN: results appear as you type.
            </p>
          </div>
        )}
        <div className="row g-3 align-items-center mb-4">
          <div className="col-12 col-md">
            <SearchBar
              value={input}
              onChange={handleInputChange}
              onClear={() => handleInputChange('')}
              inputRef={searchInputRef}
            />
          </div>
          <div className="col-12 col-md-auto">
            <PageSizeSelect value={pageSize} options={PAGE_SIZES} onChange={handlePageSizeChange} />
          </div>
        </div>
      </div>
      {/* Always mounted so screen readers announce its text changes (a new node is not announced). */}
      <p className="result-count text-body-secondary small" role="status" aria-live="polite">
        {view &&
          view.books.length > 0 &&
          `Showing ${view.startIndex + 1}–${view.startIndex + view.books.length} of about ${view.total} results`}
      </p>
      {renderResults()}
    </>
  );

  function getShownResults() {
    if (!q || search.isError || !search.data || !search.dataArgs) return null;
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
    return { books, shown, startIndex, total, totalPages: getTotalPages(total, shown.pageSize) };
  }

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
        icon={SignpostSplitIcon}
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
        <div className="text-center px-3 pb-5">
          <SuggestedSearches onSelect={handleSuggestion} />
        </div>
      );
    }
    if (isRejectedDeepPage) {
      // Deep pages may be rejected (HTTP 400): treat it as the end of the results.
      return renderNoMoreResults(`There are no results this far for “${q}”.`, page, pageSize, 0);
    }
    if (search.isError) {
      return (
        <StatusMessage
          icon={isRateLimitError(search.error) ? HourglassSplitIcon : ExclamationTriangleIcon}
          title="Search failed"
          role="alert"
          action={{ label: 'Retry', onClick: search.retry }}
        >
          {getErrorMessage(search.error)}
        </StatusMessage>
      );
    }
    // Skeleton only for the first load of a query; page changes keep the previous results.
    if (!view) return <BookListSkeleton count={pageSize} />;
    const { books, shown, totalPages } = view;

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
        <StatusMessage icon={EmojiFrownIcon} title="No results">
          Nothing found for &ldquo;{q}&rdquo;. Try different keywords.
        </StatusMessage>
      );
    }

    return (
      <>
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
