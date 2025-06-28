/**
 * SessionManager.ts
 * 
 * Manages app lifecycle and session state persistence/restoration.
 * Handles pause/resume functionality with app state detection.
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { 
  SessionState, 
  SessionLifecycleState, 
  SessionRestorationInfo,
  SessionEvent,
  SessionEventCallback,
  createDefaultSessionState,
  DEFAULT_SESSION_CONFIG
} from '../types/session';
import { SessionStorageService } from './SessionStorageService';
import { CategoryMemoryManager } from './CategoryMemoryManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@SwipePhoto:isPremium';

/**
 * Session validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canRestore: boolean;
}

/**
 * Session manager configuration
 */
export interface SessionManagerConfig {
  // Session expiry
  sessionExpiryTime: number; // ms
  maxBackgroundTime: number; // ms
  
  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // ms
  
  // Validation
  strictValidation: boolean;
  validateAppVersion: boolean;
  
  // Performance
  progressiveLoading: boolean;
  loadingBatchSize: number;
  
  // Debugging
  enableLogging: boolean;
  enableTelemetry: boolean;
}

/**
 * Progressive loading resource
 */
export interface ProgressiveResource {
  id: string;
  type: 'photo' | 'category' | 'preference' | 'navigation';
  priority: number; // 1 = highest
  size: number; // estimated bytes
  loader: () => Promise<void>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SessionManagerConfig = {
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
};

/**
 * Session manager implementation
 */
export class SessionManager {
  private static instance: SessionManager | null = null;
  
  private config: SessionManagerConfig;
  private sessionStorage: SessionStorageService;
  public categoryMemoryManager: CategoryMemoryManager;
  
  // Current session state
  private currentSession: SessionState | null = null;
  private isInitialized = false;
  private isRestoring = false;
  
  // App lifecycle
  private appStateSubscription: any = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private pauseStartTime: number | null = null;
  
  // Event handling
  private eventListeners: Map<SessionEvent, SessionEventCallback[]> = new Map();
  
  // Progressive loading
  private loadingQueue: ProgressiveResource[] = [];
  private loadingInProgress = false;

  private constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Pass storage config to SessionStorageService to ensure proper key format
    this.sessionStorage = new SessionStorageService(DEFAULT_SESSION_CONFIG);
    this.categoryMemoryManager = new CategoryMemoryManager(this.sessionStorage);
    
    // Clean up old storage keys on first initialization
    this.cleanupLegacyStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<SessionManagerConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    // Note: config is only applied on first initialization to maintain singleton pattern
    return SessionManager.instance;
  }

