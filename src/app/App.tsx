import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';
import { getBasename } from './basename';
import { store } from './store';

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter basename={getBasename(process.env.BASE_PATH)}>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
