import { describe, expect, it } from 'vitest';
import {
  NO_BOUNDS,
  applyBounds,
  clampPage,
  getEffectiveTotal,
  getLastKnownPage,
  getPageItems,
  getStartIndex,
  getTotalPages,
  recordPage,
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
  it('uses the API total as is, however large: no artificial cap', () => {
    expect(getEffectiveTotal({ ...base, totalItems: 1_000_000 })).toBe(1_000_000);
    expect(getTotalPages(1_000_000, 10)).toBe(100_000);
  });
  it('never reports fewer items than the page just proved to exist', () => {
    expect(getEffectiveTotal({ totalItems: 12, startIndex: 20, itemCount: 10, pageSize: 10 })).toBe(
      30,
    );
  });
  it('shrinks to the real end on a short page that is also the last page by the estimate', () => {
    expect(getEffectiveTotal({ totalItems: 27, startIndex: 20, itemCount: 4, pageSize: 10 })).toBe(
      24,
    );
  });
  it('does not treat a short page in the middle of the results as the end', () => {
    // Google sometimes returns fewer than maxResults although more items exist.
    expect(getEffectiveTotal({ totalItems: 300, startIndex: 20, itemCount: 4, pageSize: 10 })).toBe(
      300,
    );
    expect(getTotalPages(300, 10)).toBe(30);
  });
  it('treats an empty page as the end whatever the estimate says', () => {
    expect(getEffectiveTotal({ totalItems: 300, startIndex: 20, itemCount: 0, pageSize: 10 })).toBe(
      20,
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
    expect(parse('q=a&page=0').page).toBe(1);
    expect(parse('q=a&pageSize=7&page=abc')).toEqual({ q: 'a', page: 1, pageSize: 10 });
    expect(parse('q=a&page=-4').page).toBe(1);
  });
  it('keeps large pages: the upper bound depends on the API total, checked once results arrive', () => {
    expect(parse('q=a&pageSize=20&page=999').page).toBe(999);
  });
});

describe('result bounds', () => {
  it('starts unbounded', () => {
    expect(applyBounds(2000, NO_BOUNDS)).toBe(2000);
    expect(getLastKnownPage(NO_BOUNDS, 10)).toBe(0);
  });
  it('remembers the furthest page with data', () => {
    let b = recordPage(NO_BOUNDS, { startIndex: 0, itemCount: 10, pageSize: 10, totalItems: 2000 });
    b = recordPage(b, { startIndex: 20, itemCount: 10, pageSize: 10, totalItems: 2000 });
    b = recordPage(b, { startIndex: 10, itemCount: 10, pageSize: 10, totalItems: 2000 }); // order does not matter
    expect(b).toEqual({ goodEnd: 30, badStart: Number.POSITIVE_INFINITY });
    expect(getLastKnownPage(b, 10)).toBe(3);
    expect(getLastKnownPage(b, 15)).toBe(2); // the page holding item 30
  });
  it('a short page in the middle proves what it holds, but not the end', () => {
    const b = recordPage(NO_BOUNDS, {
      startIndex: 40,
      itemCount: 4,
      pageSize: 10,
      totalItems: 2000,
    });
    expect(b).toEqual({ goodEnd: 44, badStart: Number.POSITIVE_INFINITY });
    expect(applyBounds(2000, b)).toBe(2000);
  });
  it('an empty page bounds the end, a short last page by the estimate fixes it', () => {
    let b = recordPage(NO_BOUNDS, {
      startIndex: 20,
      itemCount: 10,
      pageSize: 10,
      totalItems: 2000,
    });
    b = recordPage(b, { startIndex: 1990, itemCount: 0, pageSize: 10, totalItems: 2000 });
    expect(applyBounds(2000, b)).toBe(1990);
    b = recordPage(b, { startIndex: 40, itemCount: 4, pageSize: 10, totalItems: 44 });
    expect(applyBounds(2000, b)).toBe(44);
  });
  it('never narrows below what was seen', () => {
    const b = recordPage(NO_BOUNDS, {
      startIndex: 50,
      itemCount: 10,
      pageSize: 10,
      totalItems: 2000,
    });
    expect(applyBounds(20, b)).toBe(60);
  });
});
