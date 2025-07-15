/**
 * session.ts
 * 
 * TypeScript type definitions for session management and state persistence.
 * Defines interfaces for session state, storage, and configuration.
 */

import { UndoableSwipeAction } from './undo';
import { OrganizationFilters } from './organization';

/**
 * Navigation state that needs to be persisted
 */
export interface SessionNavigationState {
  currentScreen: string;
  currentRoute?: string;
  currentPhotoIndex: number;
  selectedCategoryId: string | null;
  selectedCategoryType: 'month' | 'source' | null;
  previousScreen?: string;
  scrollPosition?: number;
  viewMode?: 'grid' | 'list' | 'swipe';
}

/**
 * Category memory tracking for each category's last processed photo
 */
export interface CategoryMemoryState {
  [categoryId: string]: {
    lastPhotoId: string;
    lastPhotoIndex: number;
    totalPhotos: number;
    completedPhotos: number;
    lastAccessTime: number;
    categoryType: 'month' | 'source';
  };
}

/**
 * Navigation route parameters
 */
export interface NavigationRouteParams {
  [key: string]: any;
}

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  routeName: string;
  params?: NavigationRouteParams;
  timestamp: number;
}

/**
 * Session progress information
 */
export interface SessionProgressState {
  sessionId: string;
  sessionStartTime: number;
  categoriesCompleted: string[];
  photosProcessed: number;
  totalPhotos: number;
  currentCategoryProgress: {
    categoryId: string;
    completed: number;
    total: number;
  } | null;
  lastActivityTime: number;
  
  // Category memory tracking
  categoryMemory: CategoryMemoryState;
  
  // Navigation history
  navigationHistory: NavigationHistoryEntry[];
  maxHistoryEntries: number;
  
  // Deletion queue persistence
  deletionQueue: Record<string, string[]>; // categoryId -> photoId[]
}

/**
 * User preferences that persist across sessions
 */
export interface SessionUserPreferences {
  theme: 'light' | 'dark' | 'system';
  hapticFeedbackEnabled: boolean;
  soundEnabled: boolean;
  autoSaveEnabled: boolean;
  swipeThreshold: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  lastUsedFilters: OrganizationFilters;
}

/**
 * Undo state persistence
 */
export interface SessionUndoState {
  undoStack: UndoableSwipeAction[];
  maxUndoActions: number;
  lastUndoTimestamp?: number;
}

/**
 * Session lifecycle state
 */
export interface SessionLifecycleState {
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: number;
  resumedAt?: number;
  lastActiveTime: number;
  totalPauseTime: number;
  pauseCount: number;
  backgroundDuration: number;
}

/**
 * Session restoration info
 */
export interface SessionRestorationInfo {
  wasRestored: boolean;
  restoredFrom?: 'storage' | 'memory' | 'backup';
  restorationTime?: number;
  validationSuccess: boolean;
  validationErrors: string[];
  resourcesLoaded: number;
  totalResources: number;
}

/**
 * Main session state interface
 */
export interface SessionState {
  // Metadata
  version: string;
  sessionId: string;
  lastSaved: number;
  appVersion: string;
  
  // Core state
  navigation: SessionNavigationState;
  progress: SessionProgressState;
  userPreferences: SessionUserPreferences;
  undoState: SessionUndoState;
  
  // Lifecycle management
  lifecycle: SessionLifecycleState;
  restoration: SessionRestorationInfo;
  
  // Session metadata
  metadata: {
    totalSessions: number;
    lastSessionDuration: number;
    crashRecoveryAttempts: number;
    lastCrashTime?: number;
  };

  // Navigation
  currentScreen: string | null;
  navigationHistory: string[];

  // Freemium model usage tracking
  dailyPhotoCount: number;
  lastCountResetDate: string; // ISO 8601 date string
  isPremium?: boolean;
}

/**
 * Session storage interface
 */
export interface ISessionStorageInterface {
  /**
   * Save session state to storage
   */
  save(sessionState: SessionState): Promise<void>;
  
  /**
   * Load session state from storage
   */
  load(): Promise<SessionState | null>;
  
  /**
   * Check if a valid session exists
   */
  isSessionAvailable(): Promise<boolean>;
  
  /**
   * Clear all session data
   */
  clear(): Promise<void>;
  
  /**
   * Get session metadata without loading full state
   */
  getMetadata(): Promise<Pick<SessionState, 'version' | 'sessionId' | 'lastSaved'> | null>;
  
  /**
   * Check if storage has sufficient space
   */
  hasStorageSpace(): Promise<boolean>;
  
  /**
   * Get storage usage statistics
   */
  getStorageStats(): Promise<{
    totalSize: number;
    sessionSize: number;
    availableSpace: number;
  }>;
}

/**
 * Session storage configuration
 */
export interface SessionStorageConfig {
  // Storage keys
  sessionKey: string;
  backupKey: string;
  metadataKey: string;
  
