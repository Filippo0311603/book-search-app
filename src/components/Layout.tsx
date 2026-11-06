import { Link, Outlet } from 'react-router';
import { BookHalfIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* No fragment navigation: under the router it would push a history entry with no state. */}
      <a
        href="#main"
        className="visually-hidden-focusable skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to main content
      </a>
      <header>
        <nav className="navbar navbar-dark bg-dark" aria-label="Main">
          <div className="container">
            <Link
              to="/"
              aria-label="BookSearch"
              className="navbar-brand brand-wordmark d-flex align-items-center gap-2"
            >
              <BookHalfIcon className="text-primary" />
              <span>
                Book<span className="brand-accent">Search</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="container flex-grow-1 py-4">
        <Outlet />
      </main>
      <footer className="border-top py-3 text-center text-body-secondary small">
        Data provided by the Google Books API
      </footer>
    </div>
  );
}
