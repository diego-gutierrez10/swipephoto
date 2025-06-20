/**
 * useSessionManager.ts
 * 
 * React hook for session lifecycle management and app state persistence.
 * Provides easy integration with SessionManager functionality.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { 
  SessionManager, 
  SessionManagerConfig, 
  SessionValidationResult, 
  ProgressiveResource 
} from '../services/SessionManager';
import { 
  SessionState, 
  SessionEvent, 
  SessionEventCallback 
} from '../types/session';

/**
 * Session manager hook state
 */
export interface UseSessionManagerState {
  isInitialized: boolean;
  isRestoring: boolean;
  currentSession: SessionState | null;
  isActive: boolean;
  isPaused: boolean;
  lastError: string | null;
}

/**
 * Session manager hook return type
 */
export interface UseSessionManagerReturn {
  // State
  state: UseSessionManagerState;
  
  // Session operations
  getCurrentSession: () => SessionState | null;
  updateSession: (updates: Partial<SessionState>) => Promise<void>;
  saveSession: () => Promise<void>;
  
  // Lifecycle operations
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  
  // Validation
  validateSession: (session: SessionState) => SessionValidationResult;
  
  // Event management
  addEventListener: (event: SessionEvent, callback: SessionEventCallback) => void;
  removeEventListener: (event: SessionEvent, callback: SessionEventCallback) => void;
  
  // Progressive loading
  addProgressiveResource: (resource: ProgressiveResource) => void;
  
  // Utils
  isSessionExpired: () => boolean;
  getSessionAge: () => number;
  
  // Error handling
  clearError: () => void;
}

/**
 * Session manager hook configuration
 */
export interface UseSessionManagerConfig extends Partial<SessionManagerConfig> {
  autoInitialize?: boolean;
  enableErrorTracking?: boolean;
  enableStateTracking?: boolean;
}

/**
 * Default hook configuration
 */
const DEFAULT_HOOK_CONFIG: Required<UseSessionManagerConfig> = {
  // SessionManager config
  sessionExpiryTime: 30 * 60 * 1000, // 30 minutes
  maxBackgroundTime: 24 * 60 * 60 * 1000, // 24 hours
  autoSaveEnabled: true,
  autoSaveInterval: 30 * 1000, // 30 seconds
  strictValidation: false,
  validateAppVersion: true,
  progressiveLoading: true,
  loadingBatchSize: 5,
  enableLogging: __DEV__,
  enableTelemetry: true,
  
  // Hook-specific config
  autoInitialize: true,
  enableErrorTracking: true,
  enableStateTracking: true,
};

/**
 * React hook for session manager
 */
