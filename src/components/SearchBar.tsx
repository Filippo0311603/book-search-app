import { useRef } from 'react';
import { SearchIcon, XLgIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when the clear button is used; the input is focused again afterwards. */
  onClear: () => void;
}

export function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="book-search" className="form-label visually-hidden">
        Search books
      </label>
      <div className="input-group input-group-lg">
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label="Clear search"
            onClick={handleClear}
          >
            <XLgIcon />
          </button>
        )}
      </div>
    </form>
  );
}
