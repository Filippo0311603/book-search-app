import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_PAGE_SIZE, type PageSize } from './constants';

/**
 * UI preferences only. The search itself (q, page, pageSize) lives in the URL, which is the
 * source of truth; the preferred page size is just the default when the URL does not specify one.
 */
interface PreferencesState {
  pageSize: PageSize;
}

const initialState: PreferencesState = { pageSize: DEFAULT_PAGE_SIZE };

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    pageSizeChanged(state, action: PayloadAction<PageSize>) {
      state.pageSize = action.payload;
    },
  },
});

export const { pageSizeChanged } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
export const selectPreferredPageSize = (state: { preferences: PreferencesState }) =>
  state.preferences.pageSize;
