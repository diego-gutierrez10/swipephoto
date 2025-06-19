/**
 * undoSelectors.ts
 * 
 * Memoized selectors for the undo state using Redux Toolkit's createSelector.
 * These selectors provide optimized access to undo data for React components.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { UndoState, UndoableSwipeAction } from '../../types/undo';

/**
 * Base selector to get the undo state
 */
const selectUndoState = (state: RootState): UndoState => state.undo;

/**
 * Get the entire undo stack
 */
export const selectUndoStack = createSelector(
  [selectUndoState],
  (undoState) => undoState.undoStack
);

/**
 * Check if undo is available (stack is not empty)
 */
export const selectCanUndo = createSelector(
  [selectUndoState],
  (undoState) => undoState.undoStack.length > 0
);

/**
 * Get the number of actions that can be undone
 */
export const selectUndoCount = createSelector(
  [selectUndoState],
  (undoState) => undoState.undoStack.length
);

/**
 * Get the last (most recent) undoable action without removing it
 */
export const selectLastUndoableAction = createSelector(
  [selectUndoState],
  (undoState): UndoableSwipeAction | null => {
    return undoState.undoStack.length > 0 
      ? undoState.undoStack[undoState.undoStack.length - 1]
      : null;
  }
);

/**
 * Get the maximum number of undo actions allowed
 */
export const selectMaxUndoActions = createSelector(
  [selectUndoState],
  (undoState) => undoState.maxUndoActions
);

/**
 * Check if the undo stack is at maximum capacity
 */
export const selectIsUndoStackFull = createSelector(
  [selectUndoState],
  (undoState) => undoState.undoStack.length >= undoState.maxUndoActions
);

/**
 * Get undo stack information for debugging/analytics
 */
export const selectUndoStackInfo = createSelector(
  [selectUndoState],
  (undoState) => ({
    stackSize: undoState.undoStack.length,
    maxSize: undoState.maxUndoActions,
    isFull: undoState.undoStack.length >= undoState.maxUndoActions,
    isEmpty: undoState.undoStack.length === 0,
    utilizationPercentage: (undoState.undoStack.length / undoState.maxUndoActions) * 100,
  })
);

/**
 * Get actions by photo ID (useful for debugging specific photo undo history)
 */
export const selectActionsByPhotoId = createSelector(
  [selectUndoState, (state: RootState, photoId: string) => photoId],
  (undoState, photoId) => undoState.undoStack.filter(action => action.photoId === photoId)
);

/**
 * Get actions by direction (useful for analytics)
 */
export const selectActionsByDirection = createSelector(
  [selectUndoState, (state: RootState, direction: 'left' | 'right') => direction],
  (undoState, direction) => undoState.undoStack.filter(action => action.direction === direction)
);

/**
 * Get the oldest action in the stack
 */
export const selectOldestUndoableAction = createSelector(
  [selectUndoState],
  (undoState): UndoableSwipeAction | null => {
    return undoState.undoStack.length > 0 
      ? undoState.undoStack[0]
      : null;
  }
);

/**
 * Get statistics about undo actions (for analytics/debugging)
 */
export const selectUndoStatistics = createSelector(
  [selectUndoState],
  (undoState) => {
    const stack = undoState.undoStack;
    
    if (stack.length === 0) {
      return {
        totalActions: 0,
        leftSwipes: 0,
        rightSwipes: 0,
        averageTimeBetweenActions: 0,
        oldestTimestamp: null,
        newestTimestamp: null,
      };
    }

    const leftSwipes = stack.filter(action => action.direction === 'left').length;
    const rightSwipes = stack.filter(action => action.direction === 'right').length;
    const timestamps = stack.map(action => action.timestamp);
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);
    
    // Calculate average time between actions
    let averageTimeBetweenActions = 0;
    if (stack.length > 1) {
      const sortedTimestamps = [...timestamps].sort();
      const intervals = [];
      for (let i = 1; i < sortedTimestamps.length; i++) {
        intervals.push(sortedTimestamps[i] - sortedTimestamps[i - 1]);
      }
      averageTimeBetweenActions = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return {
      totalActions: stack.length,
      leftSwipes,
      rightSwipes,
      averageTimeBetweenActions,
      oldestTimestamp,
      newestTimestamp,
      timeSpan: newestTimestamp - oldestTimestamp,
    };
  }
);

/**
 * Hook-friendly selector factory for use with useSelector
 */
export const createUndoSelectors = () => ({
  selectCanUndo,
  selectUndoCount,
  selectLastUndoableAction,
  selectUndoStack,
  selectUndoStackInfo,
  selectUndoStatistics,
}); 