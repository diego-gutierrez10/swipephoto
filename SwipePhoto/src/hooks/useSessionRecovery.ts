import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  SessionRecoveryManager, 
  CrashDetectionResult, 
  RecoveryUIOptions,
  RecoveryTelemetry 
} from '../services/SessionRecoveryManager';

export interface UseSessionRecoveryReturn {
  // State
  isInitialized: boolean;
  isInitializing: boolean;
  hasError: boolean;
  error: string | null;
  
  // Recovery state
  crashDetectionResult: CrashDetectionResult | null;
  recoveryUIOptions: RecoveryUIOptions | null;
  showRecoveryDialog: boolean;
  
  // Actions
  initialize: () => Promise<boolean>;
  executeRecovery: (action: 'restore_full' | 'restore_partial' | 'start_fresh' | 'show_details') => Promise<boolean>;
  createSnapshot: (journeyPoint: string) => Promise<void>;
  recordJournalEntry: (change: any, journeyPoint: string) => void;
  dismissRecoveryDialog: () => void;
  
  // Telemetry
  getTelemetry: () => Promise<Array<RecoveryTelemetry & { timestamp: number }>>;
  
  // Cleanup
  dispose: () => void;
}

export interface UseSessionRecoveryConfig {
  autoInitialize?: boolean;
  handleAppStateChanges?: boolean;
  enableEventTracking?: boolean;
  onCrashDetected?: (result: CrashDetectionResult) => void;
  onRecoveryCompleted?: (success: boolean, action: string) => void;
  onError?: (error: string) => void;
}

const DEFAULT_CONFIG: UseSessionRecoveryConfig = {
  autoInitialize: true,
  handleAppStateChanges: true,
  enableEventTracking: true,
};

