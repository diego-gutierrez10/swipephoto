/**
 * SessionManager.ts
 * 
 * Manages app lifecycle and session state persistence/restoration.
 * Handles pause/resume functionality with app state detection.
 */

import { AppState, AppStateStatus } from 'react-native';
import { 
  SessionState, 
  SessionLifecycleState, 
  SessionRestorationInfo,
  SessionEvent,
  SessionEventCallback,
  createDefaultSessionState 
} from '../types/session';
import { SessionStorageService } from './SessionStorageService';
import { CategoryMemoryManager } from './CategoryMemoryManager';

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
  private categoryMemoryManager: CategoryMemoryManager;
  
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
    this.sessionStorage = new SessionStorageService();
    this.categoryMemoryManager = new CategoryMemoryManager(this.sessionStorage);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<SessionManagerConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  /**
   * Initialize the session manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.log('🔄 SessionManager: Initializing...');

      // Set up app state listener
      this.setupAppStateListener();

      // Try to restore previous session
      await this.attemptSessionRestore();

      // Start auto-save if enabled
      if (this.config.autoSaveEnabled) {
        this.startAutoSave();
      }

      this.isInitialized = true;
      this.emitEvent('session_started', { restored: this.currentSession?.restoration.wasRestored });

      this.log('✅ SessionManager: Initialized successfully');

    } catch (error) {
      console.error('SessionManager: Initialization failed:', error);
      
      // Create a new session as fallback
      await this.createNewSession();
      this.isInitialized = true;
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
    });

    // Auto-save if enabled
    if (this.config.autoSaveEnabled) {
      await this.saveSession();
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
    
    this.log('📝 SessionManager: Created new session', { sessionId });
    
    // Save immediately
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
} 