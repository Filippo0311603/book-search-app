import { Link, Outlet } from 'react-router';
import { BookHalfIcon, GithubIcon } from './icons';
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
      <header className="site-header">
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
      <footer className="site-footer">
        <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <span className="text-center">
            <span className="brand-wordmark">
              Book<span className="brand-accent">Search</span>
            </span>
            <span className="d-none d-sm-inline"> &middot; </span>
            <span className="d-block d-sm-inline">Data provided by the Google Books API</span>
          </span>
          <a
            href="https://github.com/Filippo0311603/book-search-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="me-1" />
            Source on GitHub<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
