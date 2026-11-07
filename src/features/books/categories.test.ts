import { describe, expect, it } from 'vitest';
import { getCategoryLabels } from './categories';

describe('getCategoryLabels', () => {
  it('splits slash-separated paths into labels', () => {
    expect(getCategoryLabels(['Fiction / Fantasy / Epic'])).toEqual(['Fiction', 'Fantasy', 'Epic']);
  });

  it('removes duplicates across paths, keeping the first appearance order', () => {
    expect(
      getCategoryLabels(['Fiction / Fantasy', 'Fiction / Classics', 'Fantasy / Epic']),
    ).toEqual(['Fiction', 'Fantasy', 'Classics', 'Epic']);
  });

  it('compares case-insensitively and ignores extra spaces', () => {
    expect(getCategoryLabels(['Fiction', ' fiction  ', 'Young   Adult /  young adult'])).toEqual([
      'Fiction',
      'Young Adult',
    ]);
  });

  it('ignores empty parts', () => {
    expect(getCategoryLabels(['', ' / ', 'Poetry //'])).toEqual(['Poetry']);
  });

  it('returns an empty list for no categories', () => {
    expect(getCategoryLabels([])).toEqual([]);
  });
});
