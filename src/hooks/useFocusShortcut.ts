import { useEffect, type RefObject } from 'react';

/** True when typing into this element must not be hijacked by a global shortcut. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Focuses `ref` when `key` is pressed outside text fields (e.g. "/" to jump to the search box). */
export function useFocusShortcut(ref: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.defaultPrevented || isTextEntry(event.target)) return;
      event.preventDefault(); // do not type the key into the field we are about to focus
      ref.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ref, key]);
}
