import { MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';
import { ProgressManager } from '../../services/ProgressManager';

// Progress-related action types that should trigger updates
const PROGRESS_ACTION_TYPES = [
  'progress/updateProgress',
  'progress/incrementProgress',
  'progress/decrementProgress',
  'progress/setTotal',
  'progress/startSession',
  'progress/endSession',
  'progress/updateCategoryProgress',
  'progress/resetCategoryProgress',
];

// Photo-related action types that might affect progress
const PHOTO_ACTION_TYPES = [
  'photo/addPhoto',
  'photo/removePhoto',
  'photo/markAsProcessed',
  'photo/markForDeletion',
  'photo/unmarkForDeletion',
];

// Organization action types that might affect category progress
const ORGANIZATION_ACTION_TYPES = [
  'organization/movePhotoToCategory',
  'organization/createCategory',
  'organization/deleteCategory',
  'organization/completeCategory',
];

/**
 * Redux middleware for real-time progress updates
 * Coordinates with ProgressManager to ensure smooth UI updates
 */
export const progressMiddleware = (api: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  const progressManager = ProgressManager.getInstance();
  
  // Process the action first
  const result = next(action);
  
  // Handle progress-related actions
  if (PROGRESS_ACTION_TYPES.includes(action.type)) {
    handleProgressAction(api, action, progressManager);
  }
  
  // Handle photo-related actions that might affect progress
  if (PHOTO_ACTION_TYPES.includes(action.type)) {
    handlePhotoAction(api, action, progressManager);
  }
  
  // Handle organization actions that might affect category progress
  if (ORGANIZATION_ACTION_TYPES.includes(action.type)) {
    handleOrganizationAction(api, action, progressManager);
  }
  
  return result;
};

/**
 * Handle progress-specific actions
 */
function handleProgressAction(
  api: MiddlewareAPI,
  action: AnyAction,
  progressManager: ProgressManager
): void {
  const state = api.getState();
  
  switch (action.type) {
    case 'progress/startSession':
      // Session started, notify other systems
      console.log('Progress session started:', action.payload.sessionId);
      break;
      
    case 'progress/endSession':
      // Session ended, clean up
      console.log('Progress session ended');
      break;
      
    case 'progress/updateProgress':
    case 'progress/incrementProgress':
    case 'progress/decrementProgress':
      // Progress updated, might trigger UI animations
      scheduleProgressUpdate(state.progress);
      break;
      
    case 'progress/updateCategoryProgress':
      // Category progress updated
      const { categoryId, completed, total } = action.payload;
      if (completed === total && total > 0) {
        // Category completed, might trigger celebration animation
        scheduleCategoryCompletionUpdate(categoryId, state.progress.categories[categoryId]);
      }
      break;
  }
}

/**
 * Handle photo-related actions that affect progress
 */
function handlePhotoAction(
  api: MiddlewareAPI,
  action: AnyAction,
  progressManager: ProgressManager
): void {
  const state = api.getState();
  
  switch (action.type) {
    case 'photo/markAsProcessed':
      // Photo was processed, increment progress
      if (state.progress.sessionId) {
        progressManager.incrementOverallProgress();
      }
      break;
      
    case 'photo/addPhoto':
      // New photo added, might need to update total
      const photoCount = state.photo.photos?.length || 0;
      if (photoCount > state.progress.total) {
        progressManager.setTotalPhotos(photoCount);
      }
      break;
      
    case 'photo/removePhoto':
      // Photo removed, might need to update total
      const remainingCount = state.photo.photos?.length || 0;
      progressManager.setTotalPhotos(remainingCount);
      break;
  }
}

/**
 * Handle organization actions that affect category progress
 */
function handleOrganizationAction(
  api: MiddlewareAPI,
  action: AnyAction,
  progressManager: ProgressManager
): void {
  const state = api.getState();
  
  switch (action.type) {
    case 'organization/movePhotoToCategory':
      // Photo moved to category, update category progress
      const { categoryId, photoId } = action.payload;
      updateCategoryProgressFromState(state, categoryId, progressManager);
      break;
      
    case 'organization/completeCategory':
      // Category marked as complete
      const completedCategoryId = action.payload.categoryId;
      const category = state.organization.categories?.[completedCategoryId];
      if (category) {
        progressManager.updateCategoryProgress(
          completedCategoryId,
          category.photoIds?.length || 0,
          category.photoIds?.length || 0
        );
      }
      break;
  }
}

/**
 * Schedule a smooth progress update animation
 * Uses ProgressManager's event system instead of window events
 */
function scheduleProgressUpdate(progressState: any): void {
  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    // Log progress update for debugging
    console.log('Progress update scheduled:', {
      current: progressState.current,
      total: progressState.total,
      percentage: progressState.total > 0 ? (progressState.current / progressState.total) * 100 : 0,
    });
  });
}

/**
 * Schedule category completion celebration
 * Uses ProgressManager's event system instead of window events
 */
function scheduleCategoryCompletionUpdate(categoryId: string, categoryData: any): void {
  requestAnimationFrame(() => {
    // Log category completion for debugging
    console.log('Category completion scheduled:', {
      categoryId,
      completed: categoryData?.completed || 0,
      total: categoryData?.total || 0,
    });
  });
}

/**
 * Update category progress based on current state
 */
function updateCategoryProgressFromState(
  state: any,
  categoryId: string,
  progressManager: ProgressManager
): void {
  try {
    const category = state.organization?.categories?.[categoryId];
    if (category) {
      const completed = category.processedPhotoIds?.length || 0;
      const total = category.photoIds?.length || 0;
      progressManager.updateCategoryProgress(categoryId, completed, total);
    }
  } catch (error) {
    console.warn('Failed to update category progress:', error);
  }
}

/**
 * Debounced update utility for performance
 */
function debouncedUpdate(fn: () => void, delay: number = 100): void {
  setTimeout(fn, delay);
}

export default progressMiddleware; 