/**
 * Router basename from the deploy base path (`process.env.BASE_PATH`, set by `define` in
 * vite.config.ts). `/book-search-app/` becomes `/book-search-app`; unset (e.g. CodeSandbox) or `/`
 * becomes `/`. Never `import.meta`: CodeSandbox's legacy bundler cannot evaluate it.
 */
export function getBasename(base: string | undefined): string {
  const trimmed = (base ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}
