/** Single source of truth for the cover fallback (used by the mapper and by <img onError>). */
export const PLACEHOLDER_COVER_URL = 'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover';

/** The only page sizes the UI offers (the API accepts maxResults up to 40). */
export const PAGE_SIZES = [5, 10, 15, 20] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

/**
 * Delay between the last keystroke and the request.
 * Google Books allows only a small anonymous quota per IP; firing one request per
 * keystroke quickly ends in HTTP 429. 300 ms keeps the search feeling live while
 * collapsing a burst of typing into a single request.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * `totalItems` is only an estimate and grows/shrinks between pages. Deep pages are
 * unreliable (empty or erroring), so navigation is capped to this many results. It must be a
 * multiple of every page size (lcm = 60) so the last page is never partial.
 */
export const MAX_TOTAL_RESULTS = 360;
