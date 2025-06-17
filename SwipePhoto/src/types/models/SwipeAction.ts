export interface SwipeAction {
  id: string;
  photoId: string;
  direction: SwipeDirection;
  categoryId?: string;
  actionType: SwipeActionType;
  timestamp: Date;
  confidence: number; // 0-1, how confident the user was about the action
  velocity: number; // Swipe velocity for analytics
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type SwipeActionType = 
  | 'categorize' 
  | 'delete' 
  | 'favorite' 
  | 'archive' 
  | 'share' 
  | 'undo';

export interface SwipeGesture {
  direction: SwipeDirection;
  velocity: number;
  distance: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  duration: number;
}

export interface SwipeSettings {
  sensitivityThreshold: number; // Minimum distance to trigger swipe
  velocityThreshold: number; // Minimum velocity to trigger swipe
  enableHapticFeedback: boolean;
  confirmDestructiveActions: boolean; // Ask before delete
  undoTimeoutMs: number; // Time to allow undo after action
}

export const DEFAULT_SWIPE_SETTINGS: SwipeSettings = {
  sensitivityThreshold: 50,
  velocityThreshold: 500,
  enableHapticFeedback: true,
  confirmDestructiveActions: true,
  undoTimeoutMs: 3000,
}; 