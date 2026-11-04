import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

type QueryError = FetchBaseQueryError | SerializedError | undefined;

export function isRateLimitError(error: QueryError): boolean {
  return Boolean(error && 'status' in error && error.status === 429);
}

export function isNotFoundError(error: QueryError): boolean {
  return Boolean(error && 'status' in error && error.status === 404);
}

/** Transient failures worth retrying automatically. 4xx (including 429) never are. */
export function isRetryableError(error: FetchBaseQueryError): boolean {
  return (
    error.status === 'FETCH_ERROR' ||
    error.status === 'TIMEOUT_ERROR' ||
    (typeof error.status === 'number' && error.status >= 500)
  );
}

export function getErrorMessage(error: QueryError): string {
  if (isRateLimitError(error)) {
    return 'Too many requests: the Google Books quota has been reached. Wait a few seconds and retry.';
  }
  if (isNotFoundError(error)) return 'The requested book could not be found.';
  if (error && 'status' in error) {
    if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
      return 'Network error: check your connection and try again.';
    }
    if (typeof error.status === 'number' && error.status >= 500) {
      return 'Google Books is temporarily unavailable. Please try again.';
    }
  }
  return 'Something went wrong while contacting Google Books.';
}
