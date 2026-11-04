import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';
import { store } from './store';

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
