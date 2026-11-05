import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { isRetryableError } from '../features/books/errors';
import { mapVolume, mapVolumesResponse } from '../features/books/mappers';
import { getStartIndex } from '../features/books/pagination';
import type {
  Book,
  SearchBooksArgs,
  SearchResult,
  Volume,
  VolumesResponse,
} from '../features/books/types';

export const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

/**
 * Optional: raises the anonymous quota. Appended as `key=` only when defined.
 * Read through `process.env` on purpose: it works both in Vite (inlined by `define` in
 * vite.config.ts) and in CodeSandbox's browser bundler, which reads a `.env` file into
 * `process.env` but cannot evaluate `import.meta.env`.
 */
const apiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY || undefined;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: GOOGLE_BOOKS_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

/**
 * Retries only transient failures (network, timeout, 5xx), with exponential backoff.
 * 4xx are final, and 429 above all: retrying would only burn more of the quota.
 * Aborted requests (obsolete searches) are never retried.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error && (api.signal.aborted || !isRetryableError(result.error))) {
      retry.fail(result.error);
    }
    return result;
  },
  { maxRetries: MAX_RETRIES },
);

export const googleBooksApi = createApi({
  reducerPath: 'googleBooksApi',
  baseQuery,
  endpoints: (builder) => ({
    searchBooks: builder.query<SearchResult, SearchBooksArgs>({
      query: ({ q, page, pageSize }) => ({
        url: '/volumes',
        params: {
          q,
          startIndex: getStartIndex(page, pageSize),
          maxResults: pageSize,
          printType: 'books',
          key: apiKey,
        },
      }),
      transformResponse: (response: VolumesResponse) => mapVolumesResponse(response),
      keepUnusedDataFor: 300,
    }),
    getBook: builder.query<Book, string>({
      query: (id) => ({ url: `/volumes/${encodeURIComponent(id)}`, params: { key: apiKey } }),
      transformResponse: (response: Volume) => mapVolume(response),
    }),
  }),
});

export const { useGetBookQuery } = googleBooksApi;
