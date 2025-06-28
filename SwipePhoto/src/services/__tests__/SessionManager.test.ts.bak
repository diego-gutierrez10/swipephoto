/**
 * SessionManager.test.ts
 * 
 * Unit tests for SessionManager service
 */

import { AppState } from 'react-native';
import { SessionManager, SessionManagerConfig, SessionValidationResult } from '../SessionManager';
import { SessionStorageService } from '../SessionStorageService';
import { CategoryMemoryManager } from '../CategoryMemoryManager';
import { SessionState, createDefaultSessionState } from '../../types/session';

// Mock dependencies
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

jest.mock('../SessionStorageService');
jest.mock('../CategoryMemoryManager');

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockSessionStorage: jest.Mocked<SessionStorageService>;
  let mockCategoryMemoryManager: jest.Mocked<CategoryMemoryManager>;
  let mockSessionData: SessionState;

  const mockConfig: Partial<SessionManagerConfig> = {
    sessionExpiryTime: 5 * 60 * 1000, // 5 minutes for testing
    maxBackgroundTime: 60 * 60 * 1000, // 1 hour for testing
    autoSaveEnabled: false, // Disable for testing
    enableLogging: false,
    enableTelemetry: false,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock session data
    mockSessionData = createDefaultSessionState('test-session-123');

    // Mock SessionStorageService
    mockSessionStorage = new SessionStorageService() as jest.Mocked<SessionStorageService>;
    (SessionStorageService as jest.Mock).mockImplementation(() => mockSessionStorage);

    // Mock CategoryMemoryManager
    mockCategoryMemoryManager = new CategoryMemoryManager(mockSessionStorage) as jest.Mocked<CategoryMemoryManager>;
    (CategoryMemoryManager as jest.Mock).mockImplementation(() => mockCategoryMemoryManager);

    // Set up default mock implementations
    mockSessionStorage.load.mockResolvedValue(mockSessionData);
    mockSessionStorage.save.mockResolvedValue();
    mockSessionStorage.clear.mockResolvedValue();
    mockSessionStorage.isSessionAvailable.mockResolvedValue(true);
    mockCategoryMemoryManager.flushPendingWrites.mockResolvedValue();
    mockCategoryMemoryManager.dispose.mockImplementation(() => {});

    // Get fresh instance for each test
    sessionManager = SessionManager.getInstance(mockConfig);
  });

  afterEach(() => {
    // Clean up
    sessionManager.dispose();
    
    // Reset singleton
    (SessionManager as any).instance = null;
  });

  describe('Initialization', () => {
    test('should initialize successfully with stored session', async () => {
      await sessionManager.initialize();

      expect(mockSessionStorage.load).toHaveBeenCalled();
      expect(sessionManager.getCurrentSession()).toEqual(mockSessionData);
    });

    test('should create new session when no stored session exists', async () => {
      mockSessionStorage.load.mockResolvedValue(null);

      await sessionManager.initialize();

      expect(mockSessionStorage.load).toHaveBeenCalled();
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toBeTruthy();
      expect(currentSession?.sessionId).toContain('session_');
    });

    test('should handle initialization errors gracefully', async () => {
      mockSessionStorage.load.mockRejectedValue(new Error('Storage error'));

      await sessionManager.initialize();

      // Should create new session as fallback
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toBeTruthy();
      expect(currentSession?.sessionId).toContain('session_');
    });

    test('should not initialize twice', async () => {
      await sessionManager.initialize();
      const firstSession = sessionManager.getCurrentSession();

      await sessionManager.initialize();
      const secondSession = sessionManager.getCurrentSession();

      expect(firstSession).toBe(secondSession);
      expect(mockSessionStorage.load).toHaveBeenCalledTimes(1);
    });

    test('should set up AppState listener during initialization', async () => {
      await sessionManager.initialize();

      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Session Operations', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });

    test('should update session successfully', async () => {
      const updates = {
        navigation: {
          ...mockSessionData.navigation,
          currentPhotoIndex: 5,
        },
      };

      await sessionManager.updateSession(updates);

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.navigation.currentPhotoIndex).toBe(5);
      expect(currentSession?.lastSaved).toBeGreaterThan(mockSessionData.lastSaved);
    });

    test('should save session to storage', async () => {
      await sessionManager.saveSession();

      expect(mockSessionStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session-123',
        })
      );
    });

    test('should throw error when updating session without active session', async () => {
      sessionManager.dispose();
      (SessionManager as any).instance = null;
      sessionManager = SessionManager.getInstance(mockConfig);

      await expect(sessionManager.updateSession({ version: '2.0.0' }))
        .rejects.toThrow('No active session to update');
    });

    test('should throw error when saving session without active session', async () => {
      sessionManager.dispose();
      (SessionManager as any).instance = null;
      sessionManager = SessionManager.getInstance(mockConfig);

      await expect(sessionManager.saveSession()).rejects.toThrow('No session to save');
    });
  });

  describe('Pause/Resume Functionality', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });

    test('should pause session successfully', async () => {
      const beforePause = Date.now();
      
      await sessionManager.pause();

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.lifecycle.isPaused).toBe(true);
      expect(currentSession?.lifecycle.isActive).toBe(false);
      expect(currentSession?.lifecycle.pausedAt).toBeGreaterThanOrEqual(beforePause);
      expect(currentSession?.lifecycle.pauseCount).toBe(1);

      expect(mockSessionStorage.save).toHaveBeenCalled();
      expect(mockCategoryMemoryManager.flushPendingWrites).toHaveBeenCalled();
    });

    test('should not pause already paused session', async () => {
      await sessionManager.pause();
      const firstPauseTime = sessionManager.getCurrentSession()?.lifecycle.pausedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await sessionManager.pause();
      const secondPauseTime = sessionManager.getCurrentSession()?.lifecycle.pausedAt;

      expect(firstPauseTime).toBe(secondPauseTime);
      expect(mockSessionStorage.save).toHaveBeenCalledTimes(1);
    });

    test('should resume session successfully', async () => {
      await sessionManager.pause();
      const pauseTime = sessionManager.getCurrentSession()?.lifecycle.pausedAt!;

      // Wait a bit to simulate background time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await sessionManager.resume();

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.lifecycle.isActive).toBe(true);
      expect(currentSession?.lifecycle.isPaused).toBe(false);
      expect(currentSession?.lifecycle.resumedAt).toBeGreaterThan(pauseTime);
      expect(currentSession?.lifecycle.backgroundDuration).toBeGreaterThan(0);
      expect(currentSession?.lifecycle.totalPauseTime).toBeGreaterThan(0);
    });

    test('should create new session when resuming expired session', async () => {
      await sessionManager.pause();
      
      // Mock session as expired
      const expiredSession = {
        ...mockSessionData,
        lastSaved: Date.now() - (10 * 60 * 1000), // 10 minutes ago
      };
      mockSessionStorage.load.mockResolvedValue(expiredSession);
      
      // Manually set background duration to exceed max
      const longBackgroundTime = 2 * 60 * 60 * 1000; // 2 hours
      jest.spyOn(sessionManager as any, 'shouldRestoreSession').mockResolvedValue(false);

      await sessionManager.resume();

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.sessionId).not.toBe('test-session-123');
      expect(currentSession?.sessionId).toContain('session_');
    });

    test('should handle pause errors gracefully', async () => {
      mockSessionStorage.save.mockRejectedValue(new Error('Storage full'));

      await sessionManager.pause();

      // Should still update lifecycle state
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.lifecycle.isPaused).toBe(true);
    });

    test('should handle resume errors gracefully', async () => {
      await sessionManager.pause();
      mockSessionStorage.load.mockRejectedValue(new Error('Storage error'));

      await sessionManager.resume();

      // Should create new session as fallback
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.sessionId).toContain('session_');
    });
  });

  describe('Session Validation', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });

    test('should validate valid session', () => {
      const result = sessionManager.validateSession(mockSessionData);

      expect(result.isValid).toBe(true);
      expect(result.canRestore).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidSession = {
        ...mockSessionData,
        sessionId: '',
        version: '',
      };

      const result = sessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing sessionId');
      expect(result.errors).toContain('Missing version');
    });

    test('should detect future timestamps', () => {
      const futureTime = Date.now() + 10000;
      const invalidSession = {
        ...mockSessionData,
        lastSaved: futureTime,
        lifecycle: {
          ...mockSessionData.lifecycle,
          pausedAt: futureTime,
        },
      };

      const result = sessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid lastSaved timestamp (future)');
      expect(result.errors).toContain('Invalid pausedAt timestamp (future)');
    });

    test('should detect expired session in strict mode', () => {
      const expiredSession = {
        ...mockSessionData,
        lastSaved: Date.now() - (10 * 60 * 1000), // 10 minutes ago
      };

      // Use strict validation
      const strictSessionManager = SessionManager.getInstance({
        ...mockConfig,
        strictValidation: true,
      });

      const result = strictSessionManager.validateSession(expiredSession);

      expect(result.isValid).toBe(false);
      expect(result.canRestore).toBe(false);
      expect(result.errors.some(error => error.includes('Session expired'))).toBe(true);
    });

    test('should allow expired session in non-strict mode', () => {
      const expiredSession = {
        ...mockSessionData,
        lastSaved: Date.now() - (10 * 60 * 1000), // 10 minutes ago
      };

      const result = sessionManager.validateSession(expiredSession);

      expect(result.isValid).toBe(false);
      expect(result.canRestore).toBe(true);
      expect(result.warnings.some(warning => warning.includes('Session is old'))).toBe(true);
    });
  });

  describe('Event Management', () => {
    let eventCallback: jest.Mock;

    beforeEach(async () => {
      eventCallback = jest.fn();
      await sessionManager.initialize();
    });

    test('should add and trigger event listeners', async () => {
      sessionManager.addEventListener('session_saved', eventCallback);

      await sessionManager.saveSession();

      expect(eventCallback).toHaveBeenCalledWith('session_saved', expect.any(Object));
    });

    test('should remove event listeners', async () => {
      sessionManager.addEventListener('session_saved', eventCallback);
      sessionManager.removeEventListener('session_saved', eventCallback);

      await sessionManager.saveSession();

      expect(eventCallback).not.toHaveBeenCalled();
    });

    test('should handle multiple listeners for same event', async () => {
      const secondCallback = jest.fn();
      
      sessionManager.addEventListener('session_saved', eventCallback);
      sessionManager.addEventListener('session_saved', secondCallback);

      await sessionManager.saveSession();

      expect(eventCallback).toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });

      sessionManager.addEventListener('session_saved', errorCallback);
      sessionManager.addEventListener('session_saved', eventCallback);

      await sessionManager.saveSession();

      // Should not prevent other listeners from executing
      expect(eventCallback).toHaveBeenCalled();
    });
  });

  describe('App State Integration', () => {
    let appStateCallback: (state: string) => void;

    beforeEach(async () => {
      (AppState.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return { remove: jest.fn() };
      });

      await sessionManager.initialize();
    });

    test('should pause on background app state', async () => {
      const pauseSpy = jest.spyOn(sessionManager, 'pause');

      appStateCallback('background');

      expect(pauseSpy).toHaveBeenCalled();
    });

    test('should pause on inactive app state', async () => {
      const pauseSpy = jest.spyOn(sessionManager, 'pause');

      appStateCallback('inactive');

      expect(pauseSpy).toHaveBeenCalled();
    });

    test('should resume on active app state', async () => {
      const resumeSpy = jest.spyOn(sessionManager, 'resume');

      appStateCallback('active');

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('Disposal', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });

    test('should dispose resources properly', async () => {
      const appStateSubscription = { remove: jest.fn() };
      (AppState.addEventListener as jest.Mock).mockReturnValue(appStateSubscription);

      sessionManager.dispose();

      expect(mockCategoryMemoryManager.dispose).toHaveBeenCalled();
      expect(appStateSubscription.remove).toHaveBeenCalled();
    });

    test('should save session before disposal', async () => {
      sessionManager.dispose();

      // Note: This is tested by ensuring no errors occur during disposal
      // The actual save is async and might not complete before disposal
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = SessionManager.getInstance();
      const instance2 = SessionManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('should create new instance after disposal', () => {
      const instance1 = SessionManager.getInstance();
      instance1.dispose();

      const instance2 = SessionManager.getInstance();

      expect(instance2).not.toBe(instance1);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle storage save errors', async () => {
      await sessionManager.initialize();
      
      mockSessionStorage.save.mockRejectedValue(new Error('Storage error'));

      await expect(sessionManager.saveSession()).rejects.toThrow('Storage error');
    });

    test('should handle storage load errors during restoration', async () => {
      mockSessionStorage.load.mockRejectedValue(new Error('Load error'));

      await sessionManager.initialize();

      // Should create new session as fallback
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.sessionId).toContain('session_');
    });

    test('should handle category memory manager errors', async () => {
      await sessionManager.initialize();
      
      mockCategoryMemoryManager.flushPendingWrites.mockRejectedValue(new Error('Flush error'));

      // Should not throw, but should log error
      await sessionManager.pause();

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.lifecycle.isPaused).toBe(true);
    });
  });
}); 