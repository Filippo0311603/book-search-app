import { useEffect, useEffectEvent, useState } from 'react';
import { useAppDispatch } from '../app/hooks';
import { PageSizeSelect } from '../components/PageSizeSelect';
import { Paginator } from '../components/Paginator';
import { SearchBar } from '../components/SearchBar';
import { StatusMessage } from '../components/StatusMessage';
import { BookList } from '../features/books/components/BookList';
import { BookListSkeleton } from '../features/books/components/BookListSkeleton';
import { MAX_TOTAL_RESULTS, PAGE_SIZES, SEARCH_DEBOUNCE_MS } from '../features/books/constants';
import { getErrorMessage, isRateLimitError } from '../features/books/errors';
import { useBookSearch } from '../features/books/hooks/useBookSearch';
import { useDebouncedValue } from '../features/books/hooks/useDebouncedValue';
import { useSearchState } from '../features/books/hooks/useSearchState';
import {
  clampPage,
  getEffectiveTotal,
  getStartIndex,
  getTotalPages,
} from '../features/books/pagination';
import { shouldCommitQuery, shouldSyncInputFromUrl } from '../features/books/queryInput';
import { pageSizeChanged } from '../features/books/preferencesSlice';

export function SearchPage() {
  const dispatch = useAppDispatch();
  const { q, page, pageSize, setQuery, setPage, setPageSize } = useSearchState();

  // The input is local (instant feedback); the URL only receives the debounced, trimmed value.
  const [input, setInput] = useState(q);
  // Empty input is applied immediately (nothing to wait for), so the debounced value never
  // keeps a stale non-empty text after Clear.
  const debouncedInput = useDebouncedValue(input, input.trim() ? SEARCH_DEBOUNCE_MS : 0);

  // Keep the input in sync when the URL changes from outside (back/forward navigation).
  // Changes caused by our own debounced commit are skipped, otherwise a character typed
  // between the commit and the navigation render would be overwritten.
  const [knownQ, setKnownQ] = useState(q);
  if (q !== knownQ) {
    setKnownQ(q);
    if (shouldSyncInputFromUrl({ q, input, debouncedInput })) setInput(q);
  }

  // Commit once the debounce has settled (debounced value caught up with the input). Keyed on
  // both values, not on the debounced value alone: it can legitimately end up equal to its
  // previous value (e.g. retyping the same text after back/forward) and must still commit.
  const commitQuery = useEffectEvent(() => {
    if (shouldCommitQuery({ q, input, debouncedInput })) setQuery(input.trim());
  });
  useEffect(() => {
    commitQuery();
  }, [input, debouncedInput]);

  const search = useBookSearch(q ? { q, page, pageSize } : null);

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
          <SearchBar value={input} onChange={setInput} onClear={() => setInput('')} />
        </div>
        <div className="col-12 col-md-auto">
          <PageSizeSelect value={pageSize} options={PAGE_SIZES} onChange={handlePageSizeChange} />
        </div>
      </div>
      {renderResults()}
    </>
  );

  function renderResults() {
    if (!q) {
      return (
        <StatusMessage icon="bi-search" title="Find your next book">
          Start typing a title, an author or an ISBN: results appear as you type.
        </StatusMessage>
      );
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
    const total = getEffectiveTotal({
      totalItems,
      startIndex,
      itemCount: books.length,
      pageSize: shown.pageSize,
    });
    const totalPages = getTotalPages(total, shown.pageSize);
    // Google estimates more than we let the user browse: say so instead of claiming an exact total.
    const isCapped = totalItems > MAX_TOTAL_RESULTS && total === MAX_TOTAL_RESULTS;

    if (books.length === 0) {
      // Past the real end (Google's totalItems is only an estimate): let the user step back.
      if (shown.page > 1 && totalPages > 0) {
        return (
          <StatusMessage
            icon="bi-signpost-split"
            title="No more results"
            action={{
              label: 'Go to the last page',
              onClick: () => setPage(clampPage(totalPages, totalPages)),
            }}
          >
            There are no further results for &ldquo;{q}&rdquo;.
          </StatusMessage>
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
          Showing {startIndex + 1}&ndash;{startIndex + books.length} of{' '}
          {isCapped ? `${total}+` : `about ${total}`} results
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
