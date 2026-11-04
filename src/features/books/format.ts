/** "en" -> "English". Falls back to the raw code when unknown or unsupported. */
export function formatLanguage(code?: string): string | undefined {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
