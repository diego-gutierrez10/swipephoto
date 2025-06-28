/**
 * undoSlice.ts
 * 
 * Redux slice for managing the undo functionality.
 * Maintains a stack of the last 3 swipe actions that can be undone.
 */

import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { 
  UndoState, 
  UndoableSwipeAction, 
  RecordSwipeActionPayload,
  UndoResult,
  DEFAULT_UNDO_CONFIG 
} from '../../types/undo';

// Initial state for undo functionality
const initialState: UndoState = {
  undoStack: [],
  maxUndoActions: DEFAULT_UNDO_CONFIG.maxActions, // 3 actions max
  lastUndoneAction: null,
};

/**
 * Redux slice for undo functionality
 */
const undoSlice = createSlice({
  name: 'undo',
  initialState,
  reducers: {
    /**
     * Record a new swipe action that can be undone
     */
    recordSwipeAction: (state, action: PayloadAction<RecordSwipeActionPayload>) => {
      // Clear last undone action on new swipe
      state.lastUndoneAction = null;
      
      const { photoId, direction, previousIndex, categoryId, metadata } = action.payload;
      
      // Create undoable action
      const undoableAction: UndoableSwipeAction = {
        id: nanoid(),
        photoId,
        direction,
        timestamp: Date.now(),
        previousState: {
          photoIndex: previousIndex,
          categoryId,
          wasInStack: true, // Assuming the photo was in the stack when swiped
        },
        metadata,
      };

      // Add to stack
      state.undoStack.push(undoableAction);

      // Maintain max stack size - remove oldest if exceeded
      if (state.undoStack.length > state.maxUndoActions) {
        state.undoStack.shift(); // Remove first (oldest) item
      }

      // Debug logging in development
      if (__DEV__) {
        console.log('🔄 Undo: Recorded swipe action', {
          actionId: undoableAction.id,
          photoId,
          direction,
          stackSize: state.undoStack.length,
        });
      }
    },

    /**
     * Undo the last swipe action (remove from stack)
     */
    undoLastAction: (state) => {
      if (state.undoStack.length === 0) {
        if (__DEV__) {
          console.warn('🔄 Undo: Cannot undo - stack is empty');
        }
        return;
      }

      // Store the action to be undone and then remove it
      const undoneAction = state.undoStack[state.undoStack.length - 1];
      state.lastUndoneAction = undoneAction;
      state.undoStack.pop();

      if (__DEV__ && undoneAction) {
        console.log('🔄 Undo: Undoing action', {
          actionId: undoneAction.id,
          photoId: undoneAction.photoId,
          direction: undoneAction.direction,
          remainingInStack: state.undoStack.length,
        });
      }
    },

    /**
     * Clear the entire undo stack (typically called at session end)
     */
    clearUndoStack: (state) => {
      const clearedCount = state.undoStack.length;
      state.undoStack = [];

      if (__DEV__) {
        console.log('🔄 Undo: Cleared stack', { clearedCount });
      }
    },

    /**
     * Set the maximum number of undo actions (for configuration)
     */
    setMaxUndoActions: (state, action: PayloadAction<number>) => {
      const newMax = Math.max(1, Math.min(10, action.payload)); // Clamp between 1-10
      state.maxUndoActions = newMax;

      // Trim stack if it exceeds new maximum
      if (state.undoStack.length > newMax) {
        state.undoStack = state.undoStack.slice(-newMax); // Keep only the most recent actions
      }

      if (__DEV__) {
        console.log('🔄 Undo: Updated max actions', { 
          newMax, 
          currentStackSize: state.undoStack.length 
        });
      }
    },

    /**
     * Peek at the last action without removing it (for UI feedback)
     */
    peekLastAction: (state) => {
      // This reducer doesn't modify state, just for consistency
      // The actual peeking is done via selectors
      if (__DEV__) {
        const lastAction = state.undoStack[state.undoStack.length - 1];
        console.log('🔄 Undo: Peeking at last action', lastAction || 'No actions available');
      }
    },
  },
});

// Export actions
export const {
  recordSwipeAction,
  undoLastAction,
  clearUndoStack,
  setMaxUndoActions,
  peekLastAction,
} = undoSlice.actions;

// Export reducer
export default undoSlice.reducer;

// Export action creators for better type safety
export type UndoActionCreators = typeof undoSlice.actions; 