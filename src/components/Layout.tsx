import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <i className="bi bi-book-half text-primary" aria-hidden="true" />
            BookSearch
          </Link>
        </div>
      </header>
      <main className="container flex-grow-1 py-4">
        <Outlet />
      </main>
      <footer className="border-top py-3 text-center text-secondary small">
        Data provided by the Google Books API
      </footer>
    </div>
  );
}
