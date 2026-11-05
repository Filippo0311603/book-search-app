import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
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
  it('fires one request per typed character and aborts every obsolete one', async () => {
    const { requested, aborted } = useEchoHandler({ d: 1500, du: 1500 });
    renderApp('/');

    await userEvent.type(searchbox(), 'dun');
    expect(await screen.findByRole('heading', { name: 'Result dun' })).toBeInTheDocument();

    expect(requested).toEqual(['d', 'du', 'dun']);
    await waitFor(() => expect(aborted).toEqual(['d', 'du']));
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  it('never shows a slow, out-of-order response over a newer one', async () => {
    const { requested } = useEchoHandler({ du: 800 });
    renderApp('/');

    await userEvent.type(searchbox(), 'du');
    await userEvent.type(searchbox(), 'ne'); // "du" is still in flight

    expect(await screen.findByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
    await sleep(900); // long enough for the old response to have arrived, if it were not aborted
    expect(requested).toEqual(['d', 'du', 'dun', 'dune']);
    expect(screen.queryByRole('heading', { name: 'Result du' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Result dune' })).toBeInTheDocument();
  });

  it('serves a previous query from the cache when the text goes back to it', async () => {
    const { requested } = useEchoHandler();
    renderApp('/');

    await userEvent.type(searchbox(), 'du');
    await screen.findByRole('heading', { name: 'Result du' });
    await userEvent.type(searchbox(), '{Backspace}');
    await screen.findByRole('heading', { name: 'Result d' });
    await userEvent.type(searchbox(), 'u');
    await screen.findByRole('heading', { name: 'Result du' });

    expect(requested).toEqual(['d', 'du']); // returning to "du" costs no request
  });

  it('sends no request for whitespace-only input', async () => {
    const { requested } = useEchoHandler();
    renderApp('/');
    await userEvent.type(searchbox(), '   ');
    await sleep(100);
    expect(requested).toEqual([]);
    expect(screen.getByText('Find your next book')).toBeInTheDocument();
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

    await userEvent.type(searchbox(), 'n');

    expect(await screen.findByRole('heading', { name: 'Result dun' })).toBeInTheDocument();
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

  it('derives the page count from the API total, with a windowed paginator', async () => {
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams;
        return HttpResponse.json(
          makeResponse(Number(params.get('maxResults')), 2000, Number(params.get('startIndex'))),
        );
      }),
    );
    renderApp('/?q=dune&pageSize=15&page=27');

    // 2000 / 15 -> 134 pages; no cap, no "+" label.
    expect(await screen.findByText(/Showing 391.405 of about 2000 results/)).toBeInTheDocument();
    expect(paginator().getByRole('button', { name: 'Page 134' })).toBeInTheDocument();
    expect(paginator().getByRole('button', { name: 'Page 27' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(paginator().getAllByRole('button').length).toBeLessThan(12); // windowed
  });

  it('stops at the real end when Google overestimates the total', async () => {
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const start = Number(new URL(request.url).searchParams.get('startIndex'));
        return HttpResponse.json(makeResponse(start >= 40 ? 4 : 10, 1000, start));
      }),
    );
    renderApp('/?q=dune&page=5');

    expect(await screen.findByText(/Showing 41.44 of about 44 results/)).toBeInTheDocument();
    expect(paginator().getByRole('button', { name: 'Last page' })).toBeDisabled();
    expect(paginator().getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(paginator().queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument();
  });

  it('treats a 400 on a deep page as the end and lands on a page with results in one click', async () => {
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const start = Number(new URL(request.url).searchParams.get('startIndex'));
        return start >= 1000
          ? HttpResponse.json({ error: { code: 400 } }, { status: 400 })
          : HttpResponse.json(makeResponse(10, 5000, start));
      }),
    );
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });

    await userEvent.click(paginator().getByRole('button', { name: 'Last page' })); // page 500
    expect(await screen.findByText('No more results')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /last page/i }));

    expect(await screen.findByRole('heading', { name: 'Book id1' })).toBeInTheDocument();
  });

  it('on an overestimated total, one click lands on the last page that has results', async () => {
    const starts: number[] = [];
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const start = Number(new URL(request.url).searchParams.get('startIndex'));
        starts.push(start);
        // Google estimates 2000 items, but the data really ends at 30.
        return HttpResponse.json(
          start >= 30 ? { totalItems: 2000 } : makeResponse(10, 2000, start),
        );
      }),
    );
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });
    await userEvent.click(paginator().getByRole('button', { name: 'Page 2' }));
    await screen.findByRole('heading', { name: 'Book id11' });
    await userEvent.click(paginator().getByRole('button', { name: 'Page 3' }));
    await screen.findByRole('heading', { name: 'Book id21' });

    await userEvent.click(paginator().getByRole('button', { name: 'Last page' })); // page 200: empty
    expect(await screen.findByText('No more results')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /last page/i }));

    // Straight back to page 3 (cached): no walk through empty pages 199, 198...
    expect(await screen.findByRole('heading', { name: 'Book id21' })).toBeInTheDocument();
    expect(starts).toEqual([0, 10, 20, 1990]);
  });
});

describe('search input', () => {
  it('clear empties the query immediately and returns focus to the input', async () => {
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(searchbox()).toHaveValue('');
    expect(searchbox()).toHaveFocus();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(screen.getByText('Find your next book')).toBeInTheDocument();
  });

  it('keeps every typed character, even when typing is faster than the URL updates', async () => {
    useEchoHandler();
    renderApp('/');
    const input = searchbox();

    await act(async () => {
      for (const value of ['a', 'ab', 'abc', 'abcd'])
        fireEvent.change(input, { target: { value } });
    });

    expect(input).toHaveValue('abcd');
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=abcd');
    expect(await screen.findByRole('heading', { name: 'Result abcd' })).toBeInTheDocument();
  });

  it('keeps every character of a burst typed with no delay between keystrokes', async () => {
    useEchoHandler();
    renderApp('/');

    await userEvent.setup({ delay: null }).type(searchbox(), 'abcdefgh');

    expect(searchbox()).toHaveValue('abcdefgh');
    expect(await screen.findByRole('heading', { name: 'Result abcdefgh' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/?q=abcdefgh');
  });

  it('searches again when the same text is retyped right after Clear', async () => {
    const { requested } = useEchoHandler();
    renderApp('/');

    await userEvent.type(searchbox(), 'ai');
    await screen.findByRole('heading', { name: 'Result ai' });
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await userEvent.type(searchbox(), 'ai');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=ai'));
    expect(await screen.findByRole('heading', { name: 'Result ai' })).toBeInTheDocument();
    expect(requested.length).toBeGreaterThanOrEqual(1);
  });

  it('follows the URL on browser back/forward', async () => {
    useEchoHandler();
    renderApp(['/?q=one', '/?q=two']);
    await screen.findByRole('heading', { name: 'Result two' });
    expect(searchbox()).toHaveValue('two');

    await userEvent.click(screen.getByRole('button', { name: 'history back' }));

    expect(searchbox()).toHaveValue('one');
    expect(await screen.findByRole('heading', { name: 'Result one' })).toBeInTheDocument();
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
