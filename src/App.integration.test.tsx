import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { makeResponse, makeVolume } from './test/fixtures';
import { renderApp } from './test/renderApp';
import { server, VOLUMES_URL } from './test/server';

/** Records the query params of every search request that reaches the (mock) network. */
function recordSearches() {
  const calls: URLSearchParams[] = [];
  server.use(
    http.get(VOLUMES_URL, ({ request }) => {
      const params = new URL(request.url).searchParams;
      calls.push(params);
      const start = Number(params.get('startIndex'));
      return HttpResponse.json(makeResponse(Number(params.get('maxResults')), 100, start));
    }),
  );
  return calls;
}

describe('search page', () => {
  it('shows the initial empty state and sends no request without a query', async () => {
    const calls = recordSearches();
    renderApp('/');
    expect(screen.getByText('Find your next great read')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: /search books/i }), '   ');
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(calls).toHaveLength(0);
  });

  it('searches with the trimmed query and renders the results', async () => {
    const calls = recordSearches();
    renderApp('/');
    await userEvent.type(screen.getByRole('searchbox'), 'dune ');

    expect(await screen.findByRole('heading', { name: 'Book id1' })).toBeInTheDocument();
    const last = calls.at(-1);
    expect(last?.get('q')).toBe('dune'); // the trailing space is trimmed
    expect(last?.get('startIndex')).toBe('0');
    expect(last?.get('maxResults')).toBe('10');
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });

  it('refetches with the new maxResults when the page size changes', async () => {
    const calls = recordSearches();
    renderApp('/?q=dune&page=2');
    await screen.findByRole('heading', { name: 'Book id11' });

    await userEvent.selectOptions(screen.getByLabelText(/results per page/i), '5');

    await screen.findByRole('heading', { name: 'Book id1' });
    expect(screen.getAllByRole('article')).toHaveLength(5);
    const last = calls.at(-1);
    expect(last?.get('maxResults')).toBe('5');
    expect(last?.get('startIndex')).toBe('0'); // reset to page 1
  });

  it('sends the right startIndex when navigating with the paginator', async () => {
    const calls = recordSearches();
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });

    // The paginator is re-mounted while a page loads, so query it fresh each time.
    const paginator = () => within(screen.getByRole('navigation', { name: /results pages/i }));
    await userEvent.click(paginator().getByRole('button', { name: 'Page 3' }));

    await screen.findByRole('heading', { name: 'Book id21' });
    expect(calls.at(-1)?.get('startIndex')).toBe('20');
    expect(paginator().getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(paginator().getByRole('button', { name: 'Next page' }));
    await screen.findByRole('heading', { name: 'Book id31' });
    expect(calls.at(-1)?.get('startIndex')).toBe('30');
  });

  it('shows a rate-limit message and recovers on retry', async () => {
    let fail = true;
    server.use(
      http.get(VOLUMES_URL, () =>
        fail
          ? HttpResponse.json({ error: {} }, { status: 429 })
          : HttpResponse.json(makeResponse(5)),
      ),
    );
    renderApp('/?q=dune&pageSize=5');

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many requests/i);
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Book id1' })).toBeInTheDocument();
  });

  it('shows the no-results state', async () => {
    server.use(
      http.get(VOLUMES_URL, () => HttpResponse.json({ kind: 'books#volumes', totalItems: 0 })),
    );
    renderApp('/?q=zzzzzz');
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('handles a page past the real end and lets the user go back', async () => {
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        const start = Number(new URL(request.url).searchParams.get('startIndex'));
        return HttpResponse.json(start >= 20 ? { totalItems: 300 } : makeResponse(10, 300, start));
      }),
    );
    renderApp('/?q=dune&page=3');
    expect(await screen.findByText('No more results')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /last page/i }));
    expect(await screen.findByRole('heading', { name: 'Book id11' })).toBeInTheDocument();
  });

  it('restores the results page from the URL when coming back from the detail page', async () => {
    renderApp('/?q=dune&page=2');
    await userEvent.click(await screen.findByRole('link', { name: 'Book id11' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Book id11' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /back to results/i }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/?q=dune&page=2'),
    );
    expect(await screen.findByRole('heading', { name: 'Book id11' })).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('clears the search box and shows the empty state when the logo is clicked', async () => {
    renderApp('/?q=dune');
    await screen.findByRole('heading', { name: 'Book id1' });
    expect(screen.getByRole('searchbox')).toHaveValue('dune');

    await userEvent.click(screen.getByRole('link', { name: 'BookSearch' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByText('Find your next great read')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
});

describe('book detail page', () => {
  it('renders the book with a safe external link to infoLink', async () => {
    renderApp('/books/abc');
    expect(await screen.findByRole('heading', { level: 1, name: 'Book abc' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view on google books/i });
    expect(link).toHaveAttribute('href', 'https://books.google.com/books?id=abc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByAltText('Cover of Book abc')).toHaveAttribute(
      'src',
      'https://books.google.com/cover/abc.jpg',
    );
  });

  it('links to the Google Books page when Google gives a Play link for a book not on Play', async () => {
    server.use(
      http.get(`${VOLUMES_URL}/:id`, () =>
        HttpResponse.json({
          ...makeVolume('abc', {
            infoLink: 'https://play.google.com/store/books/details?id=abc&source=gbs_api',
            previewLink: 'http://books.google.it/books?id=abc&hl=&source=gbs_api',
          }),
          saleInfo: { saleability: 'NOT_FOR_SALE' },
        }),
      ),
    );
    renderApp('/books/abc');
    const link = await screen.findByRole('link', { name: /view on google books/i });
    expect(link).toHaveAttribute('href', 'https://books.google.it/books?id=abc&hl=&source=gbs_api');
  });

  it('falls back to the thumbnail when the large cover is not book-shaped', async () => {
    server.use(
      http.get(`${VOLUMES_URL}/:id`, () =>
        HttpResponse.json(
          makeVolume('abc', {
            imageLinks: { thumbnail: 'http://x/thumb.jpg', large: 'http://x/large.png' },
          }),
        ),
      ),
    );
    renderApp('/books/abc');
    const image = await screen.findByAltText('Cover of Book abc');
    expect(image).toHaveAttribute('src', 'https://x/large.png');
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 128 });
    fireEvent.load(image);
    expect(image).toHaveAttribute('src', 'https://x/thumb.jpg');
  });

  it('shows a not-found message for unknown ids', async () => {
    server.use(http.get(`${VOLUMES_URL}/:id`, () => HttpResponse.json({}, { status: 404 })));
    renderApp('/books/nope');
    expect(await screen.findByText('Book not found')).toBeInTheDocument();
  });
});

describe('routing', () => {
  it('renders the 404 page for unknown routes', () => {
    renderApp('/does/not/exist');
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
