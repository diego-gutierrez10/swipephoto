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
import HapticFeedbackService from '../../services/HapticFeedbackService';
import * as Haptics from 'expo-haptics';

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
          // Use the new singleton service
          HapticFeedbackService.trigger(Haptics.ImpactFeedbackStyle.Heavy);
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
  const photoExists = !!state.photos.photos.byId[action.photoId];
  
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
  // Restore any state that was changed by the original action
  // For a swipe, this mainly means setting the current photo back
  const state = getState();
  const photoToRestore = state.photos.photos.byId[action.photoId];
      
  if (photoToRestore) {
    dispatch(setCurrentPhoto(photoToRestore));
      }
  
  return { restoredState: { currentPhoto: photoToRestore } };
}

/**
 * =================================================================
 *  DEPRECATED: Old thunk logic - preserved for reference if needed
 * =================================================================
 */

export const recordAndDispatchSwipeAction = createAsyncThunk<
  void,
  { photoId: string; direction: 'left' | 'right', categoryId: string },
  { state: RootState }
>(
  'undo/recordAndDispatchSwipeAction',
  async (
    { photoId, direction, categoryId },
    { dispatch, getState }
  ) => {
    const state = getState();
    const photoIndex = state.photos.photos.allIds.indexOf(photoId);

    if (photoIndex === -1) {
      console.error('Photo not found, cannot record action');
      return;
    }

    // dispatch(
    //   recordSwipeAction({
    //     photoId,
    //     direction,
    //     previousState: {
    //       photoIndex,
    //       // any other relevant state to restore
    //     },
    //     categoryId,
    //   })
    // );

    // Here, you would also dispatch the actual swipe logic, e.g.,
    // dispatch(swipeLeft(photoId)) or dispatch(swipeRight(photoId))
  }
);

export default {
  undoSwipeAction,
  undoMultipleSwipeActions,
  clearUndoSession,
  recordAndDispatchSwipeAction,
}; 