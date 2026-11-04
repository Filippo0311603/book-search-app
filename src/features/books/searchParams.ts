import { DEFAULT_PAGE_SIZE, MAX_TOTAL_RESULTS, PAGE_SIZES, type PageSize } from './constants';
import { getTotalPages } from './pagination';

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
 * validated: unknown page sizes fall back to the default, pages are clamped to the reachable range.
 */
export function parseSearchState(
  params: URLSearchParams,
  fallbackPageSize: PageSize = DEFAULT_PAGE_SIZE,
): SearchState {
  const q = (params.get('q') ?? '').trim();
  const size = Number(params.get('pageSize'));
  const pageSize = isPageSize(size) ? size : fallbackPageSize;
  const rawPage = Number.parseInt(params.get('page') ?? '', 10);
  const maxPage = Math.max(1, getTotalPages(MAX_TOTAL_RESULTS, pageSize));
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), maxPage) : 1;
  return { q, page, pageSize };
}
