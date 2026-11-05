import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from './AppRoutes';
import { getBasename } from './basename';
import { createStore } from './store';

describe('getBasename', () => {
  it.each([
    [undefined, '/'],
    ['', '/'],
    ['/', '/'],
    ['/book-search-app/', '/book-search-app'],
    ['book-search-app', '/book-search-app'],
  ])('%j -> %s', (input, expected) => {
    expect(getBasename(input)).toBe(expected);
  });
});

describe('router basename', () => {
  function renderAt(url: string) {
    render(
      <Provider store={createStore()}>
        <MemoryRouter basename={getBasename('/book-search-app/')} initialEntries={[url]}>
          <AppRoutes />
        </MemoryRouter>
      </Provider>,
    );
  }

  it('matches the search route under the basename', () => {
    renderAt('/book-search-app/');
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('still shows NotFound for an unknown path inside the app', () => {
    renderAt('/book-search-app/nope/nothing');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