  // Encryption
  enableEncryption: boolean;
  encryptionKey?: string;
  
  // Versioning
  currentVersion: string;
  supportedVersions: string[];
  
  // Performance
  compressionEnabled: boolean;
  maxStorageSize: number; // bytes
  throttleDelay: number; // ms
  
  // Backup & Recovery
  enableBackup: boolean;
  maxBackups: number;
  backupInterval: number; // ms
}

/**
 * Session migration interface
 */
export interface ISessionMigration {
  /**
   * Migrate session state from an older version
   */
  migrate(oldState: any, oldVersion: string, newVersion: string): Promise<SessionState>;
  
  /**
   * Check if migration is needed
   */
  needsMigration(currentVersion: string, targetVersion: string): boolean;
  
  /**
   * Get supported migration paths
   */
  getSupportedMigrations(): { from: string; to: string }[];
}

/**
 * Session recovery result
 */
export interface SessionRecoveryResult {
  success: boolean;
  recoveredState?: SessionState;
  backupUsed?: boolean;
  migrationApplied?: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Session crash detection interface
 */
export interface ISessionCrashDetection {
  /**
   * Mark session as started (to detect crashes)
   */
  markSessionStart(): Promise<void>;
  
  /**
   * Mark session as ended normally
   */
  markSessionEnd(): Promise<void>;
  
  /**
   * Check if last session crashed
   */
  didLastSessionCrash(): Promise<boolean>;
  
  /**
   * Get crash recovery information
   */
  getCrashInfo(): Promise<{
    crashDetected: boolean;
    lastCrashTime?: number;
    crashCount: number;
    recoveryAttempts: number;
  }>;
  
  /**
   * Clear crash detection flags
   */
  clearCrashFlags(): Promise<void>;
}

/**
 * Default session state
 */
export const createDefaultSessionState = (sessionId: string): SessionState => ({
  version: '1.0.0',
  sessionId,
  lastSaved: Date.now(),
  appVersion: '1.0.0', // This should come from app config
  
  navigation: {
    currentScreen: 'Home',
    currentPhotoIndex: 0,
    selectedCategoryId: null,
    selectedCategoryType: null,
    scrollPosition: 0,
  },
  
  progress: {
    sessionId,
    sessionStartTime: Date.now(),
    categoriesCompleted: [],
    photosProcessed: 0,
    totalPhotos: 0,
    currentCategoryProgress: null,
    lastActivityTime: Date.now(),
    categoryMemory: {},
    navigationHistory: [],
    maxHistoryEntries: 50,
    deletionQueue: {},
  },
  
  userPreferences: {
    theme: 'system',
    hapticFeedbackEnabled: true,
    soundEnabled: true,
    autoSaveEnabled: true,
    swipeThreshold: 0.3,
    animationSpeed: 'normal',
    lastUsedFilters: {
      sortBy: 'date',
      sortOrder: 'desc',
    },
  },
  
  undoState: {
    undoStack: [],
    maxUndoActions: 3,
  },
  
  lifecycle: {
    isActive: true,
    isPaused: false,
    lastActiveTime: Date.now(),
    totalPauseTime: 0,
    pauseCount: 0,
    backgroundDuration: 0,
  },
  
  restoration: {
    wasRestored: false,
    validationSuccess: true,
    validationErrors: [],
    resourcesLoaded: 0,
    totalResources: 0,
  },
  
  metadata: {
    totalSessions: 1,
    lastSessionDuration: 0,
    crashRecoveryAttempts: 0,
  },

  // Navigation
  currentScreen: 'Home',
  navigationHistory: [],

  // Freemium
  dailyPhotoCount: 0,
  lastCountResetDate: new Date().toISOString().split('T')[0],
  isPremium: false,
});

/**
 * Default storage configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionStorageConfig = {
  sessionKey: 'SwipePhoto_session_state',
  backupKey: 'SwipePhoto_session_backup',
  metadataKey: 'SwipePhoto_session_metadata',
  
  enableEncryption: true,
  
  currentVersion: '1.0.0',
  supportedVersions: ['1.0.0'],
  
  compressionEnabled: true,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
  throttleDelay: 1000, // 1 second
  
  enableBackup: true,
  maxBackups: 3,
  backupInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * Session event types for analytics/debugging
 */
export type SessionEvent = 
  | 'session_started'
  | 'session_ended' 
  | 'session_saved'
  | 'session_loaded'
  | 'session_migrated'
  | 'session_recovery_success'
  | 'session_recovery_failed'
  | 'session_crash_detected'
  | 'storage_error'
  | 'storage_quota_exceeded'
  | 'session_resumed'
  | 'validation_error'
  | 'daily_limit_reset';

/**
 * Session event callback
 */
export type SessionEventCallback = (event: SessionEvent, data?: any) => void; 