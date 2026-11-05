/** Single source of truth for the cover fallback (used by the mapper and by <img onError>). */
export const PLACEHOLDER_COVER_URL = 'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover';

/** The only page sizes the UI offers (the API accepts maxResults up to 40). */
export const PAGE_SIZES = [5, 10, 15, 20] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

/** Shown in the empty state; each one fills the search box and searches. */
export const SUGGESTED_SEARCHES = ['Tolkien', 'Dune', 'Clean Code', 'Italo Calvino'] as const;
