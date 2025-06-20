/**
 * CategoryMemoryManager.test.ts
 * 
 * Unit tests for CategoryMemoryManager service
 */

import { CategoryMemoryManager, CategoryProgress, NavigationStateUpdate } from '../CategoryMemoryManager';
import { SessionStorageService } from '../SessionStorageService';
import { SessionState } from '../../types/session';

// Mock SessionStorageService
jest.mock('../SessionStorageService');

describe('CategoryMemoryManager', () => {
  let categoryMemoryManager: CategoryMemoryManager;
  let mockSessionStorage: jest.Mocked<SessionStorageService>;
  let mockSessionData: SessionState;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock session data
    mockSessionData = {
      sessionId: 'test-session',
      version: '1.0.0',
      lastSaved: Date.now(),
      appVersion: '1.0.0',
      navigation: {
        currentScreen: 'Home',
        currentPhotoIndex: 0,
        selectedCategoryId: null,
        selectedCategoryType: null,
        scrollPosition: 0,
      },
      progress: {
        sessionId: 'test-session',
        sessionStartTime: Date.now(),
        categoriesCompleted: [],
        photosProcessed: 0,
        totalPhotos: 100,
        currentCategoryProgress: null,
        lastActivityTime: Date.now(),
        categoryMemory: {},
        navigationHistory: [],
        maxHistoryEntries: 50,
      },
      userPreferences: {
        theme: 'light',
        hapticFeedbackEnabled: true,
        soundEnabled: true,
        autoSaveEnabled: true,
        swipeThreshold: 100,
        animationSpeed: 'normal',
        lastUsedFilters: {
          dateRange: undefined,
          sources: [],
          minPhotos: undefined,
          sortBy: 'date',
          sortOrder: 'asc',
        },
      },
      undoState: {
        undoStack: [],
        maxUndoActions: 50,
        lastUndoTimestamp: undefined,
      },
      metadata: {
        totalSessions: 1,
        lastSessionDuration: 0,
        crashRecoveryAttempts: 0,
        lastCrashTime: undefined,
      },
    };

    // Create mock SessionStorageService
    mockSessionStorage = new SessionStorageService() as jest.Mocked<SessionStorageService>;
    mockSessionStorage.load.mockResolvedValue(mockSessionData);
    mockSessionStorage.save.mockResolvedValue();

    // Create CategoryMemoryManager with test config
    categoryMemoryManager = new CategoryMemoryManager(mockSessionStorage, {
      debounceDelay: 50, // Short delay for tests
      maxHistoryEntries: 10,
      enableCaching: true,
      autoFlushInterval: 0, // Disable auto-flush for tests
      enableLogging: false,
    });
  });

  afterEach(() => {
    categoryMemoryManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with empty state when no session data exists', async () => {
      mockSessionStorage.load.mockResolvedValue(null);
      
      const manager = new CategoryMemoryManager(mockSessionStorage);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = manager.getCacheStats();
      expect(stats.cachedCategories).toBe(0);
    });

    it('should load existing category memory from session data', async () => {
      const existingMemory = {
        'category1': {
          lastPhotoId: 'photo1',
          lastPhotoIndex: 5,
          totalPhotos: 20,
          completedPhotos: 10,
          lastAccessTime: Date.now(),
          categoryType: 'month' as const,
        },
      };

      mockSessionData.progress.categoryMemory = existingMemory;
      mockSessionStorage.load.mockResolvedValue(mockSessionData);

      const manager = new CategoryMemoryManager(mockSessionStorage);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const progress = await manager.getCategoryProgress('category1');
      expect(progress).toEqual(existingMemory.category1);
    });

    it('should handle initialization errors gracefully', async () => {
      mockSessionStorage.load.mockRejectedValue(new Error('Storage error'));
      
      const manager = new CategoryMemoryManager(mockSessionStorage);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should still be functional with empty state
      const stats = manager.getCacheStats();
      expect(stats.cachedCategories).toBe(0);
    });
  });

  describe('Category Progress Management', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should update category progress correctly', async () => {
      const categoryId = 'test-category';
      const progress: Partial<CategoryProgress> = {
        lastPhotoId: 'photo123',
        lastPhotoIndex: 15,
        totalPhotos: 100,
        completedPhotos: 20,
        categoryType: 'month',
      };

      await categoryMemoryManager.updateCategoryProgress(categoryId, progress);

      const retrievedProgress = await categoryMemoryManager.getCategoryProgress(categoryId);
      expect(retrievedProgress).toMatchObject(progress);
      expect(retrievedProgress?.lastAccessTime).toBeDefined();
    });

    it('should merge progress updates with existing data', async () => {
      const categoryId = 'test-category';
      
      // First update
      await categoryMemoryManager.updateCategoryProgress(categoryId, {
        lastPhotoId: 'photo1',
        totalPhotos: 100,
        categoryType: 'month',
      });

      // Second update (partial)
      await categoryMemoryManager.updateCategoryProgress(categoryId, {
        lastPhotoIndex: 10,
        completedPhotos: 15,
      });

      const progress = await categoryMemoryManager.getCategoryProgress(categoryId);
      expect(progress).toMatchObject({
        lastPhotoId: 'photo1',
        lastPhotoIndex: 10,
        totalPhotos: 100,
        completedPhotos: 15,
        categoryType: 'month',
      });
    });

    it('should return null for non-existent category', async () => {
      const progress = await categoryMemoryManager.getCategoryProgress('non-existent');
      expect(progress).toBeNull();
    });

    it('should reset specific category progress', async () => {
      const categoryId = 'test-category';
      
      // Add progress
      await categoryMemoryManager.updateCategoryProgress(categoryId, {
        lastPhotoId: 'photo1',
        totalPhotos: 100,
        categoryType: 'month',
      });

      // Reset
      await categoryMemoryManager.resetCategoryProgress(categoryId);

      const progress = await categoryMemoryManager.getCategoryProgress(categoryId);
      expect(progress).toBeNull();
    });

    it('should reset all category progress', async () => {
      // Add multiple categories
      await categoryMemoryManager.updateCategoryProgress('cat1', {
        lastPhotoId: 'photo1',
        categoryType: 'month',
      });
      await categoryMemoryManager.updateCategoryProgress('cat2', {
        lastPhotoId: 'photo2',
        categoryType: 'source',
      });

      // Reset all
      await categoryMemoryManager.resetCategoryProgress();

      const allProgress = await categoryMemoryManager.getAllCategoryProgress();
      expect(Object.keys(allProgress)).toHaveLength(0);
    });

    it('should get all category progress', async () => {
      const categories = {
        'cat1': { lastPhotoId: 'photo1', categoryType: 'month' as const },
        'cat2': { lastPhotoId: 'photo2', categoryType: 'source' as const },
      };

      for (const [id, progress] of Object.entries(categories)) {
        await categoryMemoryManager.updateCategoryProgress(id, progress);
      }

      const allProgress = await categoryMemoryManager.getAllCategoryProgress();
      expect(Object.keys(allProgress)).toHaveLength(2);
      expect(allProgress.cat1.lastPhotoId).toBe('photo1');
      expect(allProgress.cat2.lastPhotoId).toBe('photo2');
    });
  });

  describe('Navigation State Management', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should update navigation state correctly', async () => {
      const navigationUpdate: NavigationStateUpdate = {
        routeName: 'PhotoViewer',
        params: { categoryId: 'test', photoId: 'photo1' },
      };

      await categoryMemoryManager.updateNavigationState(navigationUpdate);

      const history = await categoryMemoryManager.getNavigationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        routeName: 'PhotoViewer',
        params: { categoryId: 'test', photoId: 'photo1' },
      });
      expect(history[0].timestamp).toBeDefined();
    });

    it('should maintain navigation history order (newest first)', async () => {
      const updates = [
        { routeName: 'Home', params: {} },
        { routeName: 'CategoryList', params: {} },
        { routeName: 'PhotoViewer', params: { photoId: 'photo1' } },
      ];

      for (const update of updates) {
        await categoryMemoryManager.updateNavigationState(update);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const history = await categoryMemoryManager.getNavigationHistory();
      expect(history).toHaveLength(3);
      expect(history[0].routeName).toBe('PhotoViewer');
      expect(history[1].routeName).toBe('CategoryList');
      expect(history[2].routeName).toBe('Home');
    });

    it('should limit navigation history to max entries', async () => {
      // Add more entries than the limit (10 in test config)
      for (let i = 0; i < 15; i++) {
        await categoryMemoryManager.updateNavigationState({
          routeName: `Route${i}`,
          params: { index: i },
        });
      }

      const history = await categoryMemoryManager.getNavigationHistory();
      expect(history).toHaveLength(10);
      expect(history[0].routeName).toBe('Route14'); // Most recent
      expect(history[9].routeName).toBe('Route5'); // Oldest kept
    });

    it('should clear navigation history', async () => {
      // Add some history
      await categoryMemoryManager.updateNavigationState({
        routeName: 'TestRoute',
        params: {},
      });

      // Clear
      await categoryMemoryManager.clearNavigationHistory();

      const history = await categoryMemoryManager.getNavigationHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Debouncing and Persistence', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should debounce writes to storage', async () => {
      // Make multiple rapid updates
      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });
      await categoryMemoryManager.updateCategoryProgress('cat2', { lastPhotoId: 'photo2', categoryType: 'month' });
      await categoryMemoryManager.updateNavigationState({ routeName: 'Test', params: {} });

      // Should not have written to storage yet due to debouncing
      expect(mockSessionStorage.save).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have written once
      expect(mockSessionStorage.save).toHaveBeenCalledTimes(1);
    });

    it('should flush pending writes immediately when requested', async () => {
      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });

      // Flush immediately
      await categoryMemoryManager.flushPendingWrites();

      expect(mockSessionStorage.save).toHaveBeenCalledTimes(1);
    });

    it('should handle storage errors during write', async () => {
      mockSessionStorage.save.mockRejectedValue(new Error('Storage error'));

      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });

      // Should not throw error
      await expect(categoryMemoryManager.flushPendingWrites()).resolves.not.toThrow();
    });

    it('should retry writes after storage errors', async () => {
      mockSessionStorage.save
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce();

      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });

      // First write should fail
      await categoryMemoryManager.flushPendingWrites();
      expect(mockSessionStorage.save).toHaveBeenCalledTimes(1);

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have retried
      expect(mockSessionStorage.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should provide accurate cache statistics', async () => {
      const initialStats = categoryMemoryManager.getCacheStats();
      expect(initialStats.cachedCategories).toBe(0);
      expect(initialStats.pendingWrites).toBe(0);

      // Add some categories
      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });
      await categoryMemoryManager.updateCategoryProgress('cat2', { lastPhotoId: 'photo2', categoryType: 'month' });

      const updatedStats = categoryMemoryManager.getCacheStats();
      expect(updatedStats.cachedCategories).toBe(2);
      expect(updatedStats.pendingWrites).toBe(2);

      // Flush writes
      await categoryMemoryManager.flushPendingWrites();

      const flushedStats = categoryMemoryManager.getCacheStats();
      expect(flushedStats.cachedCategories).toBe(2);
      expect(flushedStats.pendingWrites).toBe(0);
      expect(flushedStats.lastFlushTime).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty category IDs gracefully', async () => {
      const progress = await categoryMemoryManager.getCategoryProgress('');
      expect(progress).toBeNull();
    });

    it('should handle malformed session data', async () => {
      mockSessionStorage.load.mockResolvedValue({
        ...mockSessionData,
        progress: {
          ...mockSessionData.progress,
          categoryMemory: null as any, // Invalid data
        },
      });

      const manager = new CategoryMemoryManager(mockSessionStorage);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should handle gracefully
      const progress = await manager.getCategoryProgress('test');
      expect(progress).toBeNull();
    });

    it('should dispose resources properly', async () => {
      await categoryMemoryManager.updateCategoryProgress('cat1', { lastPhotoId: 'photo1', categoryType: 'month' });

      categoryMemoryManager.dispose();

      // Should flush pending writes during disposal
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockSessionStorage.save).toHaveBeenCalled();
    });
  });
}); 