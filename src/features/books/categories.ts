/**
 * Google's `categories` are slash-separated paths ("Fiction / Fantasy / Epic") and often repeat
 * the same parent across entries. This flattens them into unique, readable labels, keeping the
 * order of first appearance and ignoring case when comparing ("fiction" and "Fiction" are one).
 */
export function getCategoryLabels(categories: readonly string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const path of categories) {
    for (const part of path.split('/')) {
      const label = part.trim().replace(/\s+/g, ' ');
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }
  }
  return labels;
}
