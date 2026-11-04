import { configureStore } from '@reduxjs/toolkit';
import { preferencesReducer } from '../features/books/preferencesSlice';
import { googleBooksApi } from '../services/googleBooksApi';

/** Factory so tests get an isolated store (and API cache) each time. */
export function createStore() {
  return configureStore({
    reducer: {
      [googleBooksApi.reducerPath]: googleBooksApi.reducer,
      preferences: preferencesReducer,
    },
    middleware: (getDefault) => getDefault().concat(googleBooksApi.middleware),
  });
}

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
