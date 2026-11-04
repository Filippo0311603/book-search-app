import { useCallback, useEffect, useRef, useState } from 'react';
import { googleBooksApi } from '../../../services/googleBooksApi';
import type { SearchBooksArgs, SearchResult } from '../types';

interface ShownResult {
  args: SearchBooksArgs;
  data: SearchResult;
}

type AbortableRequest = { key: string; abort: () => void };

const keyOf = ({ q, page, pageSize }: SearchBooksArgs) => JSON.stringify([q, page, pageSize]);

/**
 * Runs the search query for `args` (`null` = no request).
 *
 * - Results are cached per args by RTK Query, so going back to a page is served without a request.
 * - Obsolete requests are cancelled through their AbortSignal when the args change (or become
 *   null). Stale responses could not be applied anyway, since the UI only reads the entry that
 *   matches the current args: the point of aborting is not wasting bandwidth, quota and
 *   server work on results nobody will see.
 * - While a new page of the *same query* loads, the previous page is still returned (`data`
 *   with the args it belongs to, `isFetching: true`) so the UI can keep it on screen.
 */
export function useBookSearch(args: SearchBooksArgs | null) {
  const [trigger, result] = googleBooksApi.endpoints.searchBooks.useLazyQuery();
  const q = args?.q;
  const page = args?.page;
  const pageSize = args?.pageSize;

  // Only abort when the args really change: aborting in an effect cleanup would also cancel the
  // request re-issued by React StrictMode for the *same* args (they share one cache entry,
  // which would end up rejected with an AbortError).
  const inFlight = useRef<AbortableRequest | null>(null);

  const run = useCallback(
    (current: SearchBooksArgs, preferCache: boolean) => {
      const key = keyOf(current);
      if (inFlight.current && inFlight.current.key !== key) inFlight.current.abort();
      // StrictMode re-runs the effect for the same args: RTK dedupes it onto the pending request
      // and returns a promise whose abort() is a no-op, so keep the original handle.
      const isDuplicate = preferCache && inFlight.current?.key === key;
      const request = trigger(current, preferCache);
      if (!isDuplicate) inFlight.current = { key, abort: () => request.abort() };
    },
    [trigger],
  );

  useEffect(() => {
    if (q === undefined || page === undefined || pageSize === undefined) {
      inFlight.current?.abort();
      inFlight.current = null;
      return;
    }
    // `true`: reuse cached data when available instead of refetching.
    run({ q, page, pageSize }, true);
  }, [run, q, page, pageSize]);

  const retry = useCallback(() => {
    if (q !== undefined && page !== undefined && pageSize !== undefined) {
      run({ q, page, pageSize }, false);
    }
  }, [run, q, page, pageSize]);

  // The lazy result describes the *last triggered* args; ignore it until it matches the current ones.
  const original = result.originalArgs;
  const isCurrent = args !== null && original !== undefined && keyOf(original) === keyOf(args);
  const currentData = isCurrent ? result.currentData : undefined;
  const error = isCurrent && result.isError ? result.error : undefined;

  // Remember the last result shown, to keep it visible while the next page loads.
  const [lastShown, setLastShown] = useState<ShownResult | null>(null);
  if (args && currentData && lastShown?.data !== currentData) {
    setLastShown({ args, data: currentData });
  }

  const shown: ShownResult | null =
    args && currentData
      ? { args, data: currentData }
      : args && lastShown && lastShown.args.q === args.q
        ? lastShown
        : null;

  return {
    data: shown?.data,
    /** Args the returned `data` was fetched with (differ from `args` while a page loads). */
    dataArgs: shown?.args,
    error,
    isError: error !== undefined,
    isFetching: args !== null && currentData === undefined && error === undefined,
    retry,
  };
}