export const useSessionManager = (
  config: UseSessionManagerConfig = {}
): UseSessionManagerReturn => {
  // Memoize config to prevent recreating SessionManager instance
  const fullConfig = useMemo(() => ({ ...DEFAULT_HOOK_CONFIG, ...config }), [config]);
  
  // Session manager instance
  const sessionManagerRef = useRef<SessionManager | null>(null);
  
  // Hook state
  const [state, setState] = useState<UseSessionManagerState>({
    isInitialized: false,
    isRestoring: false,
    currentSession: null,
    isActive: true,
    isPaused: false,
    lastError: null,
  });

  // Error tracking
  const setError = useCallback((error: string) => {
    if (fullConfig.enableErrorTracking) {
      setState(prev => ({ ...prev, lastError: error }));
    }
  }, [fullConfig.enableErrorTracking]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: null }));
  }, []);

  // Get session manager instance
  const getSessionManager = useCallback(() => {
    if (!sessionManagerRef.current) {
      sessionManagerRef.current = SessionManager.getInstance(fullConfig);
    }
    return sessionManagerRef.current;
  }, []);

  // Update state from session
  const updateStateFromSession = useCallback(() => {
    if (!fullConfig.enableStateTracking) return;
    
    const sessionManager = getSessionManager();
    const currentSession = sessionManager.getCurrentSession();
    
    setState(prev => ({
      ...prev,
      currentSession,
      isActive: currentSession?.lifecycle.isActive ?? true,
      isPaused: currentSession?.lifecycle.isPaused ?? false,
    }));
  }, [fullConfig.enableStateTracking, getSessionManager]);

  // Session operations
  const getCurrentSession = useCallback((): SessionState | null => {
    return getSessionManager().getCurrentSession();
  }, [getSessionManager]);

  const updateSession = useCallback(async (updates: Partial<SessionState>): Promise<void> => {
    try {
      clearError();
      await getSessionManager().updateSession(updates);
      updateStateFromSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session';
      setError(errorMessage);
      throw error;
    }
  }, [getSessionManager, updateStateFromSession, clearError, setError]);

  const saveSession = useCallback(async (): Promise<void> => {
    try {
      clearError();
      await getSessionManager().saveSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save session';
      setError(errorMessage);
      throw error;
    }
  }, [getSessionManager, clearError, setError]);

  // Lifecycle operations
  const pause = useCallback(async (): Promise<void> => {
    try {
      clearError();
      await getSessionManager().pause();
      updateStateFromSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause session';
      setError(errorMessage);
      throw error;
    }
  }, [getSessionManager, updateStateFromSession, clearError, setError]);

  const resume = useCallback(async (): Promise<void> => {
    try {
      clearError();
      await getSessionManager().resume();
      updateStateFromSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume session';
      setError(errorMessage);
      throw error;
    }
  }, [getSessionManager, updateStateFromSession, clearError, setError]);

  // Validation
  const validateSession = useCallback((session: SessionState): SessionValidationResult => {
    return getSessionManager().validateSession(session);
  }, [getSessionManager]);

  // Event management
  const addEventListener = useCallback((event: SessionEvent, callback: SessionEventCallback): void => {
    getSessionManager().addEventListener(event, callback);
  }, [getSessionManager]);

  const removeEventListener = useCallback((event: SessionEvent, callback: SessionEventCallback): void => {
    getSessionManager().removeEventListener(event, callback);
  }, [getSessionManager]);

  // Progressive loading
  const addProgressiveResource = useCallback((resource: ProgressiveResource): void => {
    // This would need to be implemented in SessionManager
    // For now, we'll just log it
    if (fullConfig.enableLogging) {
      console.log('useSessionManager: Progressive resource added', resource);
    }
  }, [fullConfig.enableLogging]);

  // Utils
  const isSessionExpired = useCallback((): boolean => {
    const session = getCurrentSession();
    if (!session) return true;
    
    const sessionAge = Date.now() - session.lastSaved;
    return sessionAge > fullConfig.sessionExpiryTime;
  }, [getCurrentSession, fullConfig.sessionExpiryTime]);

  const getSessionAge = useCallback((): number => {
    const session = getCurrentSession();
    if (!session) return 0;
    
    return Date.now() - session.lastSaved;
  }, [getCurrentSession]);

  // Set up event listeners for state tracking
  useEffect(() => {
    if (!fullConfig.enableStateTracking) return;

    const sessionManager = getSessionManager();

    const handleSessionEvent = () => {
      updateStateFromSession();
    };

    // Listen to relevant events
    sessionManager.addEventListener('session_started', handleSessionEvent);
    sessionManager.addEventListener('session_loaded', handleSessionEvent);
    sessionManager.addEventListener('session_saved', handleSessionEvent);

    return () => {
      sessionManager.removeEventListener('session_started', handleSessionEvent);
      sessionManager.removeEventListener('session_loaded', handleSessionEvent);
      sessionManager.removeEventListener('session_saved', handleSessionEvent);
    };
  }, [fullConfig.enableStateTracking, getSessionManager, updateStateFromSession]);

  // Auto-initialize session manager
  useEffect(() => {
    if (!fullConfig.autoInitialize) return;

    let mounted = true;

    const initializeSessionManager = async () => {
      try {
        setState(prev => ({ ...prev, isRestoring: true, lastError: null }));
        
        const sessionManager = getSessionManager();
        await sessionManager.initialize();
        
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isInitialized: true, 
            isRestoring: false 
          }));
          updateStateFromSession();
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session manager';
          setState(prev => ({ 
            ...prev, 
            isInitialized: false, 
            isRestoring: false,
            lastError: errorMessage
          }));
        }
      }
    };

    initializeSessionManager();

    return () => {
      mounted = false;
    };
  }, [fullConfig.autoInitialize, getSessionManager, updateStateFromSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.dispose();
        sessionManagerRef.current = null;
      }
    };
  }, []);

  return {
    state,
    getCurrentSession,
    updateSession,
    saveSession,
    pause,
    resume,
    validateSession,
    addEventListener,
    removeEventListener,
    addProgressiveResource,
    isSessionExpired,
    getSessionAge,
    clearError,
  };
};

/**
 * Hook for session lifecycle state only
 */
export const useSessionLifecycle = () => {
  const { state } = useSessionManager({ 
    enableStateTracking: true,
    autoInitialize: true,
    enableErrorTracking: false 
  });

  return {
    isInitialized: state.isInitialized,
    isRestoring: state.isRestoring,
    isActive: state.isActive,
    isPaused: state.isPaused,
  };
};

/**
 * Hook for session operations only
 */
export const useSessionOperations = () => {
  const { 
    updateSession, 
    saveSession, 
    pause, 
    resume, 
    getCurrentSession 
  } = useSessionManager({ 
    enableStateTracking: false,
    autoInitialize: true,
    enableErrorTracking: true 
  });

  return {
    updateSession,
    saveSession,
    pause,
    resume,
    getCurrentSession,
  };
}; 