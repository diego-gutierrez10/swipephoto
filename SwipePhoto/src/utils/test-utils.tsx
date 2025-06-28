import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react-native';
import type { RenderOptions } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import type { PreloadedState } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

// Import your stores and reducers
import { RootState, store as appStore } from '../store';
import photoSlice from '../store/slices/photoSlice';
import categorySlice from '../store/slices/categorySlice';
import organizationReducer from '../store/slices/organizationSlice';
import progressReducer from '../store/slices/progressSlice';
import undoReducer from '../store/slices/undoSlice';

import { ThemeProvider } from '../components/layout/ThemeProvider';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState or a store
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: typeof appStore;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: {
        photos: photoSlice,
        categories: categorySlice,
        organization: organizationReducer,
        progress: progressReducer,
        undo: undoReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
} 