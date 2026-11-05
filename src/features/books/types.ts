/** Raw payloads returned by the Google Books API (only the fields we use). */
export interface VolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  infoLink?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
}

export interface Volume {
  id: string;
  volumeInfo?: VolumeInfo;
}

export interface VolumesResponse {
  kind?: string;
  totalItems: number;
  /** Omitted by the API when there are no matches. */
  items?: Volume[];
}

/** Clean domain model consumed by the UI. */
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  /** Plain text, safe to render anywhere (used for the 2-line clamp in lists). */
  description: string;
  /** Sanitized HTML subset, safe for dangerouslySetInnerHTML (detail page). */
  descriptionHtml: string;
  /** Always an https URL; falls back to the placeholder cover. */
  thumbnail: string;
  /** Best available image (large/medium/small/thumbnail) for the detail page; same fallback. */
  coverLarge: string;
  pageCount?: number;
  categories: string[];
  language?: string;
  infoLink?: string;
}

export interface SearchResult {
  books: Book[];
  /** Estimated by Google: it can be inaccurate and change between pages. */
  totalItems: number;
}

export interface SearchBooksArgs {
  q: string;
  /** 1-based page number. */
  page: number;
  pageSize: number;
}
