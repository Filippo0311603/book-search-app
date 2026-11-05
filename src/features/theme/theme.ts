export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'booksearch-theme';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** The explicit choice saved by the toggle. Storage can be blocked or throw (private mode). */
export function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not persisted: the choice still applies for this visit.
  }
}

/** The OS preference (`prefers-color-scheme`); light when it cannot be read. */
export function getSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Theme to start from. The inline script in `index.html` has already set `data-bs-theme` before
 * the first paint (no flash), so that is the first source; the rest mirrors the script for
 * environments that do not run it.
 */
export function getInitialTheme(): Theme {
  const applied = document.documentElement.getAttribute('data-bs-theme');
  return isTheme(applied) ? applied : (readStoredTheme() ?? getSystemTheme());
}

/** Bootstrap 5.3 colour modes: the theme is the `data-bs-theme` attribute on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-bs-theme', theme);
}
