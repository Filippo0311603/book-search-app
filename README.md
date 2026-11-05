# BookSearch

[![CI](https://github.com/Filippo0311603/book-search-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Filippo0311603/book-search-app/actions/workflows/ci.yml)

A responsive single-page app to search books with the [Google Books API](https://developers.google.com/books/docs/v1/reference/volumes/list): live search, paginated results and a detail page.

Built with **Vite, React 19, TypeScript (strict), Redux Toolkit + RTK Query, React Router 7 and Bootstrap 5 (Sass, custom theme)**.

## Getting started

Requires Node.js >= 20.19 (`engines` in `package.json`; `.nvmrc` pins 22, which CodeSandbox and nvm pick up).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script               | What it does                                |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Vite dev server (bound to all interfaces)   |
| `npm run build`      | Type-check (`tsc -b`) and production build  |
| `npm run preview`    | Serve the production build                  |
| `npm test`           | Vitest + React Testing Library + MSW (once) |
| `npm run test:watch` | Tests in watch mode                         |
| `npm run lint`       | ESLint                                      |
| `npm run format`     | Prettier                                    |

### Optional API key

The app works anonymously, but the shared anonymous quota is small. To use your own key, copy `.env.example` to `.env` and set `VITE_GOOGLE_BOOKS_API_KEY`. The `key` parameter is appended to requests only when the variable is set. (Vite inlines `VITE_*` variables in the bundle: restrict the key by HTTP referrer in Google Cloud Console.)

### CodeSandbox

Import the GitHub repository from <https://codesandbox.io/dashboard/import> (or open `https://codesandbox.io/p/github/<user>/<repo>`). `.codesandbox/tasks.json` installs dependencies and starts `npm run dev` on port 5173; `vite.config.ts` sets `server.host: true` so the preview is reachable. No other configuration is needed. To set an API key there, add the `VITE_GOOGLE_BOOKS_API_KEY` secret/env variable and restart the dev task.

## Requirements mapping

| Requirement                                           | Where                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live search (updates while typing)                    | `SearchPage` + `useDebouncedValue` + `useBookSearch`                                                                                                                      |
| Pagination with `startIndex` / `maxResults`           | `services/googleBooksApi.ts`, `features/books/pagination.ts`                                                                                                              |
| Page count computed from `totalItems`                 | `getEffectiveTotal` / `getTotalPages`                                                                                                                                     |
| Page size in [5, 10, 15, 20]                          | `PAGE_SIZES` constant, `PageSizeSelect`                                                                                                                                   |
| Paginator (first/prev/window with ellipsis/next/last) | `components/Paginator.tsx`, `getPageItems`                                                                                                                                |
| Detail page with `infoLink`                           | `pages/BookDetailPage.tsx` (`target="_blank" rel="noopener noreferrer"`)                                                                                                  |
| Missing cover placeholder                             | `PLACEHOLDER_COVER_URL` (one constant), used by the mapper and by `<img onError>`                                                                                         |
| Description clamped to 2 lines                        | `.line-clamp-2` in `styles/_components.scss`, HTML stripped in the mapper                                                                                                 |
| Loading / error (incl. 429 + retry) / empty / 404     | `BookListSkeleton`, `StatusMessage`, `NotFoundPage`                                                                                                                       |
| Bootstrap 5 with custom theme colors via Sass         | `styles/_variables.scss` overrides `$primary` etc. before importing Bootstrap                                                                                             |
| Accessibility                                         | labelled controls, `role="search"`, `aria-current`, `aria-label`s, live regions, focus states, one `<h1>` and a `<title>` per page, AA contrast on the active page button |

## Technical choices

### Why RTK Query

Server state (loading, error, caching, deduplication) is exactly what RTK Query models. Results are cached **per arguments** (`{q, page, pageSize}`), so returning to a page, or coming back from the detail page, is served from cache with no request. Responses are typed (`Volume`, `VolumesResponse`) and mapped to a clean domain `Book` inside `transformResponse`, so components never see the raw payload and the cache already holds sanitized data.

### Network management

- **Debounce (300 ms)** on the search input. Google Books has a small anonymous quota and answers HTTP 429 when it is exceeded; one request per keystroke would exhaust it quickly. A burst of typing becomes a single request, while the input itself stays instantly responsive (local state).
- **No stale overwrites.** Results are keyed by arguments, and the UI only reads the entry matching the _current_ arguments, so a slow response for an old query can never replace a newer one.
- **Obsolete requests are aborted.** When the arguments change (or the query is cleared), the in-flight request is cancelled through its `AbortSignal` (`useBookSearch`). Stale responses could not overwrite newer ones anyway; the benefit is not wasting bandwidth and quota on results nobody will see. Aborting happens only when the args really change, so React StrictMode's effect re-run does not cancel its own request.
- **No flicker between pages.** While the next page of the same query loads, the previous results and the paginator stay on screen (dimmed, `aria-busy`); the skeleton is only shown for the first load of a query.
- **Smart retries.** Only transient failures (network error, timeout, 5xx) are retried automatically, with exponential backoff and at most 2 retries. 4xx errors are final; 429 in particular is never retried automatically (it would only worsen the quota problem). The user gets an explicit message and a **Retry** button.
- **Empty query = no request.** The query is trimmed; whitespace-only input shows the initial empty state.
- Requests have a 10 s timeout.

### Why the URL is the source of truth

`q`, `page` and `pageSize` live in the query string (`useSearchParams`, wrapped by `useSearchState`). Back/forward, refresh, shareable links and "detail page, then back to the same results" work without extra code. The query string is validated on read (`parseSearchState`): unknown page sizes and out-of-range pages fall back to safe values. The input text is local state, synced to the URL after the debounce (history entries are _replaced_ while typing, _pushed_ on page changes). A small Redux slice only holds a UI preference (the preferred page size, used as the default when the URL has none). Changing the query or the page size resets to page 1. The detail link carries the results query string in the router location state, so "Back to results" returns to the exact same view.

## Known Google Books API quirks (and how they are handled)

- **`totalItems` is approximate** and can change from page to page. It is capped at `MAX_TOTAL_RESULTS` (360, a multiple of every page size so the last page is never partial), and shrunk as soon as a short or empty page reveals the real end (`getEffectiveTotal`).
- **Capped totals are shown honestly:** when Google estimates more than the cap, the summary reads "Showing 1-10 of 360+ results" instead of claiming an exact number, and navigation stops at the cap.
- **Pages past the real end can come back empty.** The UI shows "No more results" with a button to jump to the last valid page. Page numbers in the URL are clamped to the reachable range.
- **Anonymous quota / 429**: see above (debounce, no auto-retry on 429, clear message).
- Descriptions contain HTML and covers are served over `http` with a page-curl parameter: both are normalized in `features/books/mappers.ts` (HTML is stripped for lists and sanitized with DOMPurify for the detail page; covers are upgraded to `https`).
- `items` is omitted entirely when there are no results.

## Known limitations

- "Back to results" restores the exact search through router state, which only exists in the tab where the book was opened. A detail page opened in a new tab links back to the plain search page without the previous query.

## Project structure

```
src/
  app/                 store (factory), typed hooks, route table, App
  services/            googleBooksApi.ts: RTK Query API (base query, retry policy, endpoints)
  features/books/
    components/        BookCard, BookList, BookCover, BookListSkeleton, BookBackLink
    hooks/             useDebouncedValue, useBookSearch, useSearchState
    constants.ts       placeholder URL, page sizes, debounce delay, results cap
    types.ts           API types (Volume, VolumeInfo, VolumesResponse) and domain Book
    mappers.ts         Volume -> Book
    pagination.ts      pure pagination math
    searchParams.ts    URL query string parsing/validation
    errors.ts          error classification and messages
    preferencesSlice.ts
  components/          Layout, SearchBar, PageSizeSelect, Paginator, StatusMessage
  pages/               SearchPage, BookDetailPage, NotFoundPage
  styles/              _variables.scss (theme), _components.scss, main.scss
  test/                MSW server, fixtures, render helper, setup
```

## Testing

Unit tests cover the mapper (placeholder, http to https, HTML stripping), pagination math, URL parsing and the debounce hook. Integration tests render the real routes against a mocked network (MSW): typing triggers one debounced request and renders results, page size changes, paginator navigation sends the right `startIndex`, 429 error and retry, no results, past-the-end pages, back navigation from the detail page, the detail page `infoLink`, 404 routes.

The app is rendered inside `<StrictMode>` in tests, like in `main.tsx`. Network behaviour is covered explicitly: out-of-order responses, real request cancellation (the MSW handler observes `request.signal` abort), no abort on StrictMode re-runs, cache hits when returning to a visited page, and previous results kept while a page loads. jsdom ships its own `AbortSignal`, which Node's `fetch` rejects, so tests run in a tiny custom environment (`src/test/jsdom-node-abort.ts`) that is jsdom plus Node's native `AbortController`/`AbortSignal`.
