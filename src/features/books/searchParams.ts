import { DEFAULT_PAGE_SIZE, PAGE_SIZES, type PageSize } from './constants';

export interface SearchState {
  q: string;
  page: number;
  pageSize: PageSize;
}

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}

/**
 * Reads and sanitizes the URL query string. The URL is user-editable, so every value is
 * validated: unknown page sizes fall back to the default and the page is a positive integer. The
 * upper bound is unknown here (it depends on the API's total): a page past the end is handled
 * once the results arrive ("No more results").
 */
export function parseSearchState(
  params: URLSearchParams,
  fallbackPageSize: PageSize = DEFAULT_PAGE_SIZE,
): SearchState {
  const q = (params.get('q') ?? '').trim();
  const size = Number(params.get('pageSize'));
  const pageSize = isPageSize(size) ? size : fallbackPageSize;
  const rawPage = Number.parseInt(params.get('page') ?? '', 10);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, rawPage) : 1;
  return { q, page, pageSize };
}
