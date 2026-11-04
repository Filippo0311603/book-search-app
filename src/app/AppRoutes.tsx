import { Route, Routes } from 'react-router';
import { Layout } from '../components/Layout';
import { BookDetailPage } from '../pages/BookDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SearchPage } from '../pages/SearchPage';

/** Declarative route table, shared by the real app (BrowserRouter) and the tests (MemoryRouter). */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SearchPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
