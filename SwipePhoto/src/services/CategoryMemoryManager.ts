/**
 * CategoryMemoryManager.ts
 * 
 * Manages category memory and navigation state persistence.
 * Tracks the last processed photo in each category and handles navigation state.
 */

import { 
  CategoryMemoryState, 
  NavigationHistoryEntry, 
  NavigationRouteParams,
  SessionState,
} from '../types/session';
import { SessionStorageService } from './SessionStorageService';

/**
 * Category progress information
 */
export interface CategoryProgress {
  lastPhotoId: string;
  lastPhotoIndex: number;
  totalPhotos: number;
  completedPhotos: number;
  keptCount?: number;
  deletedCount?: number;
  lastAccessTime: number;
  categoryType: 'month' | 'source';
}

/**
 * Navigation state update
 */
export interface NavigationStateUpdate {
  routeName: string;
  params?: NavigationRouteParams;
  previousRoute?: string;
}

/**
 * Category memory manager interface
 */
export interface ICategoryMemoryManager {
  // Category progress methods
  updateCategoryProgress(categoryId: string, progress: Partial<CategoryProgress>): Promise<void>;
  getCategoryProgress(categoryId: string): Promise<CategoryProgress | null>;
  resetCategoryProgress(categoryId?: string): Promise<void>;
  getAllCategoryProgress(): Promise<CategoryMemoryState>;
  
  // Navigation methods
  updateNavigationState(update: NavigationStateUpdate): Promise<void>;
  getNavigationHistory(): Promise<NavigationHistoryEntry[]>;
  clearNavigationHistory(): Promise<void>;
  
  // Utility methods
  flushPendingWrites(): Promise<void>;
  getCacheStats(): {
    cachedCategories: number;
    pendingWrites: number;
    lastFlushTime: number;
  };
}

/**
 * Configuration for CategoryMemoryManager
 */
export interface CategoryMemoryConfig {
  debounceDelay: number; // ms
  maxHistoryEntries: number;
  enableCaching: boolean;
  autoFlushInterval: number; // ms
  enableLogging: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CategoryMemoryConfig = {
  debounceDelay: 1000, // 1 second
  maxHistoryEntries: 50,
  enableCaching: true,
  autoFlushInterval: 5000, // 5 seconds
  enableLogging: __DEV__,
};

/**
 * Category memory manager implementation
 */
export class CategoryMemoryManager implements ICategoryMemoryManager {
  private config: CategoryMemoryConfig;
  
  // In-memory cache for fast access
  private memoryCache: Map<string, CategoryProgress> = new Map();
  private navigationCache: NavigationHistoryEntry[] = [];
  
  // Pending writes tracking
  private pendingCategoryWrites: Set<string> = new Set();
  private pendingNavigationWrite = false;
  
  // Debouncing timers
  private writeDebounceTimer: NodeJS.Timeout | null = null;
  private autoFlushTimer: NodeJS.Timeout | null = null;
  
  // Stats
  private lastFlushTime = 0;
  private isInitialized = false;

  constructor(
    private sessionStorage: SessionStorageService,
    config: Partial<CategoryMemoryConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize the manager by loading existing data
   */
  private async initialize(): Promise<void> {
    try {
      const sessionData = await this.sessionStorage.load();
      
      if (sessionData?.progress) {
        // Load category memory
        if (sessionData.progress.categoryMemory) {
          Object.entries(sessionData.progress.categoryMemory).forEach(([categoryId, progress]) => {
            this.memoryCache.set(categoryId, progress);
          });
        }
        
        // Load navigation history
        if (sessionData.progress.navigationHistory) {
          this.navigationCache = [...sessionData.progress.navigationHistory];
        }
      }

      // Start auto-flush timer if enabled
      if (this.config.autoFlushInterval > 0) {
        this.startAutoFlush();
      }

      this.isInitialized = true;

      if (this.config.enableLogging) {
        console.log('📂 CategoryMemoryManager: Initialized', {
          cachedCategories: this.memoryCache.size,
          navigationHistory: this.navigationCache.length,
        });
      }

    } catch (error) {
      console.error('CategoryMemoryManager: Initialization failed:', error);
      this.isInitialized = true; // Continue with empty state
    }
  }

  /**
   * Update category progress
   */
  async updateCategoryProgress(categoryId: string, progress: Partial<CategoryProgress>): Promise<void> {
    await this.ensureInitialized();

    // Get existing progress or create new
    const existingProgress = this.memoryCache.get(categoryId);
    const updatedProgress: CategoryProgress = {
      lastPhotoId: '',
      lastPhotoIndex: 0,
      totalPhotos: 0,
      completedPhotos: 0,
      categoryType: 'month',
      ...existingProgress,
      ...progress,
      lastAccessTime: Date.now(), // Always update access time
    };

    // Update cache
    this.memoryCache.set(categoryId, updatedProgress);
    this.pendingCategoryWrites.add(categoryId);

    if (this.config.enableLogging) {
      console.log('📂 CategoryMemoryManager: Updated category progress', {
        categoryId,
        photoId: updatedProgress.lastPhotoId,
        index: updatedProgress.lastPhotoIndex,
        completed: updatedProgress.completedPhotos,
        total: updatedProgress.totalPhotos,
      });
    }

    // Schedule debounced write
    this.scheduleWrite();
  }

  /**
   * Get category progress
   */
  async getCategoryProgress(categoryId: string): Promise<CategoryProgress | null> {
    await this.ensureInitialized();
    return this.memoryCache.get(categoryId) || null;
  }

  /**
   * Reset category progress
   */
  async resetCategoryProgress(categoryId?: string): Promise<void> {
    await this.ensureInitialized();

    if (categoryId) {
      // Reset specific category
      this.memoryCache.delete(categoryId);
      this.pendingCategoryWrites.add(categoryId);
    } else {
      // Reset all categories
      this.memoryCache.clear();
      this.pendingCategoryWrites.clear();
      // Mark all for deletion by adding a special flag
      this.pendingCategoryWrites.add('__CLEAR_ALL__');
    }

    this.scheduleWrite();

    if (this.config.enableLogging) {
      console.log('📂 CategoryMemoryManager: Reset category progress', {
        categoryId: categoryId || 'ALL',
      });
    }
  }

  /**
   * Get all category progress
   */
  async getAllCategoryProgress(): Promise<CategoryMemoryState> {
    await this.ensureInitialized();
    
    const result: CategoryMemoryState = {};
    this.memoryCache.forEach((progress, categoryId) => {
      result[categoryId] = progress;
    });
    
    return result;
  }

  /**
   * Update navigation state
   */
  async updateNavigationState(update: NavigationStateUpdate): Promise<void> {
    await this.ensureInitialized();

    const entry: NavigationHistoryEntry = {
      routeName: update.routeName,
      params: update.params,
      timestamp: Date.now(),
    };

    // Add to navigation history
    this.navigationCache.unshift(entry);

    // Trim history to max entries
    if (this.navigationCache.length > this.config.maxHistoryEntries) {
      this.navigationCache = this.navigationCache.slice(0, this.config.maxHistoryEntries);
    }

    this.pendingNavigationWrite = true;

    if (this.config.enableLogging) {
      console.log('🧭 CategoryMemoryManager: Updated navigation state', {
        routeName: update.routeName,
        params: update.params,
        historyLength: this.navigationCache.length,
      });
    }

    // Schedule debounced write
    this.scheduleWrite();
  }

  /**
   * Get navigation history
   */
  async getNavigationHistory(): Promise<NavigationHistoryEntry[]> {
    await this.ensureInitialized();
    return [...this.navigationCache];
  }

  /**
   * Clear navigation history
   */
  async clearNavigationHistory(): Promise<void> {
    await this.ensureInitialized();
    
    this.navigationCache = [];
    this.pendingNavigationWrite = true;
    this.scheduleWrite();

    if (this.config.enableLogging) {
      console.log('🧭 CategoryMemoryManager: Cleared navigation history');
    }
  }

  /**
   * Flush pending writes immediately
   */
  async flushPendingWrites(): Promise<void> {
    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
      this.writeDebounceTimer = null;
    }

    await this.performWrite();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedCategories: this.memoryCache.size,
      pendingWrites: this.pendingCategoryWrites.size,
      lastFlushTime: this.lastFlushTime,
    };
  }

