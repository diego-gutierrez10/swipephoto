import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selector for the photo state
const selectPhotoState = (state: RootState) => state.photos;

// Selects the 'byId' object from the photo state
export const selectPhotosById = createSelector(
  [selectPhotoState],
  (photoState) => photoState.photos.byId
);

// Selects all photo IDs
export const selectAllPhotoIds = createSelector(
  [selectPhotoState],
  (photoState) => photoState.photos.allIds
);

// Selects all photos as an array, memoized
export const selectAllPhotos = createSelector(
  [selectPhotosById, selectAllPhotoIds],
  (byId, allIds) => allIds.map(id => byId[id])
);

// Selects all category objects
const selectCategories = (state: RootState) => state.categories.categories;

/**
 * A factory selector to get photos for a specific category.
 * This is highly efficient because it memoizes the result for each categoryId.
 * @param categoryId - The ID of the category to get photos for.
 */
export const makeSelectPhotosByCategory = () => {
  return createSelector(
    [selectAllPhotos, selectCategories, (state: RootState, categoryId: string) => categoryId],
    (allPhotos, categories, categoryId) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category || !category.photoIds) {
        return [];
      }
      const categoryPhotoIds = new Set(category.photoIds);
      return allPhotos.filter(photo => categoryPhotoIds.has(photo.id));
    }
  );
}; 