export const useSessionRecovery = (
  config: UseSessionRecoveryConfig = {}
): UseSessionRecoveryReturn => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Recovery manager instance
  const recoveryManagerRef = useRef<SessionRecoveryManager | null>(null);
  
  // Config ref to access current config in callbacks
  const configRef = useRef(fullConfig);
  configRef.current = fullConfig;
  
  // Hook state
  const [state, setState] = useState({
    isInitialized: false,
    isInitializing: false,
    hasError: false,
    error: null as string | null,
    crashDetectionResult: null as CrashDetectionResult | null,
    recoveryUIOptions: null as RecoveryUIOptions | null,
    showRecoveryDialog: false,
  });

  // Get recovery manager instance
  const getRecoveryManager = useCallback(() => {
    if (!recoveryManagerRef.current) {
      recoveryManagerRef.current = SessionRecoveryManager.getInstance();
    }
    return recoveryManagerRef.current;
  }, []);

  // Error handling
  const setError = useCallback((errorMessage: string) => {
    setState(prev => ({ 
      ...prev, 
      hasError: true, 
      error: errorMessage,
      isInitializing: false
    }));
    
    if (configRef.current.onError) {
      configRef.current.onError(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, hasError: false, error: null }));
  }, []);

  // Initialize recovery manager
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      clearError();
      setState(prev => ({ ...prev, isInitializing: true }));
      
      const manager = getRecoveryManager();
      const result = await manager.initialize();
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isInitializing: false,
        crashDetectionResult: result
      }));

      // Handle crash detection
      if (result.hasCrashed) {
        const uiOptions = manager.generateRecoveryUIOptions(result);
        setState(prev => ({
          ...prev,
          recoveryUIOptions: uiOptions,
          showRecoveryDialog: uiOptions.showRecoveryDialog
        }));

        if (configRef.current.onCrashDetected) {
          configRef.current.onCrashDetected(result);
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session recovery';
      setError(errorMessage);
      return false;
    }
  }, [getRecoveryManager, clearError, setError]);

  // Execute recovery action
  const executeRecovery = useCallback(async (
    action: 'restore_full' | 'restore_partial' | 'start_fresh' | 'show_details'
  ): Promise<boolean> => {
    try {
      clearError();
      
      if (action === 'show_details') {
        // Just show details, don't dismiss dialog
        return true;
      }

      const manager = getRecoveryManager();
      const sessionData = state.crashDetectionResult?.sessionData;
      
      const success = await manager.executeRecovery(action, sessionData);
      
             if (success) {
        setState(prev => ({
          ...prev,
          showRecoveryDialog: false,
          recoveryUIOptions: null
        }));
      }

      if (configRef.current.onRecoveryCompleted) {
        configRef.current.onRecoveryCompleted(success, action);
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recovery action failed';
      setError(errorMessage);
      return false;
    }
  }, [getRecoveryManager, clearError, setError, state.crashDetectionResult]);

  // Create session snapshot
  const createSnapshot = useCallback(async (journeyPoint: string): Promise<void> => {
    try {
      const manager = getRecoveryManager();
      await manager.createSessionSnapshot(journeyPoint);
    } catch (error) {
      console.error('useSessionRecovery: Error creating snapshot:', error);
      // Don't set error state for snapshots as they're background operations
    }
  }, [getRecoveryManager]);

  // Record journal entry
  const recordJournalEntry = useCallback((change: any, journeyPoint: string): void => {
    try {
      const manager = getRecoveryManager();
      manager.recordJournalEntry(change, journeyPoint);
    } catch (error) {
      console.error('useSessionRecovery: Error recording journal entry:', error);
    }
  }, [getRecoveryManager]);

  // Dismiss recovery dialog
  const dismissRecoveryDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      showRecoveryDialog: false
    }));
  }, []);

  // Get telemetry data
  const getTelemetry = useCallback(async (): Promise<Array<RecoveryTelemetry & { timestamp: number }>> => {
    try {
      const manager = getRecoveryManager();
      return await manager.getRecoveryTelemetry();
    } catch (error) {
      console.error('useSessionRecovery: Error getting telemetry:', error);
      return [];
    }
  }, [getRecoveryManager]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const manager = getRecoveryManager();
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - create snapshot and handle exit
      createSnapshot('app_backgrounded');
      manager.onAppExit();
    } else if (nextAppState === 'active') {
      // App coming to foreground - could trigger recovery check
      recordJournalEntry({ appState: 'active' }, 'app_foregrounded');
    }
  }, [getRecoveryManager, createSnapshot, recordJournalEntry]);

  // Dispose function
  const dispose = useCallback(() => {
    const manager = getRecoveryManager();
    manager.dispose();
    recoveryManagerRef.current = null;
    
    setState({
      isInitialized: false,
      isInitializing: false,
      hasError: false,
      error: null,
      crashDetectionResult: null,
      recoveryUIOptions: null,
      showRecoveryDialog: false,
    });
  }, [getRecoveryManager]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (!fullConfig.autoInitialize) return;

    let mounted = true;

    const autoInitialize = async () => {
      try {
        if (mounted) {
          await initialize();
        }
      } catch (error) {
        console.error('useSessionRecovery: Auto-initialization failed:', error);
      }
    };

    autoInitialize();

    return () => {
      mounted = false;
    };
  }, []); // Run only once on mount

  // Set up app state change listeners
  useEffect(() => {
    if (!fullConfig.handleAppStateChanges) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []); // Run only once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, []); // Run only once on mount

  return {
    // State
    isInitialized: state.isInitialized,
    isInitializing: state.isInitializing,
    hasError: state.hasError,
    error: state.error,
    
    // Recovery state
    crashDetectionResult: state.crashDetectionResult,
    recoveryUIOptions: state.recoveryUIOptions,
    showRecoveryDialog: state.showRecoveryDialog,
    
    // Actions
    initialize,
    executeRecovery,
    createSnapshot,
    recordJournalEntry,
    dismissRecoveryDialog,
    
    // Telemetry
    getTelemetry,
    
    // Cleanup
    dispose,
  };
}; 