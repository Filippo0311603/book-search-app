import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from './features/theme/theme';
import { makeResponse } from './test/fixtures';
import { renderApp } from './test/renderApp';
import { server, VOLUMES_URL } from './test/server';

/** Fake `prefers-color-scheme` query: `setDark` flips it and notifies the listeners. */
function mockSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    addEventListener: vi.fn((_: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_: string, listener: () => void) => listeners.delete(listener)),
  };
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(query));
  return {
    query,
    setDark: (value: boolean) => {
      query.matches = value;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

/** In-memory localStorage (the test environment has none); `broken` makes every call throw. */
function stubStorage(broken = false) {
  const data = new Map<string, string>();
  const guard = <T,>(fn: () => T) => {
    if (broken) throw new Error('blocked');
    return fn();
  };
  const storage = {
    getItem: (key: string) => guard(() => data.get(key) ?? null),
    setItem: (key: string, value: string) => guard(() => void data.set(key, value)),
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}

const root = document.documentElement;

describe('theme toggle', () => {
  beforeEach(() => {
    root.removeAttribute('data-bs-theme');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the OS preference by default', () => {
    mockSystemTheme(true);
    stubStorage();
    renderApp('/');
    expect(root).toHaveAttribute('data-bs-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switches, applies and remembers the choice', async () => {
    mockSystemTheme(false);
    const storage = stubStorage();
    renderApp('/');
    const toggle = screen.getByRole('button', { name: 'Dark mode' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(root).toHaveAttribute('data-bs-theme', 'light');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(root).toHaveAttribute('data-bs-theme', 'dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await userEvent.click(toggle);
    expect(root).toHaveAttribute('data-bs-theme', 'light');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('prefers the saved choice over the OS preference', () => {
    mockSystemTheme(true);
    stubStorage().setItem(THEME_STORAGE_KEY, 'light');
    renderApp('/');
    expect(root).toHaveAttribute('data-bs-theme', 'light');
  });

  it('follows OS changes only while no theme has been chosen', async () => {
    const system = mockSystemTheme(false);
    stubStorage();
    renderApp('/');
    system.setDark(true);
    expect(root).toHaveAttribute('data-bs-theme', 'dark');

    await userEvent.click(screen.getByRole('button', { name: 'Dark mode' })); // chooses light
    expect(root).toHaveAttribute('data-bs-theme', 'light');
    system.setDark(false);
    system.setDark(true);
    expect(root).toHaveAttribute('data-bs-theme', 'light');
  });

  it('ignores OS changes when a theme is saved, and stops listening on unmount', () => {
    const system = mockSystemTheme(false);
    stubStorage().setItem(THEME_STORAGE_KEY, 'light');
    const { unmount } = renderApp('/');
    system.setDark(true);
    expect(root).toHaveAttribute('data-bs-theme', 'light');
    unmount();
    expect(system.query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('still works when localStorage throws', async () => {
    mockSystemTheme(false);
    stubStorage(true);
    renderApp('/');
    await userEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
    expect(root).toHaveAttribute('data-bs-theme', 'dark');
  });
});

describe('"/" shortcut', () => {
  it('focuses the search box and does not type the slash', async () => {
    renderApp('/');
    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveFocus();
    await userEvent.keyboard('/');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
  });

  it.each([['Control'], ['Meta'], ['Alt']])('is ignored with %s held', async (modifier) => {
    renderApp('/');
    await userEvent.keyboard(`{${modifier}>}/{/${modifier}}`);
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
  });

  it('is ignored while typing in a text field', async () => {
    renderApp('/');
    await userEvent.type(screen.getByRole('searchbox'), 'a/b');
    expect(screen.getByRole('searchbox')).toHaveValue('a/b');
  });
});

describe('suggested searches', () => {
  it('fills the search box and searches when one is clicked', async () => {
    const calls: string[] = [];
    server.use(
      http.get(VOLUMES_URL, ({ request }) => {
        calls.push(new URL(request.url).searchParams.get('q') ?? '');
        return HttpResponse.json(makeResponse(5, 50));
      }),
    );
    renderApp('/');
    await userEvent.click(screen.getByRole('button', { name: 'Dune' }));

    expect(screen.getByRole('searchbox')).toHaveValue('Dune');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(await screen.findByRole('heading', { name: 'Book id1' })).toBeInTheDocument();
    expect(calls.at(-1)).toBe('Dune');
    expect(screen.getAllByText(/17 May 2001/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('group', { name: /suggested searches/i })).not.toBeInTheDocument();
  });
});

describe('results count live region', () => {
  it('announces the range politely in a status region that is always present', async () => {
    server.use(http.get(VOLUMES_URL, () => HttpResponse.json(makeResponse(10, 100))));
    renderApp('/');
    const region = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('aria-live') === 'polite');
    expect(region).toBeDefined();
    await userEvent.type(screen.getByRole('searchbox'), 'x');
    await waitFor(() => expect(region).toHaveTextContent('Showing 1–10 of about 100 results'));
  });
});

describe('skip link', () => {
  it('focuses the main area without touching the router state behind "Back to results"', async () => {
    server.use(http.get(VOLUMES_URL, () => HttpResponse.json(makeResponse(5, 50))));
    renderApp('/?q=dune');
    await userEvent.click(await screen.findByRole('link', { name: 'Book id1' }));
    const back = await screen.findByRole('link', { name: /back to results/i });
    expect(back).toHaveAttribute('href', '/?q=dune');

    await userEvent.click(screen.getByRole('link', { name: /skip to main content/i }));
    expect(document.getElementById('main')).toHaveFocus();
    expect(screen.getByRole('link', { name: /back to results/i })).toHaveAttribute(
      'href',
      '/?q=dune',
    );
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/books\//);
  });
});
