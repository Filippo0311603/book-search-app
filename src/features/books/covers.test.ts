import { describe, expect, it } from 'vitest';
import { hasBookShape } from './covers';

describe('hasBookShape', () => {
  it('accepts book-like covers, square ones included', () => {
    expect(hasBookShape(800, 1200)).toBe(true);
    expect(hasBookShape(128, 188)).toBe(true);
    expect(hasBookShape(600, 600)).toBe(true);
  });

  it('rejects strips and spines (real case: Google zoom=4 crop of 800x128)', () => {
    expect(hasBookShape(800, 128)).toBe(false);
    expect(hasBookShape(1280, 205)).toBe(false);
    expect(hasBookShape(40, 600)).toBe(false);
  });

  it('does not judge unknown sizes', () => {
    expect(hasBookShape(0, 0)).toBe(true);
  });
});
