# BookSearch

[![CI](https://github.com/Filippo0311603/book-search-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Filippo0311603/book-search-app/actions/workflows/ci.yml)

**Live demo:** <https://filippo0311603.github.io/book-search-app/> (GitHub Pages). The primary hosting required by the brief is CodeSandbox, see [CodeSandbox](#codesandbox).

A responsive single-page app to search books with the [Google Books API](https://developers.google.com/books/docs/v1/reference/volumes/list): live search, paginated results and a detail page.

Built with **Vite, React 19, TypeScript (strict), Redux Toolkit + RTK Query, React Router 7 and Bootstrap 5 (Sass, custom theme)**.

## Features

- Live search: results update on every keystroke; `/` focuses the search box from anywhere (outside text fields), with a hint inside the box on desktop.
- Paginated results (page size 5, 10, 15 or 20) with a windowed paginator, and a detail page with a link to Google Books.
- Empty state with suggested searches (one click fills the box and searches).
- Light and dark theme (Bootstrap 5.3 colour modes): follows the OS preference, with a navbar toggle whose choice is saved in `localStorage`. A tiny inline script in `index.html` sets the theme before the first paint, so there is no flash of the wrong one.
- Readable publication dates (`8 Dec 2015`, `Jun 2017`, `2009`), a crisp large cover on the detail page, a hover lift on cards and a fade-in of results (both off with `prefers-reduced-motion`).
- Responsive from 360 px up: the paginator never wraps or overflows on phones (first/last buttons are hidden below `sm`).

### Accessibility

- Landmarks: skip link, `header` + `nav`, `main`, `footer`, `role="search"`; one `<h1>` per page.
- The result count ("Showing X–Y of about Z results") lives in an always-mounted `role="status"` / `aria-live="polite"` region, so changes are announced.
- Visible focus everywhere: one ring around the whole search control, a ring around the whole card when its title link is focused, outlines on links.
- The theme toggle is a button with a fixed `aria-label` and `aria-pressed`; the paginator has labelled buttons and `aria-current="page"`.
- Text contrast meets WCAG AA (at least 5:1) in both themes, measured in the browser for body and secondary text, links, the paginator and the active page.

## Getting started

Requires Node.js >= 20.19 (`engines` in `package.json`; `.nvmrc` pins 22, which nvm and a CodeSandbox Devbox pick up; browser sandboxes run no Node).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script               | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Vite dev server (bound to all interfaces)                      |
| `npm run build:css`  | Compile `main.scss` to `main.css` (automatic in `dev`/`build`) |
| `npm run build`      | Type-check (`tsc -b`) and production build                     |
| `npm run preview`    | Serve the production build                                     |
| `npm test`           | Vitest + React Testing Library + MSW (once)                    |
| `npm run test:watch` | Tests in watch mode                                            |
| `npm run lint`       | ESLint                                                         |
| `npm run format`     | Prettier                                                       |

### Optional API key

The app works anonymously, but the shared anonymous quota is small. To use your own key, copy `.env.example` to `.env` and set `VITE_GOOGLE_BOOKS_API_KEY`. The `key` parameter is appended to requests only when the variable is set. The source reads it as `process.env.VITE_GOOGLE_BOOKS_API_KEY`; `vite.config.ts` loads the `.env` files and inlines the value with `define` (see [CodeSandbox](#codesandbox) for why it is not `import.meta.env`). It ends up in the bundle: restrict the key by HTTP referrer in Google Cloud Console. Tests need no key (all requests are mocked with MSW).

### Styles: SCSS source, committed CSS

The SCSS in `src/styles/` is the source of truth. `src/styles/main.css` is **generated** from `main.scss` by `npm run build:css` and is committed on purpose (see [CodeSandbox](#codesandbox)). `npm run dev` and `npm run build` regenerate it first, and CI runs `git diff --exit-code src/styles/main.css` after the build, so it cannot drift from the SCSS. Do not edit it by hand: change the SCSS, run `npm run dev`/`build` (or `npm run build:css`) and commit both. Icons are inline SVG components (`src/components/icons.tsx`, paths from [Bootstrap Icons](https://icons.getbootstrap.com), MIT), not the icon font.

### CodeSandbox

**Live sandbox:** see the link below. <!-- PLACEHOLDER: replace this line with the public sandbox URL before submitting. -->

**Open it from GitHub:** <https://codesandbox.io/s/github/Filippo0311603/book-search-app>. This creates a browser sandbox ("Sandbox (Web)"). To use the Google Books API with a key, click **Fork** (top right), then create a `.env` file at the root of the fork containing `VITE_GOOGLE_BOOKS_API_KEY=<your key>`. Without a key the app still works, within Google's small anonymous quota. Note that browser sandboxes are public, so a `.env` there is readable by anyone, and the key shows up in request URLs anyway: the real protection is restricting it in Google Cloud Console to the Books API and to the `*.csb.app` and `filippo0311603.github.io` referrers.

**Why it is set up this way:**

- CodeSandbox removed the GitHub "Repositories" import (`/p/github/...`) in mid-2026, and Devboxes (real VMs, where `npm run dev` would run Vite normally) need paid VM credits.
- The remaining free path is the browser sandbox, which does **not** run Vite: it uses CodeSandbox's own in-browser bundler with the `create-react-app` preset (pinned by `sandbox.config.json`).
- That bundler cannot compile Sass (its Sass worker is blocked), hence the **precompiled, committed `main.css`**.
- It cannot evaluate `import.meta.env`, but it exposes a `.env` file on `process.env`, hence the key is read as **`process.env.VITE_GOOGLE_BOOKS_API_KEY`**, which Vite also supports through `define`.
- The icon font's relative URLs do not resolve there, hence the **inline SVG icons**.

`.codesandbox/tasks.json` is not used by the browser sandbox. It is kept for anyone who converts the sandbox to a Devbox (installs dependencies, runs `npm run dev` on port 5173; `vite.config.ts` sets `server.host: true` so the preview is reachable).

Console messages from CodeSandbox's own runtime files (`compile.ts`, `cache.js`, `metrics.js`, "unload is not allowed", a CORS error on `/api/v1/sandboxes/.../cache`) come from CodeSandbox, not from the app.

## Deployment

`.github/workflows/deploy.yml` publishes the app to GitHub Pages on every push to `main` (and on manual `workflow_dispatch`). The `build` job runs `npm ci`, lint and tests, builds with the base path, and uploads `dist`; the `deploy` job only runs if it succeeds.

- **Secret:** `VITE_GOOGLE_BOOKS_API_KEY` (repository secret, passed to `npm run build`). Without it the app still works with the small anonymous quota. Pages settings: Source = GitHub Actions.
- **Base path:** the workflow builds with `BASE_PATH=/book-search-app/`. `vite.config.ts` uses it for Vite's `base` and exposes it as `process.env.BASE_PATH` (via `define`, no `import.meta`) for the router `basename`. When unset (local dev, default build, CodeSandbox) it is `/`.
- **Deep links:** GitHub Pages has no rewrite rules, so the workflow copies `dist/index.html` to `dist/404.html`. Any unknown path (e.g. `/book-search-app/books/<id>` or a reload) is served the app, and React Router resolves the URL; real unknown paths show the app's own not-found page. GitHub Pages serves deep links through `404.html` with HTTP status 404. Users see the app normally; only crawlers and link checkers see the 404.
- **Local check** of the production build with the base path:
  - Git Bash: `MSYS_NO_PATHCONV=1 BASE_PATH=/book-search-app/ npm run build`. Git Bash otherwise rewrites the `/book-search-app/` value into a Windows path, so `MSYS_NO_PATHCONV=1` is needed.
  - PowerShell: `$env:BASE_PATH='/book-search-app/'; npm run build`.
  - Then `npm run preview` to serve the build.

## Requirements mapping

| Requirement                                           | Where                                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Live search (updates while typing)                    | `SearchPage` (one search per input change) + `useBookSearch`                      |
| Pagination with `startIndex` / `maxResults`           | `services/googleBooksApi.ts`, `features/books/pagination.ts`                      |
| Page count computed from `totalItems`                 | `getEffectiveTotal` / `getTotalPages`                                             |
| Page size in [5, 10, 15, 20]                          | `PAGE_SIZES` constant, `PageSizeSelect`                                           |
| Paginator (first/prev/window with ellipsis/next/last) | `components/Paginator.tsx`, `getPageItems`                                        |
| Detail page with `infoLink`                           | `pages/BookDetailPage.tsx` (`target="_blank" rel="noopener noreferrer"`)          |
| Missing cover placeholder                             | `PLACEHOLDER_COVER_URL` (one constant), used by the mapper and by `<img onError>` |
| Description clamped to 2 lines                        | `.line-clamp-2` in `styles/_components.scss`, HTML stripped in the mapper         |
| Loading / error (incl. 429 + retry) / empty / 404     | `BookListSkeleton`, `StatusMessage`, `NotFoundPage`                               |
| Bootstrap 5 with custom theme colors via Sass         | `styles/_variables.scss` overrides `$primary` etc. before importing Bootstrap     |
| Accessibility                                         | see [Accessibility](#accessibility)                                               |

## Technical choices

### Why RTK Query

Server state (loading, error, caching, deduplication) is exactly what RTK Query models. Results are cached **per arguments** (`{q, page, pageSize}`), so returning to a page, or coming back from the detail page, is served from cache with no request. Responses are typed (`Volume`, `VolumesResponse`) and mapped to a clean domain `Book` inside `transformResponse`, so components never see the raw payload and the cache already holds sanitized data.

### Network management

- **One request per typed character, as the brief requires** ("update the results for every new character"). There is deliberately no debounce. The cost is more traffic against Google's small anonymous quota, so the rest of the strategy is about keeping that cost low and the UI correct: obsolete requests are aborted, the RTK Query cache deduplicates repeated arguments, and a 429 is handled explicitly (below). The input itself is local state and stays instantly responsive.
- **No stale overwrites.** Results are keyed by arguments, and the UI only reads the entry matching the _current_ arguments, so a slow response for an old query can never replace a newer one.
- **Obsolete requests are aborted.** When the arguments change (or the query is cleared), the in-flight request is cancelled through its `AbortSignal` (`useBookSearch`). Stale responses could not overwrite newer ones anyway; the benefit is not wasting bandwidth and quota on results nobody will see. Aborting happens only when the args really change, so React StrictMode's effect re-run does not cancel its own request.
- **No flicker between pages.** While the next page of the same query loads, the previous results and the paginator stay on screen (dimmed, `aria-busy`); the skeleton is only shown for the first load of a query.
- **Smart retries.** Only transient failures (network error, timeout, 5xx) are retried automatically, with exponential backoff and at most 2 retries. 4xx errors are final; 429 in particular is never retried automatically (it would only worsen the quota problem). The user gets an explicit message and a **Retry** button.
- **Empty query = no request.** The query is trimmed; whitespace-only input shows the initial empty state.
- Requests have a 10 s timeout.

### Why the URL is the source of truth

`q`, `page` and `pageSize` live in the query string (`useSearchParams`, wrapped by `useSearchState`). Back/forward, refresh, shareable links and "detail page, then back to the same results" work without extra code. The query string is validated on read (`parseSearchState`): unknown page sizes and invalid pages fall back to safe values. The input text is local state, written to the URL on every change (history entries are _replaced_ while typing, _pushed_ on page changes) and re-read from it only on browser back/forward. A small Redux slice only holds a UI preference (the preferred page size, used as the default when the URL has none). Changing the query or the page size resets to page 1. The detail link carries the results query string in the router location state, so "Back to results" returns to the exact same view.

## Known Google Books API quirks (and how they are handled)

- **`totalItems` is approximate** and can change from page to page. The page count is `ceil(totalItems / pageSize)` straight from the API (no artificial cap), corrected by what the current page proves: an empty page is the real end, and a short page is too only when it is also the last page by the estimate (Google sometimes returns fewer than `maxResults` items although more exist, so one short page in the middle never caps the count). The effective total shrinks accordingly (`getEffectiveTotal`).
- **Large page counts** stay usable thanks to the windowed paginator (first, previous, a window around the current page with ellipses, next, last).
- **Deep pages may come back empty or be rejected (HTTP 400); both are treated as the end of the results** (also when the previous page's data is still on screen). This is a defensive choice: Google does not document it. Either way the UI shows "No more results" with one button that lands on a page that has results: the app remembers, per query, which pages returned data and where an empty page was seen (`useResultBounds`), so a broad query with an overestimated total never makes the user walk back one empty page at a time. The paginator is capped by what is proven. A non-numeric or non-positive `?page` in the URL falls back to 1 (and the URL is corrected).
- **Anonymous quota / 429**: one request per keystroke makes this the most likely failure. It is never auto-retried (it would only burn more quota); the user sees a clear message and a Retry button.
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
    components/        BookCard, BookList, BookCover, BookListSkeleton, BookBackLink, SuggestedSearches
    hooks/             useBookSearch, useResultBounds, useSearchState
    constants.ts       placeholder URL, page sizes
    types.ts           API types (Volume, VolumeInfo, VolumesResponse) and domain Book
    mappers.ts         Volume -> Book
    pagination.ts      pure pagination math
    searchParams.ts    URL query string parsing/validation
    errors.ts          error classification and messages
    preferencesSlice.ts
  features/theme/      theme.ts (pure helpers, storage in try/catch), useTheme
  hooks/               useFocusShortcut (the "/" key)
  components/          Layout, SearchBar, ThemeToggle, PageSizeSelect, Paginator, StatusMessage, icons (inline SVG)
  pages/               SearchPage, BookDetailPage, NotFoundPage
  styles/              _variables.scss (theme), _components.scss, main.scss (source), main.css (generated, committed)
  test/                MSW server, fixtures, render helper, setup
```

## Testing

Unit tests cover the mapper (placeholder, http to https, HTML stripping), pagination math, URL parsing and the date formatter. UI tests cover the theme toggle (OS default, persistence, blocked storage), the `/` shortcut, suggested searches and the live region. Integration tests render the real routes against a mocked network (MSW): every typed character triggers a request and only the last results are shown, page size changes, paginator navigation sends the right `startIndex`, 429 error and retry, no results, past-the-end pages, back navigation from the detail page, the detail page `infoLink`, 404 routes.

The app is rendered inside `<StrictMode>` in tests, like in `main.tsx`. Network behaviour is covered explicitly: one request per character with every obsolete one aborted, out-of-order responses, real request cancellation (the MSW handler observes `request.signal` abort), no abort on StrictMode re-runs, cache hits when returning to a visited page, and previous results kept while a page loads. jsdom ships its own `AbortSignal`, which Node's `fetch` rejects, so tests run in a tiny custom environment (`src/test/jsdom-node-abort.ts`) that is jsdom plus Node's native `AbortController`/`AbortSignal`.
