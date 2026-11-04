import { describe, expect, it } from 'vitest';
import { shouldCommitQuery, shouldSyncInputFromUrl } from './queryInput';

describe('shouldCommitQuery', () => {
  it('waits for the debounce to settle', () => {
    expect(shouldCommitQuery({ q: '', input: 'abc', debouncedInput: 'ab' })).toBe(false);
  });
  it('commits a settled, changed text', () => {
    expect(shouldCommitQuery({ q: '', input: 'ab', debouncedInput: 'ab' })).toBe(true);
    expect(shouldCommitQuery({ q: 'a', input: 'ab', debouncedInput: 'ab' })).toBe(true);
  });
  it('commits again when the debounced value did not change (retype after back/forward)', () => {
    expect(shouldCommitQuery({ q: 'a', input: 'ab', debouncedInput: 'ab' })).toBe(true);
  });
  it('does nothing when the URL already matches (trimmed)', () => {
    expect(shouldCommitQuery({ q: 'ab', input: ' ab ', debouncedInput: ' ab ' })).toBe(false);
  });
});

describe('shouldSyncInputFromUrl', () => {
  it('ignores the echo of our own commit even if the user already typed more', () => {
    // We committed "ab"; meanwhile the input moved on to "abc".
    expect(shouldSyncInputFromUrl({ q: 'ab', input: 'abc', debouncedInput: 'ab' })).toBe(false);
  });
  it('syncs when the URL changes from outside (back/forward)', () => {
    expect(shouldSyncInputFromUrl({ q: 'a', input: 'ab', debouncedInput: 'ab' })).toBe(true);
  });
});
