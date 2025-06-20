/**
 * useProgressTracker.ts
 * 
 * React hook for managing progress tracking and auto-save functionality
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  ProgressTracker, 
  ProgressTrackerConfig, 
  ProgressTrackerEvent, 
  ProgressTrackerEventCallback 
} from '../services/ProgressTracker';
import { SessionManager } from '../services/SessionManager';

/**
 * Hook configuration interface
 */
export interface UseProgressTrackerConfig extends Partial<ProgressTrackerConfig> {
  autoInitialize?: boolean;
  enableEventTracking?: boolean;
}

/**
 * Hook state interface
 */
export interface UseProgressTrackerState {
  isInitialized: boolean;
  isTracking: boolean;
  pendingChanges: number;
  lastSaveTime: number;
  currentAppState: string;
  backgroundTaskActive: boolean;
  lastError: string | null;
  events: Array<{ event: ProgressTrackerEvent; data?: any; timestamp: number }>;
}

/**
 * Hook return interface
 */
export interface UseProgressTrackerReturn {
  // State
  state: UseProgressTrackerState;
  
  // Core operations
  trackChange: (key: string, data: any, priority?: 'critical' | 'normal' | 'low') => void;
  saveProgress: (forceSave?: boolean) => Promise<void>;
  initialize: (sessionManager?: SessionManager) => Promise<void>;
  
  // Event management
  addEventListener: (event: ProgressTrackerEvent, callback: ProgressTrackerEventCallback) => void;
  removeEventListener: (event: ProgressTrackerEvent, callback: ProgressTrackerEventCallback) => void;
  
  // Utilities
  getStats: () => UseProgressTrackerState;
  clearError: () => void;
  clearEvents: () => void;
}

/**
 * Default hook configuration
 */
const DEFAULT_HOOK_CONFIG: UseProgressTrackerConfig = {
  autoSaveInterval: 30 * 1000, // 30 seconds
  backgroundSaveTimeout: 10 * 1000, // 10 seconds
  maxRetryAttempts: 3,
  criticalSaveDelay: 1000,
  batchSize: 50,
  enableLogging: __DEV__,
  autoInitialize: true,
  enableEventTracking: true,
};

/**
 * React hook for progress tracking
 */
export const useProgressTracker = (
  config: UseProgressTrackerConfig = {}
): UseProgressTrackerReturn => {
  // Memoize the config to prevent infinite re-renders
  const fullConfig = useMemo(() => ({ ...DEFAULT_HOOK_CONFIG, ...config }), [config]);
  
  // Progress tracker instance
  const progressTrackerRef = useRef<ProgressTracker | null>(null);
  
  // Config ref to access current config in callbacks
  const configRef = useRef(fullConfig);
  configRef.current = fullConfig;
  
  // Hook state
  const [state, setState] = useState<UseProgressTrackerState>({
    isInitialized: false,
    isTracking: false,
    pendingChanges: 0,
    lastSaveTime: 0,
    currentAppState: 'unknown',
    backgroundTaskActive: false,
    lastError: null,
    events: [],
  });

  // Error tracking
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, lastError: error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: null }));
  }, []);

  // Event tracking
  const addEvent = useCallback((event: ProgressTrackerEvent, data?: any) => {
    if (!configRef.current.enableEventTracking) return;
    
    setState(prev => ({
      ...prev,
      events: [
        ...prev.events.slice(-9), // Keep only last 10 events
        { event, data, timestamp: Date.now() }
      ]
    }));
  }, []); // Use configRef to access current config without dependency

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  // Get progress tracker instance
  const getProgressTracker = useCallback(() => {
    if (!progressTrackerRef.current) {
      progressTrackerRef.current = ProgressTracker.getInstance(configRef.current);
    }
    return progressTrackerRef.current;
  }, []); // Use configRef to access current config without dependency

  // Update state from tracker stats
  const updateStateFromTracker = useCallback(() => {
    const tracker = getProgressTracker();
    const stats = tracker.getTrackingStats();
    
    setState(prev => ({
      ...prev,
      isTracking: stats.isTracking,
      pendingChanges: stats.pendingChanges,
      lastSaveTime: stats.lastSaveTime,
      currentAppState: stats.currentAppState,
      backgroundTaskActive: stats.backgroundTaskActive,
    }));
  }, []); // Remove getProgressTracker dependency

  // Core operations
  const initialize = useCallback(async (sessionManager?: SessionManager): Promise<void> => {
    try {
      clearError();
      
      const tracker = getProgressTracker();
      await tracker.initialize(sessionManager);
      
      setState(prev => ({ ...prev, isInitialized: true }));
      updateStateFromTracker();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize progress tracker';
      setError(errorMessage);
      throw error;
    }
  }, []); // Remove all dependencies to prevent infinite loop

  const trackChange = useCallback((
    key: string, 
    data: any, 
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ): void => {
    try {
      clearError();
      
      const tracker = getProgressTracker();
      tracker.trackChange(key, data, priority);
      
      updateStateFromTracker();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to track change';
      setError(errorMessage);
    }
  }, []); // Remove all dependencies to prevent infinite loop

  const saveProgress = useCallback(async (forceSave = false): Promise<void> => {
    try {
      clearError();
      
      const tracker = getProgressTracker();
      await tracker.saveProgress(forceSave);
      
      updateStateFromTracker();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save progress';
      setError(errorMessage);
      throw error;
    }
  }, []); // Remove all dependencies to prevent infinite loop

  // Event management
  const addEventListener = useCallback((
    event: ProgressTrackerEvent, 
    callback: ProgressTrackerEventCallback
  ): void => {
    const tracker = getProgressTracker();
    tracker.addEventListener(event, callback);
  }, []); // Remove getProgressTracker dependency

  const removeEventListener = useCallback((
    event: ProgressTrackerEvent, 
    callback: ProgressTrackerEventCallback
  ): void => {
    const tracker = getProgressTracker();
    tracker.removeEventListener(event, callback);
  }, []); // Remove getProgressTracker dependency

  // Get current stats
  const getStats = useCallback((): UseProgressTrackerState => {
    updateStateFromTracker();
    return state;
  }, []); // Remove dependencies that cause infinite loop

  // Set up event listeners for state tracking
  useEffect(() => {
    if (!configRef.current.enableEventTracking) return;

    const tracker = getProgressTracker();

    const handleEvent = (event: ProgressTrackerEvent, data?: any) => {
      addEvent(event, data);
      updateStateFromTracker();
    };

    // Listen to all relevant events
    const events: ProgressTrackerEvent[] = [
      'progress_tracked',
      'auto_save_started',
      'auto_save_completed',
      'auto_save_failed',
      'background_save_started',
      'background_save_completed',
      'recovery_started',
      'recovery_completed',
      'critical_save_triggered',
    ];

    events.forEach(event => {
      tracker.addEventListener(event, handleEvent);
    });

    return () => {
      events.forEach(event => {
        tracker.removeEventListener(event, handleEvent);
      });
    };
  }, []); // Use configRef to access current config without dependency

  // Auto-initialize if enabled
  useEffect(() => {
    if (!configRef.current.autoInitialize) return;

    let mounted = true;

    const autoInitialize = async () => {
      try {
        if (mounted) {
          await initialize();
        }
      } catch (error) {
        console.error('useProgressTracker: Auto-initialization failed:', error);
      }
    };

    autoInitialize();

    return () => {
      mounted = false;
    };
  }, []); // Use configRef to access current config without dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: We don't dispose the singleton here as other components might be using it
      // The tracker will handle its own cleanup when the app is backgrounded or closed
    };
  }, []);

  return {
    state,
    trackChange,
    saveProgress,
    initialize,
    addEventListener,
    removeEventListener,
    getStats,
    clearError,
    clearEvents,
  };
};

