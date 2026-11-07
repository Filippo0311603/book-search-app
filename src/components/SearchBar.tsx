import type { RefObject } from 'react';
import { useFocusShortcut } from '../hooks/useFocusShortcut';
import { SearchIcon, XLgIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when the clear button is used; the input is focused again afterwards. */
  onClear: () => void;
  /** Owned by the page so it can move focus here (e.g. after a suggested search). */
  inputRef: RefObject<HTMLInputElement | null>;
}

export function SearchBar({ value, onChange, onClear, inputRef }: SearchBarProps) {
  useFocusShortcut(inputRef, '/');

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="book-search" className="form-label visually-hidden">
        Search books
      </label>
      {/* `search-group` draws one focus ring around icon, input and buttons (see _controls.scss). */}
      <div className="position-relative">
        <div className="input-group input-group-lg search-group">
          <span className="input-group-text" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id="book-search"
            type="search"
            className="form-control"
            placeholder="Search by title, author, ISBN..."
            autoComplete="off"
            aria-keyshortcuts="/"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {value ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              aria-label="Clear search"
              onClick={handleClear}
            >
              <XLgIcon />
            </button>
          ) : null}
        </div>
        {/* Overlay, not an input-group child: the input stays the last child (rounded corners). */}
        {!value && (
          <kbd className="search-hint d-none d-md-block" aria-hidden="true">
            /
          </kbd>
        )}
      </div>
    </form>
  );
}
