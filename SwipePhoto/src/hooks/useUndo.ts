/**
 * useUndo.ts
 * 
 * Custom hook for managing undo functionality in React components.
 * Provides easy access to undo actions and state.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  recordSwipeAction,
  undoLastAction,
  clearUndoStack,
} from '../store/slices/undoSlice';
import { undoSwipeAction } from '../store/thunks/undoThunks';
import { useUndoVisualFeedback } from './useUndoVisualFeedback';
import {
  selectCanUndo,
  selectUndoCount,
  selectLastUndoableAction,
  selectUndoStackInfo,
} from '../store/selectors/undoSelectors';
import type { RecordSwipeActionPayload } from '../types/undo';

/**
 * Hook for undo functionality
 */
export const useUndo = () => {
  const dispatch = useAppDispatch();
  
  // Visual feedback hook
  const visualFeedback = useUndoVisualFeedback({
    enableSound: true,
    respectReducedMotion: false,
    debug: __DEV__,
  });
  
  // Selectors
  const canUndo = useAppSelector(selectCanUndo);
  const undoCount = useAppSelector(selectUndoCount);
  const lastAction = useAppSelector(selectLastUndoableAction);
  const stackInfo = useAppSelector(selectUndoStackInfo);

  // Actions
  const recordAction = useCallback((payload: RecordSwipeActionPayload) => {
    dispatch(recordSwipeAction(payload));
  }, [dispatch]);

  const undo = useCallback(async () => {
    if (canUndo) {
      try {
        const result = await dispatch(undoSwipeAction({ enableHaptics: true })).unwrap();
        
        // Show visual feedback for the undone action
        if (result.undoneAction) {
          visualFeedback.showActionUndone({
            id: result.undoneAction.photoId,
            name: `Photo ${result.undoneAction.photoId}`,
            type: 'photo',
          });
        }
        
        return result.undoneAction; // Return the action that was undone
      } catch (error) {
        if (__DEV__) {
          console.error('🔄 useUndo: Failed to undo action:', error);
        }
        return null;
      }
    }
    return null;
  }, [dispatch, canUndo, visualFeedback]);

  const clearAll = useCallback(() => {
    dispatch(clearUndoStack());
    
    // Show visual feedback for stack being cleared
    visualFeedback.showStackCleared();
  }, [dispatch, visualFeedback]);

  // Helper function to record a swipe action with minimal parameters
  const recordSwipe = useCallback((
    photoId: string,
    direction: 'left' | 'right',
    previousIndex: number,
    options?: {
      categoryId?: string;
      velocity?: number;
      confidence?: number;
      sessionId?: string;
    }
  ) => {
    const payload: RecordSwipeActionPayload = {
      photoId,
      direction,
      previousIndex,
      categoryId: options?.categoryId,
      metadata: {
        velocity: options?.velocity,
        confidence: options?.confidence,
        sessionId: options?.sessionId,
      },
    };
    
    recordAction(payload);
  }, [recordAction]);

  return {
    // State
    canUndo,
    undoCount,
    lastAction,
    stackInfo,
    
    // Actions
    recordAction,
    recordSwipe,
    undo,
    clearAll,
    
    // Visual feedback
    visualFeedback,
    
    // Computed values
    hasActions: undoCount > 0,
    isStackFull: stackInfo.isFull,
    remainingSlots: stackInfo.maxSize - stackInfo.stackSize,
  };
};

export default useUndo; 