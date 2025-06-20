/**
 * ProgressTracker.ts
 * 
 * Specialized service for tracking and auto-saving user progress during background transitions.
 * Works in conjunction with SessionManager to ensure no data loss during interruptions.
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionStorageService } from './SessionStorageService';
import { SessionManager } from './SessionManager';

/**
 * Progress change item with priority
 */
export interface ProgressChange {
  key: string;
  data: any;
  priority: 'critical' | 'normal' | 'low';
  timestamp: number;
  retryCount?: number;
}

/**
 * Background save task info
 */
export interface BackgroundSaveTask {
  id: string;
  changes: ProgressChange[];
  startTime: number;
  timeout: number;
  status: 'pending' | 'saving' | 'completed' | 'failed';
}

/**
 * Progress tracker configuration
 */
export interface ProgressTrackerConfig {
  autoSaveInterval: number; // ms
  backgroundSaveTimeout: number; // ms
  maxRetryAttempts: number;
  criticalSaveDelay: number; // ms - delay before saving critical changes
  batchSize: number; // max changes per save operation
  enableLogging: boolean;
}

/**
 * Auto-save and recovery events
 */
export type ProgressTrackerEvent = 
  | 'progress_tracked' 
  | 'auto_save_started' 
  | 'auto_save_completed' 
  | 'auto_save_failed'
  | 'background_save_started'
  | 'background_save_completed'
  | 'recovery_started'
  | 'recovery_completed'
  | 'critical_save_triggered';

export type ProgressTrackerEventCallback = (event: ProgressTrackerEvent, data?: any) => void;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ProgressTrackerConfig = {
  autoSaveInterval: 30 * 1000, // 30 seconds
  backgroundSaveTimeout: 10 * 1000, // 10 seconds max for background save
  maxRetryAttempts: 3,
  criticalSaveDelay: 1000, // 1 second
  batchSize: 50,
  enableLogging: __DEV__,
};

/**
 * Progress Tracker Service
 * 
 * Handles automatic progress saving and recovery for background app transitions
 */
export class ProgressTracker {
  private static instance: ProgressTracker | null = null;
  
  private config: ProgressTrackerConfig;
  private sessionStorage: SessionStorageService;
  private sessionManager: SessionManager | null = null;
  
  // Change tracking
  private changeBuffer: Map<string, ProgressChange> = new Map();
  private isTrackingEnabled = false;
  private lastSaveTimestamp = Date.now();
  
  // Auto-save management
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private criticalSaveTimer: NodeJS.Timeout | null = null;
  
  // Background task management
  private currentBackgroundTask: BackgroundSaveTask | null = null;
  private backgroundTaskId = 0;
  
  // App state monitoring
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = AppState.currentState;
  
  // Event handling
  private eventListeners: Map<ProgressTrackerEvent, ProgressTrackerEventCallback[]> = new Map();
  
  // Recovery system
  private recoveryInProgress = false;
  
