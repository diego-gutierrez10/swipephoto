import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import slices
import photoSlice from './slices/photoSlice';
import categorySlice from './slices/categorySlice';
import organizationReducer from './slices/organizationSlice';
import progressReducer from './slices/progressSlice';

// Import middleware
import { createEnhancedBatchMiddleware } from './middleware/simpleBatchMiddleware';
import { progressMiddleware } from './middleware/progressMiddleware';

export const store = configureStore({
  reducer: {
    photos: photoSlice,
    categories: categorySlice,
    organization: organizationReducer,
    progress: progressReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'photos/loadPhotos/fulfilled',
          'photos/categorizePhoto/fulfilled',
          'categories/loadCategories/fulfilled',
          'categories/createCategory/fulfilled',
          'categories/updateCategory/fulfilled',
          'organization/organizePhotosAsync/pending',
          'organization/organizePhotosAsync/fulfilled',
          'organization/reorganizePhotosAsync/pending',
          'organization/reorganizePhotosAsync/fulfilled',
          'organization/updateForPhotos/pending',
          'organization/updateForPhotos/fulfilled',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'payload.options.progressCallback'],
        // Ignore these paths in the state
        ignoredPaths: ['photos.currentPhoto.createdAt', 'categories.categories', 'organization.metadata.progress.estimatedTimeRemaining'],
      },
    }).concat(
      createEnhancedBatchMiddleware(),
      progressMiddleware as any
    ),
  devTools: __DEV__,
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export thunks for easier access
export * from './thunks/organizationThunks';

// Export store
export default store; 