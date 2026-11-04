import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PAGE_SIZES, MAX_TOTAL_RESULTS } from './features/books/constants';
import { makeResponse, makeVolume } from './test/fixtures';
import { renderApp } from './test/renderApp';
import { server, VOLUMES_URL } from './test/server';

const sleep = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
const searchbox = () => screen.getByRole('searchbox', { name: /search books/i });
const paginator = () => within(screen.getByRole('navigation', { name: /results pages/i }));

/** Handler answering with one book titled after the query; `slow` queries are delayed. */
function useEchoHandler(slow: Record<string, number> = {}) {
  const requested: string[] = [];
  const aborted: string[] = [];
  server.use(
    http.get(VOLUMES_URL, async ({ request }) => {
      const q = new URL(request.url).searchParams.get('q') ?? '';
      requested.push(q);
      request.signal.addEventListener('abort', () => aborted.push(q));
      await delay(slow[q] ?? 0);
      return HttpResponse.json({
        totalItems: 1,
        items: [makeVolume(`id-${q}`, { title: `Result ${q}` })],
      });
    }),
  );
  return { requested, aborted };
}

describe('network management', () => {
  afterEach(() => vi.useRealTimers());

  it('never shows a slow, out-of-order response over a newer one', async () => {
    const { requested } = useEchoHandler({ du: 800 });
    renderApp('/');

    await userEvent.type(searchbox(), 'du');
    await sleep(400); // debounce fired: the slow "du" request is in flight
    await userEvent.type(searchbox(), 'ne');

    expect(await screen.findByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
    await sleep(900); // long enough for the old response to have arrived, if it were not aborted
    expect(requested).toEqual(['du', 'dune']);
    expect(screen.queryByRole('heading', { name: 'Result du' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
  });

  it('aborts the obsolete in-flight request when the query changes', async () => {
    const { aborted } = useEchoHandler({ du: 2000 });
    renderApp('/');

    await userEvent.type(searchbox(), 'du');
    await sleep(400);
    await userEvent.type(searchbox(), 'ne');
    await screen.findByRole('heading', { name: 'Result dune' });

    await waitFor(() => expect(aborted).toEqual(['du']));
  });

  it('does not abort anything when StrictMode re-runs effects for the same args', async () => {
    const { requested, aborted } = useEchoHandler();
    renderApp('/?q=dune');

    expect(await screen.findByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
    await sleep(100);
    expect(aborted).toEqual([]);
    expect(requested).toEqual(['dune']); // the double effect shares a single request
  });

  it('aborts the very first request after mount (StrictMode) when the query changes', async () => {
    const { aborted } = useEchoHandler({ du: 2000 });
    renderApp('/?q=du');
    await sleep(100); // "du" is in flight

    await userEvent.type(searchbox(), 'ne');

    expect(await screen.findByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
    await waitFor(() => expect(aborted).toEqual(['du']));
  });

  it('serves a page already visited from the cache (no new request)', async () => {
    const calls: string[] = [];
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams;
        calls.push(params.get('startIndex') ?? '');
        const start = Number(params.get('startIndex'));
        return HttpResponse.json(makeResponse(10, 100, start));
      }),
    );
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });

    await userEvent.click(paginator().getByRole('button', { name: 'Page 2' }));
    await screen.findByRole('heading', { name: 'Book id11' });
    await userEvent.click(paginator().getByRole('button', { name: 'Page 1' }));
    await screen.findByRole('heading', { name: 'Book id1' });

    expect(calls).toEqual(['0', '10']);
  });
});

describe('page changes', () => {
  it('keeps the previous results and the paginator mounted while the next page loads', async () => {
    server.use(
      http.get(VOLUMES_URL, async ({ request }) => {
        const start = Number(new URL(request.url).searchParams.get('startIndex'));
        if (start > 0) await delay(300);
        return HttpResponse.json(makeResponse(10, 100, start));
      }),
    );
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });
    const nav = screen.getByRole('navigation', { name: /results pages/i });

    await userEvent.click(paginator().getByRole('button', { name: 'Page 2' }));

    // Still the same paginator element and the old list, dimmed and flagged as busy.
    expect(screen.getByRole('navigation', { name: /results pages/i })).toBe(nav);
    expect(screen.getByRole('heading', { name: 'Book id1' })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"].results-fade')).not.toBeNull();
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Book id11' })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('never shows a partial last page: the cap divides every page size', () => {
    for (const size of PAGE_SIZES) expect(MAX_TOTAL_RESULTS % size).toBe(0);
  });

  it('caps navigation, reports "360+" and writes the clamped page back to the URL', async () => {
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams;
        return HttpResponse.json(
          makeResponse(Number(params.get('maxResults')), 2000, Number(params.get('startIndex'))),
        );
      }),
    );
    renderApp('/?q=dune&pageSize=15&page=27');

    expect(await screen.findByText(/Showing 346.360 of 360\+ results/)).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=dune&pageSize=15&page=24');
    expect(paginator().getByRole('button', { name: 'Last page' })).toBeDisabled();
  });
});

describe('search input', () => {
  afterEach(() => vi.useRealTimers());

  it('clear empties the query immediately and returns focus to the input', async () => {
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(searchbox()).toHaveValue('');
    expect(searchbox()).toHaveFocus();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(screen.getByText('Find your next book')).toBeInTheDocument();
  });

  it('searches again when the same text is retyped right after Clear', async () => {
    const { requested } = useEchoHandler();
    renderApp('/');

    await userEvent.type(searchbox(), 'ai');
    await screen.findByRole('heading', { name: 'Result ai' });
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await userEvent.type(searchbox(), 'ai'); // no pause: well within the debounce window

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=ai'));
    expect(await screen.findByRole('heading', { name: 'Result ai' })).toBeInTheDocument();
    expect(requested.length).toBeGreaterThanOrEqual(1);
  });

  it('does not lose a character typed while its own debounced commit is navigating', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderApp('/');
    // Record every URL the app goes through.
    const urls: string[] = [];
    const observer = new MutationObserver(() =>
      urls.push(screen.getByTestId('location').textContent ?? ''),
    );
    observer.observe(screen.getByTestId('location'), {
      childList: true,
      characterData: true,
      subtree: true,
    });

    fireEvent.change(searchbox(), { target: { value: 'ab' } });
    // The debounce fires and, in the same batch, the user types one more character.
    await act(async () => {
      vi.advanceTimersByTime(300);
      fireEvent.change(searchbox(), { target: { value: 'abc' } });
    });

    // The stale "ab" is not committed; the typed character survives and "abc" is committed after its debounce.
    expect(searchbox()).toHaveValue('abc');
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(searchbox()).toHaveValue('abc');
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=abc');
    observer.disconnect();
    expect(urls).not.toContain('/?q=ab'); // the stale text is never committed
  });
});

describe('page metadata and navigation', () => {
  it('sets a per-page document title', async () => {
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });
    await waitFor(() => expect(document.title).toBe('dune - BookSearch'));
  });

  it('goes back in history from the detail page, preserving the results URL', async () => {
    renderApp('/?q=dune&page=2');
    await userEvent.click(await screen.findByRole('link', { name: 'Book id11' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/books/id11');

    await userEvent.click(await screen.findByRole('link', { name: /back to results/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=dune&page=2');
  });

  it('falls back to the search URL when opened directly', async () => {
    renderApp('/books/abc');
    await screen.findByRole('heading', { level: 1, name: 'Book abc' });
    expect(screen.getByRole('link', { name: /back to results/i })).toHaveAttribute('href', '/');
  });
});
