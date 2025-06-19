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
  
  // Selectors
  const canUndo = useAppSelector(selectCanUndo);
  const undoCount = useAppSelector(selectUndoCount);
  const lastAction = useAppSelector(selectLastUndoableAction);
  const stackInfo = useAppSelector(selectUndoStackInfo);

  // Actions
  const recordAction = useCallback((payload: RecordSwipeActionPayload) => {
    dispatch(recordSwipeAction(payload));
  }, [dispatch]);

  const undo = useCallback(() => {
    if (canUndo) {
      dispatch(undoLastAction());
      return lastAction; // Return the action that was undone
    }
    return null;
  }, [dispatch, canUndo, lastAction]);

  const clearAll = useCallback(() => {
    dispatch(clearUndoStack());
  }, [dispatch]);

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
    
    // Computed values
    hasActions: undoCount > 0,
    isStackFull: stackInfo.isFull,
    remainingSlots: stackInfo.maxSize - stackInfo.stackSize,
  };
};

export default useUndo; 