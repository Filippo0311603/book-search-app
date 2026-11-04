import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAppSelector } from '../../../app/hooks';
import { selectPreferredPageSize } from '../preferencesSlice';
import { parseSearchState } from '../searchParams';
import type { PageSize } from '../constants';

/**
 * Search state (q, page, pageSize) stored in the URL: back/forward, refresh and the
 * detail -> back navigation all work for free, and any search is shareable as a link.
 */
export function useSearchState() {
  const [params, setParams] = useSearchParams();
  const preferredPageSize = useAppSelector(selectPreferredPageSize);
  const state = useMemo(
    () => parseSearchState(params, preferredPageSize),
    [params, preferredPageSize],
  );

  const update = useCallback(
    (changes: { q?: string; page?: number; pageSize?: PageSize }, replace: boolean) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (changes.q !== undefined) {
            if (changes.q) next.set('q', changes.q);
            else next.delete('q');
          }
          if (changes.pageSize !== undefined) next.set('pageSize', String(changes.pageSize));
          if (changes.page !== undefined && changes.page > 1)
            next.set('page', String(changes.page));
          else next.delete('page');
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  // Write a corrected page (out of range, not a number) back to the URL, replacing the entry.
  const rawPage = params.get('page');
  const { page } = state;
  useEffect(() => {
    if (rawPage !== null && rawPage !== String(page)) {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (page > 1) next.set('page', String(page));
          else next.delete('page');
          return next;
        },
        { replace: true },
      );
    }
  }, [rawPage, page, setParams]);

  return {
    ...state,
    /** Changing the query always goes back to page 1. Replaces the history entry: typing must not flood it. */
    setQuery: useCallback((q: string) => update({ q }, true), [update]),
    setPage: useCallback((page: number) => update({ page }, false), [update]),
    /** Changing the page size also resets to page 1 (the old offset would not line up). */
    setPageSize: useCallback((pageSize: PageSize) => update({ pageSize }, false), [update]),
  };
}
