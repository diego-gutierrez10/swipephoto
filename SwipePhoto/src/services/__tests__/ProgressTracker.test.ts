/**
 * ProgressTracker.test.ts
 * 
 * Comprehensive tests for ProgressTracker service covering:
 * - Auto-save functionality
 * - Background saving during app state changes
 * - Recovery from interrupted sessions
 * - Priority-based saving
 * - Error handling and retry mechanisms
 */

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressTracker, ProgressTrackerConfig } from '../ProgressTracker';
import { SessionManager } from '../SessionManager';

// Mock dependencies
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

jest.mock('../SessionManager', () => ({
  SessionManager: {
    getInstance: jest.fn().mockReturnValue({
      saveSession: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock timers
jest.useFakeTimers();

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let mockSessionManager: any;
  let mockAppStateListener: any;

  const defaultConfig: Partial<ProgressTrackerConfig> = {
    autoSaveInterval: 1000, // 1 second for testing
    backgroundSaveTimeout: 5000,
    maxRetryAttempts: 2,
    criticalSaveDelay: 100,
    batchSize: 3,
    enableLogging: false,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Mock AsyncStorage
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

    // Mock SessionManager
    mockSessionManager = {
      saveSession: jest.fn().mockResolvedValue(undefined),
    };
    (SessionManager.getInstance as jest.Mock).mockReturnValue(mockSessionManager);

    // Mock AppState listener
    mockAppStateListener = jest.fn();
    (AppState.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'change') {
        mockAppStateListener = callback;
      }
      return { remove: jest.fn() };
    });

    // Reset singleton
    ProgressTracker.resetInstance();
    
    // Create fresh instance
    progressTracker = ProgressTracker.getInstance(defaultConfig);
  });

  afterEach(async () => {
    if (progressTracker) {
      progressTracker.dispose();
    }
    ProgressTracker.resetInstance();
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should initialize successfully with default config', async () => {
      await progressTracker.initialize();
      
      const stats = progressTracker.getTrackingStats();
      expect(stats.isTracking).toBe(true);
      expect(stats.pendingChanges).toBe(0);
    });

    test('should initialize with custom session manager', async () => {
      await progressTracker.initialize(mockSessionManager);
      
      const stats = progressTracker.getTrackingStats();
      expect(stats.isTracking).toBe(true);
    });

    test('should attempt recovery during initialization', async () => {
      // Mock backup data
      const backupData = {
        data: { 'photo_1': { processed: true }, 'category_A': { count: 5 } },
        metadata: { timestamp: Date.now(), changeCount: 2 }
      };
      
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@SwipePhoto_progress_backup_1640000000000',
        '@SwipePhoto_progress_backup_1640000001000'
      ]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(backupData));

      await progressTracker.initialize();

      // Should have recovered the backup data
      const stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(2); // Should have 2 recovered items
    });

    test('should handle recovery failure gracefully', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(progressTracker.initialize()).resolves.not.toThrow();
      
      const stats = progressTracker.getTrackingStats();
      expect(stats.isTracking).toBe(true);
    });
  });

  describe('Change Tracking', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should track normal priority changes', () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      progressTracker.trackChange('category_A', { count: 5 }, 'normal');

      const stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(2);
    });

    test('should track critical priority changes and trigger immediate save', async () => {
      const saveSpy = jest.spyOn(progressTracker, 'saveProgress');

      progressTracker.trackChange('critical_data', { important: true }, 'critical');

      // Fast-forward timer to trigger critical save
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Allow promises to resolve

      expect(saveSpy).toHaveBeenCalled();
    });

    test('should overwrite changes with same key', () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      progressTracker.trackChange('photo_1', { processed: false }, 'normal');

      const stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(1); // Only one change for photo_1
    });

    test('should not track changes when tracking is disabled', () => {
      progressTracker.dispose();

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');

      const stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(0);
    });
  });

  describe('Auto-Save Functionality', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should auto-save on interval', async () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      progressTracker.trackChange('photo_2', { processed: true }, 'normal');

      // Fast-forward timer to trigger auto-save
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      const stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(0); // Changes should be cleared after save
    });

    test('should not save when no changes are pending', async () => {
      // Fast-forward timer
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    test('should force save even with no changes', async () => {
      await progressTracker.saveProgress(true);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should batch changes when saving', async () => {
      // Add more changes than batchSize (3)
      progressTracker.trackChange('item_1', { data: 1 }, 'normal');
      progressTracker.trackChange('item_2', { data: 2 }, 'normal');
      progressTracker.trackChange('item_3', { data: 3 }, 'normal');
      progressTracker.trackChange('item_4', { data: 4 }, 'normal');
      progressTracker.trackChange('item_5', { data: 5 }, 'normal');

      await progressTracker.saveProgress();

      // Should call setItem multiple times for batches
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2); // 2 batches: 3 + 2 items
    });
  });

  describe('Priority-Based Saving', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should save critical changes first', async () => {
      progressTracker.trackChange('normal_1', { data: 1 }, 'normal');
      progressTracker.trackChange('critical_1', { data: 2 }, 'critical');
      progressTracker.trackChange('low_1', { data: 3 }, 'low');
      progressTracker.trackChange('normal_2', { data: 4 }, 'normal');

      await progressTracker.saveProgress();

      // Verify AsyncStorage.setItem calls contain data in priority order
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // First call should contain critical data
      const firstBatch = JSON.parse(calls[0][1]);
      expect(firstBatch.data).toHaveProperty('critical_1');
    });

    test('should sort by timestamp within same priority', async () => {
      const now = Date.now();
      
      // Add changes with different timestamps
      progressTracker.trackChange('normal_1', { timestamp: now }, 'normal');
      
      // Advance time slightly
      jest.advanceTimersByTime(10);
      
      progressTracker.trackChange('normal_2', { timestamp: now + 10 }, 'normal');

      await progressTracker.saveProgress();

      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const savedData = JSON.parse(calls[0][1]);
      
      // Should save in order (older first)
      const keys = Object.keys(savedData.data);
      expect(keys).toEqual(['normal_1', 'normal_2']);
    });
  });

  describe('Background App State Handling', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should trigger background save when app goes to background', async () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      // Simulate app going to background
      await mockAppStateListener('background');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      const stats = progressTracker.getTrackingStats();
      expect(stats.backgroundTaskActive).toBe(false); // Task should complete
    });

    test('should trigger background save when app becomes inactive', async () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      // Simulate app becoming inactive
      await mockAppStateListener('inactive');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should resume auto-save when returning to active', async () => {
      // Simulate app returning to active
      await mockAppStateListener('active');

      // Should restart auto-save timer
      const stats = progressTracker.getTrackingStats();
      expect(stats.isTracking).toBe(true);
    });

    test('should handle background save timeout', async () => {
      // Mock a slow save operation
      (AsyncStorage.setItem as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      // Simulate app going to background
      const backgroundPromise = mockAppStateListener('background');
      
      // Fast-forward past timeout
      jest.advanceTimersByTime(5000);
      
      await expect(backgroundPromise).resolves.not.toThrow();
    });

    test('should save session manager data during background transition', async () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      // Simulate app going to background
      await mockAppStateListener('background');

      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should handle save failures with retry mechanism', async () => {
      let callCount = 0;
      (AsyncStorage.setItem as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Storage full'));
        }
        return Promise.resolve();
      });

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      await progressTracker.saveProgress();
      
      // Fast-forward to trigger retries
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should emit error events on save failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const errorListener = jest.fn();
      progressTracker.addEventListener('auto_save_failed', errorListener);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      await progressTracker.saveProgress();

      expect(errorListener).toHaveBeenCalledWith('auto_save_failed', expect.objectContaining({
        error: expect.any(String)
      }));
    });

    test('should re-queue failed changes for retry', async () => {
      (AsyncStorage.setItem as jest.Mock)
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce(undefined);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      await progressTracker.saveProgress();
      
      // Changes should still be in buffer after failure
      let stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBeGreaterThan(0);

      // Fast-forward to trigger retry
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      // Changes should be saved on retry
      stats = progressTracker.getTrackingStats();
      expect(stats.pendingChanges).toBe(0);
    });

    test('should give up after max retry attempts', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      await progressTracker.saveProgress();
      
      // Fast-forward through all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(Math.pow(2, i) * 1000);
        await Promise.resolve();
      }

      // Should not exceed max retry attempts
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should emit progress_tracked events', () => {
      const listener = jest.fn();
      progressTracker.addEventListener('progress_tracked', listener);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');

      expect(listener).toHaveBeenCalledWith('progress_tracked', expect.objectContaining({
        change: expect.objectContaining({
          key: 'photo_1',
          priority: 'normal'
        })
      }));
    });

    test('should emit auto_save events', async () => {
      const startListener = jest.fn();
      const completedListener = jest.fn();
      
      progressTracker.addEventListener('auto_save_started', startListener);
      progressTracker.addEventListener('auto_save_completed', completedListener);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      await progressTracker.saveProgress();

      expect(startListener).toHaveBeenCalled();
      expect(completedListener).toHaveBeenCalled();
    });

    test('should emit background save events', async () => {
      const startListener = jest.fn();
      const completedListener = jest.fn();
      
      progressTracker.addEventListener('background_save_started', startListener);
      progressTracker.addEventListener('background_save_completed', completedListener);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      await mockAppStateListener('background');

      expect(startListener).toHaveBeenCalled();
      expect(completedListener).toHaveBeenCalled();
    });

    test('should emit critical save events', async () => {
      const listener = jest.fn();
      progressTracker.addEventListener('critical_save_triggered', listener);

      progressTracker.trackChange('critical_data', { important: true }, 'critical');
      
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(listener).toHaveBeenCalled();
    });

    test('should remove event listeners', () => {
      const listener = jest.fn();
      progressTracker.addEventListener('progress_tracked', listener);

      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      expect(listener).toHaveBeenCalledTimes(1);

      progressTracker.removeEventListener('progress_tracked', listener);
      
      progressTracker.trackChange('photo_2', { processed: true }, 'normal');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Backup Cleanup', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should clean up old backup files', async () => {
      const oldBackups = [
        '@SwipePhoto_progress_backup_1640000000000',
        '@SwipePhoto_progress_backup_1640000001000',
        '@SwipePhoto_progress_backup_1640000002000',
        '@SwipePhoto_progress_backup_1640000003000',
        '@SwipePhoto_progress_backup_1640000004000',
        '@SwipePhoto_progress_backup_1640000005000',
        '@SwipePhoto_progress_backup_1640000006000', // Most recent
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(oldBackups);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        data: { test: 'data' },
        metadata: { timestamp: Date.now(), changeCount: 1 }
      }));

      // Reset and re-initialize to trigger recovery
      ProgressTracker.resetInstance();
      progressTracker = ProgressTracker.getInstance(defaultConfig);
      await progressTracker.initialize();

      // Should remove old backups (keep only 5 most recent)
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@SwipePhoto_progress_backup_1640000000000');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@SwipePhoto_progress_backup_1640000001000');
    });
  });

  describe('Disposal and Cleanup', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should dispose cleanly', () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      progressTracker.dispose();

      const stats = progressTracker.getTrackingStats();
      expect(stats.isTracking).toBe(false);
      expect(stats.pendingChanges).toBe(0);
    });

    test('should remove app state listener on disposal', () => {
      const mockRemove = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

      // Re-initialize to set up listener
      ProgressTracker.resetInstance();
      progressTracker = ProgressTracker.getInstance(defaultConfig);
      progressTracker.initialize();

      progressTracker.dispose();

      expect(mockRemove).toHaveBeenCalled();
    });

    test('should clear all timers on disposal', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      progressTracker.trackChange('critical_data', { important: true }, 'critical');
      progressTracker.dispose();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await progressTracker.initialize();
    });

    test('should return accurate tracking statistics', () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      progressTracker.trackChange('photo_2', { processed: true }, 'normal');

      const stats = progressTracker.getTrackingStats();
      
      expect(stats.isTracking).toBe(true);
      expect(stats.pendingChanges).toBe(2);
      expect(stats.lastSaveTime).toBeGreaterThan(0);
      expect(stats.currentAppState).toBe('active');
      expect(stats.backgroundTaskActive).toBe(false);
    });

    test('should update stats after save operations', async () => {
      progressTracker.trackChange('photo_1', { processed: true }, 'normal');
      
      const statsBefore = progressTracker.getTrackingStats();
      expect(statsBefore.pendingChanges).toBe(1);

      await progressTracker.saveProgress();

      const statsAfter = progressTracker.getTrackingStats();
      expect(statsAfter.pendingChanges).toBe(0);
      expect(statsAfter.lastSaveTime).toBeGreaterThan(statsBefore.lastSaveTime);
    });
  });
}); 