  /**
   * Schedule a debounced write operation
   */
  private scheduleWrite(): void {
    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
    }

    this.writeDebounceTimer = setTimeout(() => {
      this.performWrite().catch(error => {
        console.error('CategoryMemoryManager: Scheduled write failed:', error);
      });
    }, this.config.debounceDelay);
  }

  /**
   * Perform the actual write operation
   */
  private async performWrite(): Promise<void> {
    if (!this.isInitialized) return;

    const startTime = Date.now();

    try {
      // Load current session data
      const sessionData = await this.sessionStorage.load();
      if (!sessionData) {
        console.warn('CategoryMemoryManager: No session data found for write');
        return;
      }

      let hasChanges = false;

      // Update category memory if there are pending writes
      if (this.pendingCategoryWrites.size > 0) {
        if (this.pendingCategoryWrites.has('__CLEAR_ALL__')) {
          // Clear all categories
          sessionData.progress.categoryMemory = {};
          this.pendingCategoryWrites.clear();
        } else {
          // Update specific categories
          this.pendingCategoryWrites.forEach(categoryId => {
            const progress = this.memoryCache.get(categoryId);
            if (progress) {
              sessionData.progress.categoryMemory[categoryId] = progress;
            } else {
              // Category was deleted
              delete sessionData.progress.categoryMemory[categoryId];
            }
          });
          this.pendingCategoryWrites.clear();
        }
        hasChanges = true;
      }

      // Update navigation history if pending
      if (this.pendingNavigationWrite) {
        sessionData.progress.navigationHistory = [...this.navigationCache];
        this.pendingNavigationWrite = false;
        hasChanges = true;
      }

      // Save if there are changes
      if (hasChanges) {
        await this.sessionStorage.save(sessionData);
        this.lastFlushTime = Date.now();

        if (this.config.enableLogging) {
          console.log('💾 CategoryMemoryManager: Flushed pending writes', {
            categories: Object.keys(sessionData.progress.categoryMemory).length,
            navigationEntries: sessionData.progress.navigationHistory.length,
            processingTime: Date.now() - startTime,
          });
        }
      }

    } catch (error) {
      console.error('CategoryMemoryManager: Write operation failed:', error);
      
      // Re-schedule write for retry
      setTimeout(() => {
        this.scheduleWrite();
      }, this.config.debounceDelay * 2);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.autoFlushTimer = setInterval(() => {
      if (this.pendingCategoryWrites.size > 0 || this.pendingNavigationWrite) {
        this.flushPendingWrites().catch(error => {
          console.error('CategoryMemoryManager: Auto-flush failed:', error);
        });
      }
    }, this.config.autoFlushInterval);
  }

  /**
   * Ensure the manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Dispose of the manager
   */
  dispose(): void {
    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
      this.writeDebounceTimer = null;
    }

    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer);
      this.autoFlushTimer = null;
    }

    // Flush any pending writes before disposing
    this.flushPendingWrites().catch(error => {
      console.error('CategoryMemoryManager: Final flush failed:', error);
    });
  }
} 