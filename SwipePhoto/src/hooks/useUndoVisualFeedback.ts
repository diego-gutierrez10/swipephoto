/**
 * useUndoVisualFeedback.ts
 * 
 * Custom hook for managing visual feedback when undo actions are performed.
 * Provides state management and animation control for feedback components.
 */

import { useState, useCallback, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

export interface UndoFeedbackItem {
  id: string;
  name?: string;
  type?: string;
}

export interface UndoFeedbackState {
  visible: boolean;
  type: 'card-restored' | 'action-undone' | 'stack-cleared';
  restoredItem?: UndoFeedbackItem;
  animationOrigin?: { x: number; y: number };
}

export interface UndoVisualFeedbackConfig {
  /**
   * Duration to show feedback in milliseconds
   */
  displayDuration?: number;
  
  /**
   * Enable sound effects
   */
  enableSound?: boolean;
  
  /**
   * Enable reduced motion mode
   */
  respectReducedMotion?: boolean;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

export interface UndoVisualFeedbackReturn {
  /**
   * Current feedback state
   */
  feedbackState: UndoFeedbackState;
  
  /**
   * Show feedback for a card being restored
   */
  showCardRestored: (item: UndoFeedbackItem, origin?: { x: number; y: number }) => void;
  
  /**
   * Show feedback for an action being undone
   */
  showActionUndone: (item?: UndoFeedbackItem) => void;
  
  /**
   * Show feedback for undo stack being cleared
   */
  showStackCleared: () => void;
  
  /**
   * Hide current feedback
   */
  hideFeedback: () => void;
  
  /**
   * Check if feedback is currently visible
   */
  isVisible: boolean;
  
  /**
   * Configuration
   */
  config: UndoVisualFeedbackConfig;
  
  /**
   * Update configuration
   */
  updateConfig: (newConfig: Partial<UndoVisualFeedbackConfig>) => void;
}

export const useUndoVisualFeedback = (
  initialConfig: UndoVisualFeedbackConfig = {}
): UndoVisualFeedbackReturn => {
  const [feedbackState, setFeedbackState] = useState<UndoFeedbackState>({
    visible: false,
    type: 'action-undone',
  });
  
  const [config, setConfig] = useState<UndoVisualFeedbackConfig>({
    displayDuration: 2000,
    enableSound: true,
    respectReducedMotion: false,
    debug: __DEV__,
    ...initialConfig,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear any existing timeout
   */
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Hide feedback after delay
   */
  const scheduleHide = useCallback(() => {
    clearExistingTimeout();
    
    timeoutRef.current = setTimeout(() => {
      setFeedbackState(prev => ({ ...prev, visible: false }));
      timeoutRef.current = null;
    }, config.displayDuration);
  }, [config.displayDuration, clearExistingTimeout]);

  /**
   * Show feedback for a card being restored
   */
  const showCardRestored = useCallback((
    item: UndoFeedbackItem, 
    origin?: { x: number; y: number }
  ) => {
    if (config.debug) {
      console.log('🎨 UndoVisualFeedback: Showing card restored feedback', { item, origin });
    }

    clearExistingTimeout();
    
    setFeedbackState({
      visible: true,
      type: 'card-restored',
      restoredItem: item,
      animationOrigin: origin,
    });

    scheduleHide();
  }, [config.debug, clearExistingTimeout, scheduleHide]);

  /**
   * Show feedback for an action being undone
   */
  const showActionUndone = useCallback((item?: UndoFeedbackItem) => {
    if (config.debug) {
      console.log('🎨 UndoVisualFeedback: Showing action undone feedback', { item });
    }

    clearExistingTimeout();
    
    setFeedbackState({
      visible: true,
      type: 'action-undone',
      restoredItem: item,
    });

    scheduleHide();
  }, [config.debug, clearExistingTimeout, scheduleHide]);

  /**
   * Show feedback for undo stack being cleared
   */
  const showStackCleared = useCallback(() => {
    if (config.debug) {
      console.log('🎨 UndoVisualFeedback: Showing stack cleared feedback');
    }

    clearExistingTimeout();
    
    setFeedbackState({
      visible: true,
      type: 'stack-cleared',
    });

    scheduleHide();
  }, [config.debug, clearExistingTimeout, scheduleHide]);

  /**
   * Hide current feedback immediately
   */
  const hideFeedback = useCallback(() => {
    clearExistingTimeout();
    setFeedbackState(prev => ({ ...prev, visible: false }));
    
    if (config.debug) {
      console.log('🎨 UndoVisualFeedback: Hiding feedback manually');
    }
  }, [clearExistingTimeout, config.debug]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<UndoVisualFeedbackConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    if (config.debug) {
      console.log('🎨 UndoVisualFeedback: Configuration updated', newConfig);
    }
  }, [config.debug]);

  return {
    feedbackState,
    showCardRestored,
    showActionUndone,
    showStackCleared,
    hideFeedback,
    isVisible: feedbackState.visible,
    config,
    updateConfig,
  };
};

export default useUndoVisualFeedback; 