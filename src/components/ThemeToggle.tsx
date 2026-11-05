import { useTheme } from '../features/theme/useTheme';
import { MoonFillIcon, SunFillIcon } from './icons';

/** Light/dark switch for the navbar. The label is fixed and `aria-pressed` carries the state. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="btn btn-outline-light btn-sm"
      aria-label="Dark mode"
      aria-pressed={isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
    >
      {isDark ? <MoonFillIcon /> : <SunFillIcon />}
    </button>
  );
}
