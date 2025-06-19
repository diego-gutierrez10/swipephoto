import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dispatch, Store } from '@reduxjs/toolkit';
import { debounce, throttle } from '../utils/animations';
import {
  updateProgress,
  incrementProgress,
  decrementProgress,
  updateCategoryProgress,
  startSession,
  endSession,
  setTotal,
} from '../store/slices/progressSlice';

export interface ProgressUpdateEvent {
  type: 'photo_processed' | 'category_completed' | 'session_started' | 'session_ended';
  payload: any;
  timestamp: number;
}

export interface ProgressPersistenceData {
  current: number;
  total: number;
  sessionId: string;
  startTime: number;
  categories: Record<string, { completed: number; total: number }>;
  lastUpdated: number;
}

/**
 * Centralized progress management service that coordinates updates
 * between all progress UI components with debouncing and persistence
 */
export class ProgressManager {
  private static instance: ProgressManager;
  private store?: Store;
  private dispatch?: Dispatch;
  
  // Update queues for batching
  private updateQueue: Map<string, any> = new Map();
  private processingQueue = false;
  
  // Persistence
  private readonly STORAGE_KEY = 'swipephoto_progress';
  private lastPersistTime = 0;
  private readonly PERSIST_THROTTLE = 2000; // Save at most every 2 seconds
  
  // Event listeners
  private listeners: Set<(event: ProgressUpdateEvent) => void> = new Set();
  
  // Debounced/throttled functions
  private debouncedProcessQueue: () => void;
  private throttledPersist: () => void;
  private throttledCategoryUpdate: (categoryId: string, completed: number, total: number) => void;

  private constructor() {
    this.debouncedProcessQueue = debounce(this.processUpdateQueue.bind(this), 100);
    this.throttledPersist = throttle(this.persistProgress.bind(this), this.PERSIST_THROTTLE);
    this.throttledCategoryUpdate = throttle(this.updateCategoryProgressInternal.bind(this), 300);
  }

  static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  /**
   * Initialize the progress manager with Redux store
   */
  initialize(store: Store): void {
    this.store = store;
    this.dispatch = store.dispatch;
    this.loadPersistedProgress();
  }

