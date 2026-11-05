/** "en" -> "English". Falls back to the raw code when unknown or unsupported. */
export function formatLanguage(code?: string): string | undefined {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

// Fixed locale: the UI is in English whatever the browser language is. Only the month name comes
// from Intl; the day-month-year order is ours, because the 'en' locale would give "Dec 8, 2015".
const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });

/**
 * Google's `publishedDate` is "YYYY-MM-DD", "YYYY-MM" or "YYYY" depending on the book:
 * "2015-12-08" -> "8 Dec 2015", "2017-06" -> "Jun 2017", "2009" -> "2009".
 * Anything else (or an impossible date) is returned as it is rather than hidden.
 */
export function formatPublishedDate(value?: string): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value.trim());
  if (!match) return value;

  const [, year, month, day] = match;
  if (!month) return year;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;

  const monthName = monthFormatter.format(new Date(Date.UTC(Number(year), monthIndex, 1)));
  if (!day) return `${monthName} ${year}`;

  const dayNumber = Number(day);
  const exists =
    new Date(Date.UTC(Number(year), monthIndex, dayNumber)).getUTCMonth() === monthIndex;
  return dayNumber >= 1 && exists ? `${dayNumber} ${monthName} ${year}` : value;
}
