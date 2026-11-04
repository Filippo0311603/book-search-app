interface QueryInputState {
  /** Query currently in the URL (trimmed). */
  q: string;
  /** Raw text of the input. */
  input: string;
  /** `input` after the debounce delay. */
  debouncedInput: string;
}

/**
 * Commit the typed text to the URL only once the debounce has settled (the debounced value has
 * caught up with the input) and the text actually differs from the URL. Committing a stale
 * debounced value while the user already typed more would fire a useless request.
 */
export function shouldCommitQuery({ q, input, debouncedInput }: QueryInputState): boolean {
  return debouncedInput === input && input.trim() !== q;
}

/**
 * Overwrite the input with a query coming from the URL (back/forward navigation), unless that
 * URL change is the echo of our own debounced commit: the user may have typed more characters
 * since, and replacing the input would lose them.
 */
export function shouldSyncInputFromUrl({ q, debouncedInput }: QueryInputState): boolean {
  return q !== debouncedInput.trim();
}