/**
 * Specialized hook for just tracking operations (no state)
 */
export const useProgressTracking = () => {
  const progressTrackerRef = useRef<ProgressTracker | null>(null);

  const getTracker = useCallback(() => {
    if (!progressTrackerRef.current) {
      progressTrackerRef.current = ProgressTracker.getInstance();
    }
    return progressTrackerRef.current;
  }, []);

  const trackChange = useCallback((
    key: string, 
    data: any, 
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ) => {
    const tracker = getTracker();
    tracker.trackChange(key, data, priority);
  }, [getTracker]);

  const saveProgress = useCallback(async (forceSave = false) => {
    const tracker = getTracker();
    await tracker.saveProgress(forceSave);
  }, [getTracker]);

  return {
    trackChange,
    saveProgress,
  };
};

/**
 * Hook for monitoring progress tracker events only
 */
export const useProgressTrackerEvents = () => {
  const [events, setEvents] = useState<Array<{ event: ProgressTrackerEvent; data?: any; timestamp: number }>>([]);
  const progressTrackerRef = useRef<ProgressTracker | null>(null);

  const getTracker = useCallback(() => {
    if (!progressTrackerRef.current) {
      progressTrackerRef.current = ProgressTracker.getInstance();
    }
    return progressTrackerRef.current;
  }, []);

  const addEvent = useCallback((event: ProgressTrackerEvent, data?: any) => {
    setEvents(prev => [
      ...prev.slice(-9), // Keep only last 10 events
      { event, data, timestamp: Date.now() }
    ]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    const tracker = getTracker();

    const handleEvent = (event: ProgressTrackerEvent, data?: any) => {
      addEvent(event, data);
    };

    // Listen to all events
    const eventTypes: ProgressTrackerEvent[] = [
      'progress_tracked',
      'auto_save_started',
      'auto_save_completed',
      'auto_save_failed',
      'background_save_started',
      'background_save_completed',
      'recovery_started',
      'recovery_completed',
      'critical_save_triggered',
    ];

    eventTypes.forEach(eventType => {
      tracker.addEventListener(eventType, handleEvent);
    });

    return () => {
      eventTypes.forEach(eventType => {
        tracker.removeEventListener(eventType, handleEvent);
      });
    };
  }, [getTracker, addEvent]);

  return {
    events,
    clearEvents,
  };
}; 