  /**
   * Reset singleton instance (for testing/debugging)
   */
  public static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.dispose();
      SessionManager.instance = null;
    }
  }

  /**
   * Initialize the session manager
   */
  public async initialize(): Promise<{ recoveryNeeded: boolean }> {
    if (this.isInitialized) return { recoveryNeeded: false };

    try {
      this.log('🔄 SessionManager: Initializing...');

      this.setupAppStateListener();

      const storedSession = await this.sessionStorage.load();
      if (!storedSession || !this.validateSession(storedSession).canRestore) {
        this.log('❌ Session needs recovery or is invalid.');
        this.isInitialized = true; // Mark as initialized to prevent re-entry
        return { recoveryNeeded: true };
      }
      
      await this.attemptSessionRestore();
      await this.checkAndResetDailyCount();
      await this.loadPremiumStatus();

      if (this.config.autoSaveEnabled) {
        this.startAutoSave();
      }

      this.isInitialized = true;
      this.emitEvent('session_started', { restored: this.currentSession?.restoration.wasRestored });
      this.log('✅ SessionManager: Initialized successfully');
      return { recoveryNeeded: false };

    } catch (error) {
      console.error('SessionManager: Initialization failed:', error);
      return { recoveryNeeded: true };
    }
  }

  /**
   * Get current session state
   */
  public getCurrentSession(): SessionState | null {
    return this.currentSession;
  }

  /**
   * Update session state
   */
  public async updateSession(updates: Partial<SessionState>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to update');
    }

    const previousState = { ...this.currentSession };
    this.currentSession = {
      ...this.currentSession,
      ...updates,
      lastSaved: Date.now(),
    };

    this.log('📝 SessionManager: Session updated', {
      sessionId: this.currentSession.sessionId,
      updates: Object.keys(updates),
      newPhotoCount: this.currentSession.dailyPhotoCount,
    });

    // Auto-save if enabled
    if (this.config.autoSaveEnabled) {
      await this.saveSession();
    }
  }

  /**
   * Increment the daily photo count directly in storage for robustness.
   */
  public async incrementPhotoCount(): Promise<void> {
    try {
      // Load the most recent session state directly from storage to avoid in-memory sync issues
      const session = this.currentSession ?? (await this.sessionStorage.load());

      if (!session) {
        this.log('Cannot increment photo count, no session found.');
        return;
      }

      // Increment the count
      const newCount = (session.dailyPhotoCount || 0) + 1;
      session.dailyPhotoCount = newCount;
      
      // Also update the in-memory state to be consistent
      this.currentSession = session;

      // Save back to storage immediately to guarantee persistence
      await this.saveSession();
      this.log(`Photo count incremented. New count: ${newCount}`);

    } catch (error) {
      console.error('Failed to robustly increment photo count', error);
    }
  }

  /**
   * Get the current daily usage from the in-memory state
   */
  public getDailyUsage(): { count: number; limit: number } {
    const count = this.currentSession?.dailyPhotoCount ?? 0;
    const isPremium = this.isPremium();
    const limit = isPremium ? Infinity : 50; // 50 swipes for free users
    
    this.log(`Getting daily usage. In-memory count: ${count}, Limit: ${limit}, Premium: ${isPremium}`);
    return { count, limit };
  }

  /**
   * Checks if the user has a premium status.
   */
  public isPremium(): boolean {
    return this.currentSession?.isPremium ?? false;
  }

  /**
   * Sets the user's premium status and saves it.
   */
  public async setPremiumStatus(isPremium: boolean): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.isPremium = isPremium;
      }
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(isPremium));
      await this.saveSession(); // Persist the change in the main session object as well
      this.log(`Premium status set to: ${isPremium}`);
    } catch (error) {
      console.error('Failed to set premium status:', error);
    }
  }

  /**
   * Pause the session (app going to background)
   */
  public async pause(): Promise<void> {
    if (!this.currentSession || this.currentSession.lifecycle.isPaused) {
      return;
    }

    const pauseTime = Date.now();
    this.pauseStartTime = pauseTime;

    try {
      this.log('⏸️ SessionManager: Pausing session...');

      // Update lifecycle state
      const lifecycleUpdate: Partial<SessionLifecycleState> = {
        isActive: false,
        isPaused: true,
        pausedAt: pauseTime,
        pauseCount: this.currentSession.lifecycle.pauseCount + 1,
        lastActiveTime: pauseTime,
      };

      await this.updateSession({
        lifecycle: {
          ...this.currentSession.lifecycle,
          ...lifecycleUpdate,
        },
      });

      // Force save the session
      await this.saveSession();

      // Flush category memory manager
      await this.categoryMemoryManager.flushPendingWrites();

      this.emitEvent('session_saved', { reason: 'pause', sessionId: this.currentSession.sessionId });

      this.log('✅ SessionManager: Session paused and saved');

    } catch (error) {
      console.error('SessionManager: Failed to pause session:', error);
      this.emitEvent('storage_error', { operation: 'pause', error });
    }
  }

  /**
   * Resume the session (app coming to foreground)
   */
  public async resume(): Promise<void> {
    const resumeTime = Date.now();

    try {
      this.log('▶️ SessionManager: Resuming session...');

      // Calculate background duration
      const backgroundDuration = this.pauseStartTime ? resumeTime - this.pauseStartTime : 0;
      
      // Check if session should be restored or is too old
      const shouldRestore = await this.shouldRestoreSession(backgroundDuration);
      
      if (!shouldRestore) {
        this.log('🔄 SessionManager: Session expired, creating new session');
        await this.createNewSession();
        return;
      }

      if (!this.currentSession) {
        // Attempt to restore from storage
        await this.attemptSessionRestore();
        return;
      }

      // Update lifecycle state
      const totalPauseTime = this.currentSession.lifecycle.totalPauseTime + backgroundDuration;
      
      const lifecycleUpdate: Partial<SessionLifecycleState> = {
        isActive: true,
        isPaused: false,
        resumedAt: resumeTime,
        lastActiveTime: resumeTime,
        totalPauseTime,
        backgroundDuration,
      };

      await this.updateSession({
        lifecycle: {
          ...this.currentSession.lifecycle,
          ...lifecycleUpdate,
        },
      });

      // Start progressive loading if enabled
      if (this.config.progressiveLoading) {
        this.startProgressiveLoading();
      }

      this.emitEvent('session_loaded', { 
        reason: 'resume', 
        sessionId: this.currentSession.sessionId,
        backgroundDuration 
      });

      this.log('✅ SessionManager: Session resumed', {
        backgroundDuration,
        totalPauseTime,
      });

      // Check for daily limit reset
      await this.checkAndResetDailyCount();

    } catch (error) {
      console.error('SessionManager: Failed to resume session:', error);
      this.emitEvent('session_recovery_failed', { error });
      
      // Fallback to new session
      await this.createNewSession();
    } finally {
      this.pauseStartTime = null;
    }
  }

  /**
   * Save session to storage
   */
  public async saveSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No session to save');
    }

    try {
      this.log(`💾 Saving session... Current photo count: ${this.currentSession.dailyPhotoCount}`);
      await this.sessionStorage.save(this.currentSession);
      this.log('💾 SessionManager: Session saved');
    } catch (error) {
      console.error('SessionManager: Failed to save session:', error);
      this.emitEvent('storage_error', { operation: 'save', error });
      throw error;
    }
  }

  /**
   * Validate session state
   */
  public validateSession(session: SessionState): SessionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!session.sessionId) errors.push('Missing sessionId');
    if (!session.version) errors.push('Missing version');
    if (!session.appVersion) errors.push('Missing appVersion');

    // Validate app version
    if (this.config.validateAppVersion && session.appVersion !== '1.0.0') {
      if (this.config.strictValidation) {
        errors.push(`App version mismatch: ${session.appVersion} !== 1.0.0`);
      } else {
        warnings.push(`App version mismatch: ${session.appVersion} !== 1.0.0`);
      }
    }

    // Validate timestamps
    const now = Date.now();
    if (session.lastSaved > now) {
      errors.push('Invalid lastSaved timestamp (future)');
    }

    if (session.lifecycle.pausedAt && session.lifecycle.pausedAt > now) {
      errors.push('Invalid pausedAt timestamp (future)');
    }

    // Check session age
    const sessionAge = now - session.lastSaved;
    if (sessionAge > this.config.sessionExpiryTime) {
      if (this.config.strictValidation) {
        errors.push(`Session expired: ${sessionAge}ms > ${this.config.sessionExpiryTime}ms`);
      } else {
        warnings.push(`Session is old: ${sessionAge}ms`);
      }
    }

    const isValid = errors.length === 0;
    const canRestore = isValid || !this.config.strictValidation;

    return {
      isValid,
      errors,
      warnings,
      canRestore,
    };
  }

  /**
   * Add event listener
   */
  public addEventListener(event: SessionEvent, callback: SessionEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: SessionEvent, callback: SessionEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Dispose of the session manager
   */
  public dispose(): void {
    this.log('🗑️ SessionManager: Disposing...');

    // Save current session
    if (this.currentSession) {
      this.saveSession().catch(error => {
        console.error('SessionManager: Failed to save session during disposal:', error);
      });
    }

    // Clean up timers
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Dispose category memory manager
    this.categoryMemoryManager.dispose();

    // Clear event listeners
    this.eventListeners.clear();

    this.isInitialized = false;
    SessionManager.instance = null;

    this.log('✅ SessionManager: Disposed');
  }

  // Private methods

  /**
   * Set up app state listener
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    this.log('📱 SessionManager: App state changed to', nextAppState);

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.pause().catch(error => {
        console.error('SessionManager: Auto-pause failed:', error);
      });
    } else if (nextAppState === 'active') {
      this.resume().catch(error => {
        console.error('SessionManager: Auto-resume failed:', error);
      });
    }
  };

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.currentSession && this.currentSession.lifecycle.isActive) {
        this.saveSession().catch(error => {
          console.error('SessionManager: Auto-save failed:', error);
        });
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Attempt to restore session from storage
   */
  private async attemptSessionRestore(): Promise<void> {
    if (this.isRestoring) return;
    this.isRestoring = true;

    try {
      this.log('🔄 SessionManager: Attempting session restore...');

      const storedSession = await this.sessionStorage.load();
      
      if (!storedSession) {
        this.log('📝 SessionManager: No stored session found, creating new');
        await this.createNewSession();
        return;
      }

      // Validate stored session
      const validation = this.validateSession(storedSession);
      
      if (!validation.canRestore) {
        this.log('❌ SessionManager: Stored session invalid, creating new', validation.errors);
        await this.createNewSession();
        this.emitEvent('session_recovery_failed', { 
          reason: 'validation_failed', 
          errors: validation.errors 
        });
        return;
      }

      // Update restoration info
      const restorationInfo: SessionRestorationInfo = {
        wasRestored: true,
        restoredFrom: 'storage',
        restorationTime: Date.now(),
        validationSuccess: validation.isValid,
        validationErrors: validation.errors,
        resourcesLoaded: 0,
        totalResources: 0,
      };

      this.currentSession = {
        ...storedSession,
        restoration: restorationInfo,
      };

      this.log('✅ SessionManager: Session restored successfully', {
        sessionId: this.currentSession.sessionId,
        warnings: validation.warnings.length,
        errors: validation.errors.length,
      });

      this.emitEvent('session_recovery_success', {
        sessionId: this.currentSession.sessionId,
        restoredFrom: 'storage',
      });

    } catch (error) {
      console.error('SessionManager: Session restore failed:', error);
      await this.createNewSession();
      this.emitEvent('session_recovery_failed', { error });
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Create a new session
   */
  private async createNewSession(): Promise<void> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = createDefaultSessionState(sessionId);
    await this.loadPremiumStatus();
    this.log('✨ SessionManager: New session created', { sessionId });
    await this.saveSession();
  }

  /**
   * Check if session should be restored based on background time
   */
  private async shouldRestoreSession(backgroundDuration: number): Promise<boolean> {
    if (backgroundDuration > this.config.maxBackgroundTime) {
      return false;
    }

    if (!this.currentSession) {
      return true; // Try to restore from storage
    }

    const sessionAge = Date.now() - this.currentSession.lastSaved;
    return sessionAge <= this.config.sessionExpiryTime;
  }

  /**
   * Start progressive loading of resources
   */
  private startProgressiveLoading(): void {
    if (this.loadingInProgress || this.loadingQueue.length === 0) {
      return;
    }

    this.loadingInProgress = true;
    this.processLoadingQueue().catch(error => {
      console.error('SessionManager: Progressive loading failed:', error);
    }).finally(() => {
      this.loadingInProgress = false;
    });
  }

  /**
   * Process the loading queue
   */
  private async processLoadingQueue(): Promise<void> {
    // Sort by priority
    this.loadingQueue.sort((a, b) => a.priority - b.priority);

    let processed = 0;
    const batchSize = this.config.loadingBatchSize;

    while (this.loadingQueue.length > 0 && processed < batchSize) {
      const resource = this.loadingQueue.shift()!;
      
      try {
        await resource.loader();
        processed++;

        if (this.currentSession) {
          this.currentSession.restoration.resourcesLoaded++;
        }

        this.log('📦 SessionManager: Loaded resource', {
          id: resource.id,
          type: resource.type,
          priority: resource.priority,
        });

      } catch (error) {
        console.error(`SessionManager: Failed to load resource ${resource.id}:`, error);
      }
    }

    // Continue loading more if there are remaining resources
    if (this.loadingQueue.length > 0) {
      setTimeout(() => this.processLoadingQueue(), 100);
    }
  }

  /**
   * Emit session event
   */
  private emitEvent(event: SessionEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.error(`SessionManager: Event listener error for ${event}:`, error);
        }
      });
    }

    if (this.config.enableTelemetry) {
      this.log(`📊 SessionManager: Event emitted - ${event}`, data);
    }
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Clean up legacy storage keys with invalid characters
   */
  private async cleanupLegacyStorage(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const SecureStore = await import('expo-secure-store');
      
      // Old keys that contained invalid characters for SecureStore
      const legacyKeys = [
        '@SwipePhoto:session_state',
        '@SwipePhoto:session_backup',
        '@SwipePhoto:session_metadata',
        '@SwipePhoto_session_state',
        '@SwipePhoto_session_backup',
        '@SwipePhoto_session_metadata',
      ];
      
      // Remove from both storage types
      for (const key of legacyKeys) {
        try {
          await AsyncStorage.removeItem(key);
          if (Platform.OS !== 'web') {
            await SecureStore.deleteItemAsync(key);
          }
        } catch (error) {
          // Ignore errors - key probably doesn't exist
        }
      }
      
      if (__DEV__) {
        console.log('🧹 SessionManager: Legacy storage keys cleaned up');
      }
    } catch (error) {
      console.warn('SessionManager: Failed to cleanup legacy storage:', error);
    }
  }

  /**
   * Checks the last reset date and resets the daily photo count if a new day has started.
   */
  private async checkAndResetDailyCount(): Promise<void> {
    if (!this.currentSession) return;

    const today = new Date().toISOString().split('T')[0];
    if (this.currentSession.lastCountResetDate !== today) {
      this.log(`New day detected. Resetting daily photo count from ${this.currentSession.dailyPhotoCount} to 0.`);
      await this.updateSession({
        dailyPhotoCount: 0,
        lastCountResetDate: today,
      });
      this.emitEvent('daily_limit_reset', { newDate: today });
    }
  }

  private async loadPremiumStatus(): Promise<void> {
    try {
      const premiumValue = await AsyncStorage.getItem(PREMIUM_KEY);
      const isPremium = premiumValue ? JSON.parse(premiumValue) : false;
      if (this.currentSession) {
        this.currentSession.isPremium = isPremium;
      }
      this.log(`Loaded premium status: ${isPremium}`);
    } catch (error) {
      console.error('Failed to load premium status:', error);
      if (this.currentSession) {
        this.currentSession.isPremium = false; // Default to false on error
      }
    }
  }

  public async forceSessionRestore(): Promise<void> {
    await this.attemptSessionRestore();
    // After restoring, re-check daily count and premium status
    await this.checkAndResetDailyCount();
    await this.loadPremiumStatus();
  }

  public async startNewSession(): Promise<void> {
    this.log('🚀 Starting new session from recovery...');
    await this.sessionStorage.clear();
    await this.createNewSession();
  }
} 