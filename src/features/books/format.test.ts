import { describe, expect, it } from 'vitest';
import { formatPublishedDate } from './format';

describe('formatPublishedDate', () => {
  it('formats a full date as "day Mon year"', () => {
    expect(formatPublishedDate('2015-12-08')).toBe('8 Dec 2015');
    expect(formatPublishedDate('2001-05-17')).toBe('17 May 2001');
    expect(formatPublishedDate('2020-02-29')).toBe('29 Feb 2020');
  });

  it('formats a year and month as "Mon year"', () => {
    expect(formatPublishedDate('2017-06')).toBe('Jun 2017');
    expect(formatPublishedDate('1999-01')).toBe('Jan 1999');
  });

  it('keeps a bare year as it is', () => {
    expect(formatPublishedDate('2009')).toBe('2009');
  });

  it('returns undefined when there is no date', () => {
    expect(formatPublishedDate(undefined)).toBeUndefined();
    expect(formatPublishedDate('')).toBeUndefined();
  });

  it('returns unexpected values unchanged instead of hiding them', () => {
    expect(formatPublishedDate('c. 1990')).toBe('c. 1990');
    expect(formatPublishedDate('2015-13-01')).toBe('2015-13-01');
    expect(formatPublishedDate('2015-02-30')).toBe('2015-02-30');
    expect(formatPublishedDate('2015-12-00')).toBe('2015-12-00');
  });
});
