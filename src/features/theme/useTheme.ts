import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyTheme,
  getInitialTheme,
  getSystemTheme,
  readStoredTheme,
  storeTheme,
  type Theme,
} from './theme';

/** Current colour mode (OS preference until the user picks one) and a toggle that persists it. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const chosen = useRef(false); // set when the user picks a theme, even if storage is blocked

  useEffect(() => applyTheme(theme), [theme]);

  // Follow the OS while the user has not chosen a theme.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const handleChange = () => {
      if (!chosen.current && readStoredTheme() === null) setTheme(getSystemTheme());
    };
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    chosen.current = true;
    setTheme(next);
    storeTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
}
