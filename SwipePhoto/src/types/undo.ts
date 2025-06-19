/**
 * undo.ts
 * 
 * TypeScript type definitions for the undo functionality system.
 * Defines interfaces for undoable actions and undo state management.
 */

export type SwipeDirection = 'left' | 'right';

/**
 * Represents a swipe action that can be undone
 */
export interface UndoableSwipeAction {
  id: string; // Unique identifier for the action
  photoId: string; // ID of the photo that was swiped
  direction: SwipeDirection; // Direction of the swipe
  timestamp: number; // When the action occurred
  previousState: {
    photoIndex: number; // Index of the photo before the action
    categoryId?: string; // Category the photo was in (if any)
    wasInStack: boolean; // Whether the photo was still in the swipe stack
  };
  // Optional metadata for debugging or analytics
  metadata?: {
    velocity?: number; // Swipe velocity
    confidence?: number; // User confidence (0-1)
    sessionId?: string; // Session identifier
  };
}

/**
 * Redux state for undo functionality
 */
export interface UndoState {
  undoStack: UndoableSwipeAction[]; // Stack of actions that can be undone
  maxUndoActions: number; // Maximum number of actions to keep (3)
}

/**
 * Payload for recording a new swipe action
 */
export interface RecordSwipeActionPayload {
  photoId: string;
  direction: SwipeDirection;
  previousIndex: number;
  categoryId?: string;
  metadata?: {
    velocity?: number;
    confidence?: number;
    sessionId?: string;
  };
}

/**
 * Result of an undo operation
 */
export interface UndoResult {
  success: boolean;
  undoneAction?: UndoableSwipeAction; // The action that was undone
  restoredState?: any; // The state that was restored
  processingTime?: number; // Time taken to process the undo
  error?: string | null; // Error message if undo failed
}

/**
 * Configuration for undo behavior
 */
export interface UndoConfig {
  maxActions: number; // Maximum actions in stack (default: 3)
  enableLogging: boolean; // Enable debug logging
  autoSave: boolean; // Auto-save undo stack to storage
}

/**
 * Default undo configuration
 */
export const DEFAULT_UNDO_CONFIG: UndoConfig = {
  maxActions: 3,
  enableLogging: __DEV__,
  autoSave: false,
}; 