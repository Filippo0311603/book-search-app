/**
 * Accepted width/height range for a cover. Books are about 2:3 (0.67); square and slightly
 * landscape covers exist, so the range is wide on purpose.
 */
export const MIN_COVER_RATIO = 0.4;
export const MAX_COVER_RATIO = 1.5;

/**
 * For some scanned volumes Google serves a crop instead of the cover at the larger zoom levels
 * (small/medium/large/extraLarge): e.g. an 800x128 strip with one line of the title page, while
 * the thumbnail is the whole page. An image this far from a book's shape is not a usable cover.
 * Unknown sizes (0, as in jsdom or some SVGs) are not judged.
 */
export function hasBookShape(width: number, height: number): boolean {
  if (!width || !height) return true;
  const ratio = width / height;
  return ratio >= MIN_COVER_RATIO && ratio <= MAX_COVER_RATIO;
}
