/**
 * sessionSyncMiddleware.ts
 * 
 * Redux middleware that automatically syncs session state changes 
 * to persistent storage with throttling and selective persistence.
 */

import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';
import { SessionStorageService } from '../../services/SessionStorageService';
import { sessionSelectors } from '../slices/sessionSlice';

/**
 * Configuration for session sync middleware
 */
interface SessionSyncConfig {
  // Throttling
  throttleDelay: number; // ms
  maxThrottleDelay: number; // ms
  
  // Actions to sync
  syncActions: string[];
  ignoreActions: string[];
  
  // Selective syncing
  syncOnlyUserActions: boolean;
  
  // Error handling
  maxRetries: number;
  retryDelay: number; // ms
  
  // Debug
  enableLogging: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SessionSyncConfig = {
  throttleDelay: 1000, // 1 second
  maxThrottleDelay: 5000, // 5 seconds
  syncActions: [
    'session/updateNavigationState',
    'session/updateProgressState', 
    'session/updateUserPreferences',
    'session/updateCurrentScreen',
    'session/updateCurrentPhotoIndex',
    'session/updateSelectedCategory',
    'session/updateSessionMetadata',
    // Also sync other relevant actions
    'photos/setCurrentPhoto',
    'organization/selectCategory',
    'progress/updateProgress',
    'undo/addAction',
  ],
  ignoreActions: [
    'session/loadSession',
    'session/saveSession',
    'session/clearSession',
    'session/checkSessionExists',
    'session/migrateSession',
    // Ignore loading/UI state changes
    'loading/',
    'ui/',
    'error/',
  ],
  syncOnlyUserActions: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: __DEV__,
};

/**
 * Create session sync middleware
 */
export const createSessionSyncMiddleware = (
  sessionStorage: SessionStorageService,
  config: Partial<SessionSyncConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let throttleTimer: NodeJS.Timeout | null = null;
  let pendingSave = false;
  let saveAttempts = 0;
  let lastSaveTime = 0;

  const shouldSyncAction = (action: AnyAction): boolean => {
    // Check if action should be ignored
    if (finalConfig.ignoreActions.some(pattern => action.type.includes(pattern))) {
      return false;
    }

    // Check if action should be synced
    if (finalConfig.syncActions.length > 0) {
      return finalConfig.syncActions.some(pattern => action.type.includes(pattern));
    }

    // If no specific sync actions defined, sync all user actions
    if (finalConfig.syncOnlyUserActions) {
      // Exclude system/internal actions
      return !action.type.includes('@@') && 
             !action.type.includes('persist/') &&
             !action.type.includes('__');
    }

    return true;
  };

  const performSave = async (store: MiddlewareAPI) => {
    if (pendingSave) return;
    
    pendingSave = true;
    
    try {
      const state = store.getState();
      const sessionData = sessionSelectors.selectSessionData(state);
      
      if (!sessionData) {
        if (finalConfig.enableLogging) {
          console.log('🔄 SessionSyncMiddleware: No session data to save');
        }
        return;
      }

      // Check if enough time has passed since last save
      const timeSinceLastSave = Date.now() - lastSaveTime;
      if (timeSinceLastSave < finalConfig.throttleDelay && saveAttempts === 0) {
        if (finalConfig.enableLogging) {
          console.log('🔄 SessionSyncMiddleware: Throttling save operation');
        }
        return;
      }

      // Perform the save
      await sessionStorage.save(sessionData);
      
      lastSaveTime = Date.now();
      saveAttempts = 0;
      
      if (finalConfig.enableLogging) {
        console.log('💾 SessionSyncMiddleware: Session saved successfully', {
          sessionId: sessionData.sessionId,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      saveAttempts++;
      
      if (finalConfig.enableLogging) {
        console.error('❌ SessionSyncMiddleware: Save failed', {
          attempt: saveAttempts,
          maxRetries: finalConfig.maxRetries,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Retry if we haven't exceeded max attempts
      if (saveAttempts < finalConfig.maxRetries) {
        setTimeout(() => {
          performSave(store).catch(retryError => {
            console.error('SessionSyncMiddleware: Retry failed:', retryError);
          });
        }, finalConfig.retryDelay * saveAttempts); // Exponential backoff
      } else {
        // Reset attempts after max retries reached
        saveAttempts = 0;
        console.error('SessionSyncMiddleware: Max save retries exceeded');
      }

    } finally {
      pendingSave = false;
    }
  };

  const scheduleSave = (store: MiddlewareAPI) => {
    // Clear existing timer
    if (throttleTimer) {
      clearTimeout(throttleTimer);
    }

    // Calculate dynamic delay based on recent activity
    const timeSinceLastSave = Date.now() - lastSaveTime;
    let delay = finalConfig.throttleDelay;
    
    // If we've been saving frequently, increase the delay
    if (timeSinceLastSave < finalConfig.throttleDelay * 2) {
      delay = Math.min(delay * 1.5, finalConfig.maxThrottleDelay);
    }

    // Schedule the save
    throttleTimer = setTimeout(() => {
      performSave(store).catch(error => {
        console.error('SessionSyncMiddleware: Scheduled save failed:', error);
      });
    }, delay);

    if (finalConfig.enableLogging) {
      console.log(`⏰ SessionSyncMiddleware: Save scheduled in ${delay}ms`);
    }
  };

  // Return the middleware function
  return (store: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
    // Call the next middleware/reducer first
    const result = next(action);

    // Check if we should sync this action
    if (shouldSyncAction(action)) {
      if (finalConfig.enableLogging) {
        console.log('🔄 SessionSyncMiddleware: Syncing action:', action.type);
      }
      
      // Schedule a save operation
      scheduleSave(store);
    }

    return result;
  };
};

/**
 * Pre-configured session sync middleware with default settings
 */
export const sessionSyncMiddleware = createSessionSyncMiddleware(
  new SessionStorageService()
);

/**
 * Session sync middleware for development with more aggressive syncing
 */
export const devSessionSyncMiddleware = createSessionSyncMiddleware(
  new SessionStorageService(),
  {
    throttleDelay: 500, // More frequent saves in development
    enableLogging: true,
    syncActions: [], // Sync all actions in development
    syncOnlyUserActions: false,
  }
);

/**
 * Session sync middleware for production with conservative settings
 */
export const prodSessionSyncMiddleware = createSessionSyncMiddleware(
  new SessionStorageService(),
  {
    throttleDelay: 2000, // Less frequent saves in production
    maxThrottleDelay: 10000,
    enableLogging: false,
    maxRetries: 5,
    retryDelay: 2000,
  }
);

/**
 * Utility function to create session sync middleware with custom storage service
 */
export const createCustomSessionSyncMiddleware = (
  storageService: SessionStorageService,
  customConfig?: Partial<SessionSyncConfig>
) => {
  return createSessionSyncMiddleware(storageService, customConfig);
}; 