  private constructor(config: Partial<ProgressTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionStorage = new SessionStorageService();
    this.setupAppStateListener();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<ProgressTrackerConfig>): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker(config);
    }
    return ProgressTracker.instance;
  }

  /**
   * Initialize progress tracker
   */
  public async initialize(sessionManager?: SessionManager): Promise<void> {
    try {
      this.log('🔄 ProgressTracker: Initializing...');
      
      if (sessionManager) {
        this.sessionManager = sessionManager;
      }
      
      // Attempt recovery from previous session
      await this.attemptRecovery();
      
      // Start tracking
      this.isTrackingEnabled = true;
      this.startAutoSave();
      
      this.log('✅ ProgressTracker: Initialized successfully');
      this.emitEvent('progress_tracked', { action: 'initialized' });
      
    } catch (error) {
      console.error('ProgressTracker: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Track a progress change
   */
  public trackChange(key: string, data: any, priority: 'critical' | 'normal' | 'low' = 'normal'): void {
    if (!this.isTrackingEnabled) return;

    const change: ProgressChange = {
      key,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.changeBuffer.set(key, change);
    
    this.log(`📝 ProgressTracker: Change tracked`, { key, priority, bufferSize: this.changeBuffer.size });
    this.emitEvent('progress_tracked', { change });

    // Handle critical changes immediately
    if (priority === 'critical') {
      this.scheduleCriticalSave();
    }
  }

  /**
   * Schedule immediate save for critical changes
   */
  private scheduleCriticalSave(): void {
    if (this.criticalSaveTimer) {
      clearTimeout(this.criticalSaveTimer);
    }

    this.criticalSaveTimer = setTimeout(async () => {
      try {
        this.log('🚨 ProgressTracker: Critical save triggered');
        this.emitEvent('critical_save_triggered');
        await this.saveProgress(true);
      } catch (error) {
        console.error('ProgressTracker: Critical save failed:', error);
      }
    }, this.config.criticalSaveDelay);
  }

  /**
   * Save pending progress changes
   */
  public async saveProgress(forceSave = false): Promise<void> {
    if (!this.isTrackingEnabled || (this.changeBuffer.size === 0 && !forceSave)) {
      return;
    }

    try {
      this.log('💾 ProgressTracker: Saving progress...');
      this.emitEvent('auto_save_started', { changeCount: this.changeBuffer.size });

      // Get changes sorted by priority
      const changes = this.getSortedChanges();
      
      // Batch changes if needed
      const batches = this.batchChanges(changes);
      
      for (const batch of batches) {
        await this.saveBatch(batch);
      }

      // Clear saved changes
      this.changeBuffer.clear();
      this.lastSaveTimestamp = Date.now();

      this.log('✅ ProgressTracker: Progress saved successfully');
      this.emitEvent('auto_save_completed', { savedChanges: changes.length });

    } catch (error) {
      console.error('ProgressTracker: Save progress failed:', error);
             this.emitEvent('auto_save_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
             // Retry mechanism for failed saves
       await this.handleSaveFailure(error as Error);
    }
  }

  /**
   * Handle app state changes
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    const previousState = this.currentAppState;
    this.currentAppState = nextAppState;

    this.log(`📱 ProgressTracker: App state changed: ${previousState} → ${nextAppState}`);

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      await this.handleBackgroundTransition();
    } else if (nextAppState === 'active' && previousState !== 'active') {
      await this.handleForegroundTransition();
    }
  };

  /**
   * Handle app going to background
   */
  private async handleBackgroundTransition(): Promise<void> {
    try {
      this.log('⏸️ ProgressTracker: App going to background, initiating save...');
      this.emitEvent('background_save_started');

      // Create background task
      const taskId = `bg_save_${++this.backgroundTaskId}`;
      const backgroundTask: BackgroundSaveTask = {
        id: taskId,
        changes: this.getSortedChanges(),
        startTime: Date.now(),
        timeout: this.config.backgroundSaveTimeout,
        status: 'pending',
      };

      this.currentBackgroundTask = backgroundTask;

      // Execute background save with timeout
      await Promise.race([
        this.executeBackgroundSave(backgroundTask),
        this.createTimeoutPromise(this.config.backgroundSaveTimeout),
      ]);

      this.log('✅ ProgressTracker: Background save completed');
      this.emitEvent('background_save_completed', { taskId });

    } catch (error) {
      console.error('ProgressTracker: Background save failed:', error);
             this.emitEvent('auto_save_failed', { context: 'background', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Handle app coming to foreground
   */
  private async handleForegroundTransition(): Promise<void> {
    this.log('▶️ ProgressTracker: App returning to foreground');
    
    // Resume normal operations
    if (!this.autoSaveTimer) {
      this.startAutoSave();
    }
  }

  /**
   * Execute background save task
   */
  private async executeBackgroundSave(task: BackgroundSaveTask): Promise<void> {
    task.status = 'saving';

    try {
      // Save critical changes first
      const criticalChanges = task.changes.filter(c => c.priority === 'critical');
      if (criticalChanges.length > 0) {
        await this.saveBatch(criticalChanges);
      }

      // Save remaining changes
      const otherChanges = task.changes.filter(c => c.priority !== 'critical');
      if (otherChanges.length > 0) {
        const batches = this.batchChanges(otherChanges);
        for (const batch of batches) {
          await this.saveBatch(batch);
        }
      }

      // Update session manager if available
      if (this.sessionManager) {
        await this.sessionManager.saveSession();
      }

      task.status = 'completed';
      this.changeBuffer.clear();

    } catch (error) {
      task.status = 'failed';
      throw error;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Background save timeout')), timeout);
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      await this.saveProgress();
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Get changes sorted by priority
   */
  private getSortedChanges(): ProgressChange[] {
    const changes = Array.from(this.changeBuffer.values());
    
    // Sort by priority: critical -> normal -> low
    return changes.sort((a, b) => {
      const priorityOrder = { critical: 0, normal: 1, low: 2 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Batch changes for efficient saving
   */
  private batchChanges(changes: ProgressChange[]): ProgressChange[][] {
    const batches: ProgressChange[][] = [];
    
    for (let i = 0; i < changes.length; i += this.config.batchSize) {
      batches.push(changes.slice(i, i + this.config.batchSize));
    }
    
    return batches;
  }

  /**
   * Save a batch of changes
   */
  private async saveBatch(changes: ProgressChange[]): Promise<void> {
    if (changes.length === 0) return;

    try {
      // Create a data object from changes
      const dataToSave: Record<string, any> = {};
      const metadata = {
        timestamp: Date.now(),
        changeCount: changes.length,
        priorities: changes.map(c => c.priority),
      };

      for (const change of changes) {
        dataToSave[change.key] = change.data;
      }

      // Save to AsyncStorage as backup
      const storageKey = `@SwipePhoto_progress_backup_${Date.now()}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        data: dataToSave,
        metadata,
      }));

      this.log(`💾 ProgressTracker: Batch saved`, { 
        changeCount: changes.length, 
        priorities: metadata.priorities 
      });

    } catch (error) {
      // Retry failed changes
      for (const change of changes) {
        change.retryCount = (change.retryCount || 0) + 1;
        if (change.retryCount <= this.config.maxRetryAttempts) {
          this.changeBuffer.set(change.key, change);
        }
      }
      throw error;
    }
  }

  /**
   * Handle save failure with retry logic
   */
  private async handleSaveFailure(error: any): Promise<void> {
    this.log(`❌ ProgressTracker: Save failed, implementing recovery...`, { error: error.message });
    
    // Implement exponential backoff for retries
    const retryDelay = Math.min(1000 * Math.pow(2, this.backgroundTaskId), 10000);
    
    setTimeout(async () => {
      try {
        await this.saveProgress();
      } catch (retryError) {
        console.error('ProgressTracker: Retry save also failed:', retryError);
      }
    }, retryDelay);
  }

  /**
   * Attempt recovery from previous session
   */
  private async attemptRecovery(): Promise<void> {
    if (this.recoveryInProgress) return;

    try {
      this.recoveryInProgress = true;
      this.log('🔄 ProgressTracker: Attempting recovery...');
      this.emitEvent('recovery_started');

      // Look for backup progress data
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith('@SwipePhoto_progress_backup_'));
      
      if (progressKeys.length === 0) {
        this.log('📦 ProgressTracker: No recovery data found');
        return;
      }

      // Get the most recent backup
      const sortedKeys = progressKeys.sort().reverse();
      const latestKey = sortedKeys[0];
      
      let recoveredKeys: string[] = [];
      
      const backupData = await AsyncStorage.getItem(latestKey);
      if (backupData) {
        const { data, metadata } = JSON.parse(backupData);
        
        this.log('🔄 ProgressTracker: Recovery data found', { 
          timestamp: metadata.timestamp,
          changeCount: metadata.changeCount 
        });

        // Restore changes to buffer for processing
        for (const [key, value] of Object.entries(data)) {
          this.trackChange(key, value, 'normal');
        }

        recoveredKeys = Object.keys(data);

        // Clean up old backups
        await this.cleanupBackups(progressKeys);
      }

      this.emitEvent('recovery_completed', { recoveredKeys });
      this.log('✅ ProgressTracker: Recovery completed');

    } catch (error) {
      console.error('ProgressTracker: Recovery failed:', error);
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Clean up old backup files
   */
  private async cleanupBackups(backupKeys: string[]): Promise<void> {
    try {
      // Keep only the 5 most recent backups
      const keysToDelete = backupKeys.slice(5);
      
      for (const key of keysToDelete) {
        await AsyncStorage.removeItem(key);
      }
      
      if (keysToDelete.length > 0) {
        this.log(`🧹 ProgressTracker: Cleaned up ${keysToDelete.length} old backups`);
      }
    } catch (error) {
      console.warn('ProgressTracker: Backup cleanup failed:', error);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: ProgressTrackerEvent, callback: ProgressTrackerEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: ProgressTrackerEvent, callback: ProgressTrackerEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: ProgressTrackerEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.warn('ProgressTracker: Event listener error:', error);
        }
      });
    }
  }

  /**
   * Get current tracking stats
   */
  public getTrackingStats(): {
    isTracking: boolean;
    pendingChanges: number;
    lastSaveTime: number;
    currentAppState: AppStateStatus;
    backgroundTaskActive: boolean;
  } {
    return {
      isTracking: this.isTrackingEnabled,
      pendingChanges: this.changeBuffer.size,
      lastSaveTime: this.lastSaveTimestamp,
      currentAppState: this.currentAppState,
      backgroundTaskActive: this.currentBackgroundTask?.status === 'saving' || false,
    };
  }

  /**
   * Dispose of the tracker
   */
  public dispose(): void {
    this.log('🗑️ ProgressTracker: Disposing...');
    
    this.isTrackingEnabled = false;
    
    // Clean up timers
    this.stopAutoSave();
    if (this.criticalSaveTimer) {
      clearTimeout(this.criticalSaveTimer);
    }
    
    // Clean up app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    // Clear data
    this.changeBuffer.clear();
    this.eventListeners.clear();
    
    this.log('✅ ProgressTracker: Disposed');
  }

  /**
   * Reset singleton (for testing)
   */
  public static resetInstance(): void {
    if (ProgressTracker.instance) {
      ProgressTracker.instance.dispose();
      ProgressTracker.instance = null;
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