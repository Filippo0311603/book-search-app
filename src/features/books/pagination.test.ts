import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_RESULTS } from './constants';
import {
  clampPage,
  getEffectiveTotal,
  getPageItems,
  getStartIndex,
  getTotalPages,
} from './pagination';
import { parseSearchState } from './searchParams';

describe('pagination math', () => {
  it('computes startIndex from a 1-based page', () => {
    expect(getStartIndex(1, 10)).toBe(0);
    expect(getStartIndex(3, 15)).toBe(30);
  });

  it('computes the number of pages from totalItems', () => {
    expect(getTotalPages(0, 10)).toBe(0);
    expect(getTotalPages(1, 10)).toBe(1);
    expect(getTotalPages(41, 20)).toBe(3);
    expect(getTotalPages(40, 20)).toBe(2);
  });

  it('clamps pages into range', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 0)).toBe(1);
  });
});

describe('getEffectiveTotal', () => {
  const base = { startIndex: 0, itemCount: 10, pageSize: 10 };
  it('caps the estimated total', () => {
    expect(getEffectiveTotal({ ...base, totalItems: 1_000_000 })).toBe(MAX_TOTAL_RESULTS);
  });
  it('shrinks to the real end on a short page', () => {
    expect(getEffectiveTotal({ totalItems: 300, startIndex: 20, itemCount: 4, pageSize: 10 })).toBe(
      24,
    );
  });
  it('shrinks to the start of an empty page', () => {
    expect(getEffectiveTotal({ totalItems: 300, startIndex: 30, itemCount: 0, pageSize: 10 })).toBe(
      30,
    );
  });
});

describe('getPageItems', () => {
  it('lists every page when they fit', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(1, 0)).toEqual([]);
  });
  it('adds an end ellipsis near the start', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
  });
  it('adds ellipses on both sides in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
  });
  it('adds a start ellipsis near the end', () => {
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
  });
});

describe('parseSearchState', () => {
  const parse = (qs: string) => parseSearchState(new URLSearchParams(qs));
  it('applies defaults and trims the query', () => {
    expect(parse('q=%20dune%20')).toEqual({ q: 'dune', page: 1, pageSize: 10 });
  });
  it('rejects unsupported page sizes and invalid pages', () => {
    expect(parse('q=a&pageSize=7&page=abc')).toEqual({ q: 'a', page: 1, pageSize: 10 });
    expect(parse('q=a&page=-4').page).toBe(1);
  });
  it('clamps pages beyond the reachable range', () => {
    expect(parse('q=a&pageSize=20&page=999').page).toBe(MAX_TOTAL_RESULTS / 20);
  });
});
