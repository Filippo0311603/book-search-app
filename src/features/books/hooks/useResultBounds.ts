import { useState } from 'react';
import { NO_BOUNDS, recordPage, type ResultBounds } from '../pagination';

interface PageObservation {
  startIndex: number;
  itemCount: number;
  pageSize: number;
  totalItems: number;
}

/**
 * Accumulates, per query, what the fetched pages prove about the end of the results (Google's
 * `totalItems` is only an estimate). Feeds the paginator and the "go back" button so that one
 * click lands on a page that has results, instead of walking back one empty page at a time.
 * Reset whenever the query changes. Derived from observations during render: no effect, no store.
 */
export function useResultBounds(q: string, observation: PageObservation | null): ResultBounds {
  const [state, setState] = useState({ q, bounds: NO_BOUNDS });

  const base = state.q === q ? state.bounds : NO_BOUNDS;
  const next = observation ? recordPage(base, observation) : base;
  if (state.q !== q || next.goodEnd !== base.goodEnd || next.badStart !== base.badStart) {
    setState({ q, bounds: next });
  }
  return next;
}
