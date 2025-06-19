/**
 * undoThunks.ts
 * 
 * Redux thunk actions for undo functionality.
 * Implements the Command Pattern for reliable state restoration.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { undoLastAction as undoLastActionReducer } from '../slices/undoSlice';
import { setCurrentPhoto } from '../slices/photoSlice';
import type { UndoableSwipeAction, UndoResult } from '../../types/undo';
import { HapticFeedbackService } from '../../services/HapticFeedbackService';

/**
 * Error types for undo operations
 */
export enum UndoErrorType {
  EMPTY_STACK = 'EMPTY_STACK',
  INVALID_STATE = 'INVALID_STATE',
  PHOTO_NOT_FOUND = 'PHOTO_NOT_FOUND',
  HAPTIC_FAILED = 'HAPTIC_FAILED',
}

export interface UndoError {
  type: UndoErrorType;
  message: string;
  action?: UndoableSwipeAction;
}

/**
 * Main undo thunk - reverses the last swipe action
 * Follows Command Pattern for reliable state restoration
 */
export const undoSwipeAction = createAsyncThunk<
  UndoResult,
  { enableHaptics?: boolean; skipValidation?: boolean },
  { state: RootState; rejectValue: UndoError }
>(
  'undo/undoSwipeAction',
  async ({ enableHaptics = true, skipValidation = false }, { dispatch, getState, rejectWithValue }) => {
    const startTime = Date.now();
    
    try {
      const state = getState();
      const { undoStack } = state.undo;
      
      // Validate undo stack is not empty
      if (undoStack.length === 0) {
        return rejectWithValue({
          type: UndoErrorType.EMPTY_STACK,
          message: 'No actions available to undo'
        });
      }

      // Get the last action
      const lastAction = undoStack[undoStack.length - 1];
      
      if (!skipValidation) {
        // Validate that the action can be undone
        const validationError = validateUndoAction(lastAction, state);
        if (validationError) {
          return rejectWithValue(validationError);
        }
      }

      // Provide haptic feedback before undo
      if (enableHaptics) {
        try {
          await HapticFeedbackService.triggerUndoFeedback();
        } catch (hapticError) {
          // Haptic failure should not block undo
          if (__DEV__) {
            console.warn('🔄 UndoThunk: Haptic feedback failed:', hapticError);
          }
        }
      }

      // Execute the undo operation
      const undoResult = await executeUndo(lastAction, dispatch, getState);

      // Remove the action from the undo stack
      dispatch(undoLastActionReducer());

      const processingTime = Date.now() - startTime;
      
      if (__DEV__) {
        console.log('🔄 UndoThunk: Successfully undone action', {
          actionId: lastAction.id,
          photoId: lastAction.photoId,
          direction: lastAction.direction,
          processingTime,
          remainingActions: undoStack.length - 1,
        });
      }

      return {
        success: true,
        undoneAction: lastAction,
        restoredState: undoResult.restoredState,
        processingTime,
        error: null,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during undo operation';
      
      if (__DEV__) {
        console.error('🔄 UndoThunk: Undo operation failed:', error);
      }

      return rejectWithValue({
        type: UndoErrorType.INVALID_STATE,
        message: errorMessage,
      });
    }
  }
);

/**
 * Batch undo multiple actions at once
 */
export const undoMultipleSwipeActions = createAsyncThunk<
  UndoResult[],
  { count: number; enableHaptics?: boolean },
  { state: RootState; rejectValue: UndoError }
>(
  'undo/undoMultipleSwipeActions',
  async ({ count, enableHaptics = true }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const { undoStack } = state.undo;
    
    if (undoStack.length === 0) {
      return rejectWithValue({
        type: UndoErrorType.EMPTY_STACK,
        message: 'No actions available to undo'
      });
    }

    const actualCount = Math.min(count, undoStack.length);
    const results: UndoResult[] = [];

    try {
      // Undo actions in reverse order (most recent first)
      for (let i = 0; i < actualCount; i++) {
        const result = await dispatch(undoSwipeAction({ 
          enableHaptics: enableHaptics && i === 0, // Only haptic on first undo
          skipValidation: i > 0 // Skip validation after first undo
        })).unwrap();
        
        results.push(result);
      }

      return results;
    } catch (error) {
      return rejectWithValue({
        type: UndoErrorType.INVALID_STATE,
        message: `Failed to undo ${actualCount} actions: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

/**
 * Clear undo stack and reset session (typically called when user starts new session)
 */
export const clearUndoSession = createAsyncThunk<
  { clearedCount: number },
  { reason?: string },
  { state: RootState }
>(
  'undo/clearUndoSession',
  async ({ reason = 'Session ended' }, { dispatch, getState }) => {
    const state = getState();
    const clearedCount = state.undo.undoStack.length;
    
    // Clear the undo stack
    dispatch({ type: 'undo/clearUndoStack' });
    
    if (__DEV__) {
      console.log('🔄 UndoThunk: Cleared undo session', { clearedCount, reason });
    }

    return { clearedCount };
  }
);

/**
 * Validate that an undo action can be safely executed
 */
function validateUndoAction(action: UndoableSwipeAction, state: RootState): UndoError | null {
  // Check if photo still exists in state
  const photoExists = state.photos.photos.some(photo => photo.id === action.photoId);
  
  if (!photoExists) {
    return {
      type: UndoErrorType.PHOTO_NOT_FOUND,
      message: `Photo ${action.photoId} no longer exists and cannot be restored`,
      action,
    };
  }

  // Additional validation can be added here
  // For example: check if category still exists, validate previous index, etc.

  return null; // Validation passed
}

/**
 * Execute the actual undo operation
 */
async function executeUndo(
  action: UndoableSwipeAction, 
  dispatch: any, 
  getState: () => RootState
): Promise<{ restoredState: any }> {
  const { photoId, previousState } = action;

  // Restore photo state based on the action's previous state
  const restoredState: any = {};

  try {
    // 1. Restore photo position/index if needed
    if (previousState.wasInStack) {
      // Find the photo in current state
      const currentState = getState();
      const photo = currentState.photos.photos.find(p => p.id === photoId);
      
      if (photo) {
        // Set as current photo to restore it to the swipe interface
        dispatch(setCurrentPhoto(photo));
        restoredState.currentPhoto = photo;
        restoredState.photoIndex = previousState.photoIndex;
      }
    }

    // 2. Restore category associations if needed
    if (previousState.categoryId) {
      // TODO: Restore category membership when category system is fully implemented
      restoredState.categoryId = previousState.categoryId;
    }

    // 3. Additional state restoration can be added here
    // For example: restore progress state, update statistics, etc.

    return { restoredState };

  } catch (error) {
    throw new Error(`Failed to execute undo for action ${action.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper thunk to record a swipe action and immediately prepare for undo
 * This integrates with existing swipe handlers
 */
export const recordAndDispatchSwipeAction = createAsyncThunk<
  void,
  {
    photoId: string;
    direction: 'left' | 'right';
    currentIndex: number;
    categoryId?: string;
    metadata?: {
      velocity?: number;
      confidence?: number;
      sessionId?: string;
    };
  },
  { state: RootState }
>(
  'undo/recordAndDispatchSwipeAction',
  async (payload, { dispatch, getState }) => {
    const { photoId, direction, currentIndex, categoryId, metadata } = payload;
    
    // Record the action for undo functionality
    dispatch({
      type: 'undo/recordSwipeAction',
      payload: {
        photoId,
        direction,
        previousIndex: currentIndex,
        categoryId,
        metadata,
      },
    });

    // Execute the actual swipe logic
    // This would typically update photo state, move to next photo, etc.
    const currentState = getState();
    const currentPhoto = currentState.photos.currentPhoto;
    
    if (currentPhoto && currentPhoto.id === photoId) {
      // Update photo status based on swipe direction
      // TODO: Implement actual photo state updates when photo management is complete
      
      // Move to next photo (this is simplified logic)
      const nextPhotoIndex = currentIndex + 1;
      const nextPhoto = currentState.photos.photos[nextPhotoIndex];
      
      if (nextPhoto) {
        dispatch(setCurrentPhoto(nextPhoto));
      } else {
        dispatch(setCurrentPhoto(null)); // No more photos
      }
    }

    if (__DEV__) {
      console.log('🔄 UndoThunk: Recorded and dispatched swipe action', {
        photoId,
        direction,
        currentIndex,
        metadata,
      });
    }
  }
);

export default {
  undoSwipeAction,
  undoMultipleSwipeActions,
  clearUndoSession,
  recordAndDispatchSwipeAction,
}; 