  /**
   * Add event listener for progress updates
   */
  addListener(listener: (event: ProgressUpdateEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit progress event to all listeners
   */
  private emitEvent(type: ProgressUpdateEvent['type'], payload: any): void {
    const event: ProgressUpdateEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Progress event listener error:', error);
      }
    });
  }

  /**
   * Start a new progress session
   */
  startProgressSession(sessionId: string, totalPhotos: number): void {
    if (!this.dispatch) return;

    this.dispatch(startSession({ sessionId, total: totalPhotos }));
    this.emitEvent('session_started', { sessionId, totalPhotos });
    this.throttledPersist();
  }

  /**
   * End the current progress session
   */
  endProgressSession(): void {
    if (!this.dispatch) return;

    this.dispatch(endSession());
    this.emitEvent('session_ended', {});
    this.clearPersistedProgress();
  }

  /**
   * Update overall progress (queued and debounced)
   */
  updateOverallProgress(current: number): void {
    this.updateQueue.set('overall', current);
    this.debouncedProcessQueue();
  }

  /**
   * Increment progress by 1 (immediate)
   */
  incrementOverallProgress(): void {
    if (!this.dispatch) return;
    
    this.dispatch(incrementProgress());
    this.emitEvent('photo_processed', { action: 'increment' });
    this.throttledPersist();
  }

  /**
   * Decrement progress by 1 (immediate)
   */
  decrementOverallProgress(): void {
    if (!this.dispatch) return;
    
    this.dispatch(decrementProgress());
    this.emitEvent('photo_processed', { action: 'decrement' });
    this.throttledPersist();
  }

  /**
   * Set total number of photos
   */
  setTotalPhotos(total: number): void {
    if (!this.dispatch) return;
    
    this.dispatch(setTotal({ total }));
    this.throttledPersist();
  }

  /**
   * Update category progress (throttled)
   */
  updateCategoryProgress(categoryId: string, completed: number, total: number): void {
    this.updateQueue.set(`category_${categoryId}`, { categoryId, completed, total });
    this.throttledCategoryUpdate(categoryId, completed, total);
  }

  /**
   * Internal category update implementation
   */
  private updateCategoryProgressInternal(categoryId: string, completed: number, total: number): void {
    if (!this.dispatch) return;
    
    this.dispatch(updateCategoryProgress({ categoryId, completed, total }));
    
    // Check if category is completed
    if (completed === total && total > 0) {
      this.emitEvent('category_completed', { categoryId, completed, total });
    }
    
    this.throttledPersist();
  }

  /**
   * Process queued updates in batch
   */
  private processUpdateQueue(): void {
    if (this.processingQueue || !this.dispatch) return;
    
    this.processingQueue = true;
    
    try {
      // Process overall progress updates
      if (this.updateQueue.has('overall')) {
        const current = this.updateQueue.get('overall');
        this.dispatch(updateProgress({ current }));
        this.updateQueue.delete('overall');
        this.emitEvent('photo_processed', { current });
      }

      // Process category updates
      for (const [key, value] of this.updateQueue.entries()) {
        if (key.startsWith('category_')) {
          const { categoryId, completed, total } = value;
          this.dispatch(updateCategoryProgress({ categoryId, completed, total }));
          this.updateQueue.delete(key);
        }
      }

      this.throttledPersist();
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Persist current progress to AsyncStorage
   */
  private async persistProgress(): Promise<void> {
    if (!this.store) return;

    const now = Date.now();
    if (now - this.lastPersistTime < this.PERSIST_THROTTLE) {
      return; // Throttle saves
    }

    try {
      const state = this.store.getState();
      const progressData: ProgressPersistenceData = {
        current: state.progress.current,
        total: state.progress.total,
        sessionId: state.progress.sessionId,
        startTime: state.progress.startTime,
        categories: state.progress.categories,
        lastUpdated: now,
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(progressData));
      this.lastPersistTime = now;
    } catch (error) {
      console.warn('Failed to persist progress:', error);
    }
  }

  /**
   * Load persisted progress from AsyncStorage
   */
  private async loadPersistedProgress(): Promise<void> {
    if (!this.dispatch) return;

    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const progressData: ProgressPersistenceData = JSON.parse(data);
      
      // Check if data is recent (within 24 hours)
      const ageInHours = (Date.now() - progressData.lastUpdated) / (1000 * 60 * 60);
      if (ageInHours > 24) {
        await this.clearPersistedProgress();
        return;
      }

      // Restore session if it was active
      if (progressData.sessionId) {
        this.dispatch(startSession({
          sessionId: progressData.sessionId,
          total: progressData.total,
        }));
        
        // Restore current progress
        this.dispatch(updateProgress({ current: progressData.current }));
        
        // Restore category progress
        Object.entries(progressData.categories).forEach(([categoryId, { completed, total }]) => {
          this.dispatch!(updateCategoryProgress({ categoryId, completed, total }));
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted progress:', error);
      await this.clearPersistedProgress();
    }
  }

  /**
   * Clear persisted progress data
   */
  private async clearPersistedProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted progress:', error);
    }
  }

  /**
   * Get current progress statistics
   */
  getProgressStats(): any {
    if (!this.store) return null;
    
    const state = this.store.getState();
    return {
      current: state.progress.current,
      total: state.progress.total,
      percentage: state.progress.total > 0 ? (state.progress.current / state.progress.total) * 100 : 0,
      sessionId: state.progress.sessionId,
      isActive: Boolean(state.progress.sessionId),
      categories: state.progress.categories,
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.listeners.clear();
    this.updateQueue.clear();
    this.store = undefined;
    this.dispatch = undefined;
  }
} 