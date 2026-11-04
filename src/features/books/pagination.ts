import { MAX_TOTAL_RESULTS } from './constants';

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
 * Google's `totalItems` is an estimate that changes between pages. We cap it, and shrink it
 * as soon as a page proves the real end was reached (short or empty page).
 */
export function getEffectiveTotal(params: {
  totalItems: number;
  startIndex: number;
  itemCount: number;
  pageSize: number;
}): number {
  const { totalItems, startIndex, itemCount, pageSize } = params;
  const capped = Math.min(totalItems, MAX_TOTAL_RESULTS);
  if (itemCount === 0) return Math.min(capped, startIndex);
  if (itemCount < pageSize) return Math.min(capped, startIndex + itemCount);
  return capped;
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
