import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { AppRoutes } from '../app/AppRoutes';
import { createStore } from '../app/store';

/** Exposes the current URL to assertions. */
function LocationProbe() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{pathname + search}</output>
      <button type="button" onClick={() => void navigate(-1)}>
        history back
      </button>
    </>
  );
}

/** Renders the real routes with a fresh store (isolated RTK Query cache) at `initialUrl`. */
export function renderApp(initialUrl: string | string[] = '/') {
  const entries = Array.isArray(initialUrl) ? initialUrl : [initialUrl];
  const store = createStore();
  // StrictMode like main.tsx: it re-runs effects, which the request handling must survive.
  render(
    <StrictMode>
      <Provider store={store}>
        <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </Provider>
    </StrictMode>,
  );
  return { store };
}
