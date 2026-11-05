export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** Zero-based `startIndex` expected by the API for a 1-based page. */
export function getStartIndex(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0 || pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

/**
 * Google's `totalItems` is only an estimate that changes between pages. The page count is
 * derived from it, corrected by what the current page proves: a short or empty page is the real
 * end of the results, and a full page means there are at least `startIndex + itemCount` items.
 */
export function getEffectiveTotal(params: {
  totalItems: number;
  startIndex: number;
  itemCount: number;
  pageSize: number;
}): number {
  const { totalItems, startIndex, itemCount, pageSize } = params;
  if (itemCount === 0) return Math.min(totalItems, startIndex);
  if (itemCount < pageSize) return startIndex + itemCount;
  return Math.max(totalItems, startIndex + itemCount);
}

/**
 * Pages to render: first, last, current +/- `siblings`, with ellipses for gaps.
 * Yields a constant number of slots when there are enough pages, so the control does not jump.
 */
export function getPageItems(current: number, totalPages: number, siblings = 1): PageItem[] {
  const maxSlots = siblings * 2 + 5; // first, last, current window, two ellipses
  if (totalPages <= maxSlots) return range(1, totalPages);

  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, totalPages - 1);
  const showStartEllipsis = left > 3;
  const showEndEllipsis = right < totalPages - 2;

  if (!showStartEllipsis) {
    return [...range(1, 3 + siblings * 2), 'ellipsis-end', totalPages];
  }
  if (!showEndEllipsis) {
    return [1, 'ellipsis-start', ...range(totalPages - (2 + siblings * 2), totalPages)];
  }
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', totalPages];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/**
 * What the pages already fetched for one query prove about where its results end:
 * - `goodEnd`: items up to this offset exist (the largest `startIndex + itemCount` seen);
 * - `badStart`: nothing exists from this offset on (the smallest start of an empty/rejected page,
 *   or the exact end shown by a short page).
 */
export interface ResultBounds {
  goodEnd: number;
  badStart: number;
}

export const NO_BOUNDS: ResultBounds = { goodEnd: 0, badStart: Number.POSITIVE_INFINITY };

export function recordPage(
  bounds: ResultBounds,
  page: { startIndex: number; itemCount: number; pageSize: number },
): ResultBounds {
  const { startIndex, itemCount, pageSize } = page;
  if (itemCount === 0) return { ...bounds, badStart: Math.min(bounds.badStart, startIndex) };
  const end = startIndex + itemCount;
  return {
    goodEnd: Math.max(bounds.goodEnd, end),
    badStart: itemCount < pageSize ? Math.min(bounds.badStart, end) : bounds.badStart,
  };
}

/** Narrows an estimated total with the known bounds (never below what was seen). */
export function applyBounds(total: number, bounds: ResultBounds): number {
  return Math.max(bounds.goodEnd, Math.min(total, bounds.badStart));
}

/** Last page known to contain results (0 when no page with results was seen for the query). */
export function getLastKnownPage(bounds: ResultBounds, pageSize: number): number {
  return getTotalPages(bounds.goodEnd, pageSize);
}
