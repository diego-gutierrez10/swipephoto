/**
 * SessionStorageService.test.ts
 * 
 * Unit tests for SessionStorageService
 * Tests storage operations, error handling, encryption, backup, and performance.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SessionStorageService, SessionStorageError } from '../SessionStorageService';
import { 
  SessionState, 
  SessionStorageConfig, 
  createDefaultSessionState,
  DEFAULT_SESSION_CONFIG,
} from '../../types/session';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('SessionStorageService', () => {
  let service: SessionStorageService;
  let mockSessionState: SessionState;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service with test config
    const testConfig: Partial<SessionStorageConfig> = {
      enableEncryption: false, // Disable encryption for easier testing
      enableBackup: false, // Disable backup for basic tests
      throttleDelay: 100,
    };
    
    service = new SessionStorageService(testConfig);
    
    // Create mock session state
    mockSessionState = createDefaultSessionState('test-session-123');
    mockSessionState.navigation.currentScreen = 'TestScreen';
    mockSessionState.progress.photosProcessed = 10;
  });

  afterEach(() => {
    service.dispose();
  });

  describe('Basic Storage Operations', () => {
    test('should save session state successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      
      await service.save(mockSessionState);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_SESSION_CONFIG.sessionKey,
        expect.any(String)
      );
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_SESSION_CONFIG.metadataKey,
        expect.any(String)
      );
    });

    test('should load session state successfully', async () => {
      const serializedState = JSON.stringify(mockSessionState);
      const metadata = {
        version: mockSessionState.version,
        sessionId: mockSessionState.sessionId,
        lastSaved: mockSessionState.lastSaved,
        compressed: false,
        encrypted: false,
      };
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(serializedState) // Session data
        .mockResolvedValueOnce(JSON.stringify(metadata)); // Metadata
      
      const result = await service.load();
      
      expect(result).toBeDefined();
      expect(result?.sessionId).toBe(mockSessionState.sessionId);
      expect(result?.navigation.currentScreen).toBe('TestScreen');
      expect(result?.progress.photosProcessed).toBe(10);
    });

    test('should return null when no session exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await service.load();
      
      expect(result).toBeNull();
    });

    test('should clear all session data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();
      
      await service.clear();
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        DEFAULT_SESSION_CONFIG.sessionKey
      );
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        DEFAULT_SESSION_CONFIG.metadataKey
      );
    });
  });

  describe('Session Validation', () => {
    test('should validate session exists correctly', async () => {
      const metadata = {
        version: '1.0.0',
        sessionId: 'test-session',
        lastSaved: Date.now() - 1000, // 1 second ago
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));
      
      const exists = await service.isSessionAvailable();
      
      expect(exists).toBe(true);
    });

    test('should return false for old session', async () => {
      const metadata = {
        version: '1.0.0',
        sessionId: 'test-session',
        lastSaved: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));
      
      const exists = await service.isSessionAvailable();
      
      expect(exists).toBe(false);
    });

    test('should return false when no metadata exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const exists = await service.isSessionAvailable();
      
      expect(exists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle save errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));
      
      await expect(service.save(mockSessionState)).rejects.toThrow('Storage full');
    });

    test('should handle load errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await service.load();
      
      expect(result).toBeNull();
    });

    test('should handle corrupted session data', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('invalid json') // Corrupted session data
        .mockResolvedValueOnce(null); // No metadata
      
      const result = await service.load();
      
      expect(result).toBeNull();
    });

    test('should handle quota exceeded error', async () => {
      const largeState = {
        ...mockSessionState,
        largeData: 'x'.repeat(10 * 1024 * 1024), // 10MB string
      };
      
      await expect(service.save(largeState as any)).rejects.toThrow(
        expect.stringContaining(SessionStorageError.QUOTA_EXCEEDED)
      );
    });
  });

  describe('Storage Statistics', () => {
    test('should return correct storage stats', async () => {
      const testData = 'test data';
      mockAsyncStorage.getItem.mockResolvedValue(testData);
      
      const stats = await service.getStorageStats();
      
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('sessionSize');
      expect(stats).toHaveProperty('availableSpace');
      expect(stats.sessionSize).toBe(testData.length);
    });

    test('should check storage space availability', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('small data');
      
      const hasSpace = await service.hasStorageSpace();
      
      expect(hasSpace).toBe(true);
    });
  });

  describe('Event System', () => {
    test('should emit session saved event', async () => {
      const eventCallback = jest.fn();
      service.addEventListener(eventCallback);
      
      mockAsyncStorage.setItem.mockResolvedValue();
      
      await service.save(mockSessionState);
      
      expect(eventCallback).toHaveBeenCalledWith(
        'session_saved',
        expect.objectContaining({
          sessionId: mockSessionState.sessionId,
        })
      );
    });

    test('should emit session loaded event', async () => {
      const eventCallback = jest.fn();
      service.addEventListener(eventCallback);
      
      const serializedState = JSON.stringify(mockSessionState);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(serializedState)
        .mockResolvedValueOnce(null);
      
      await service.load();
      
      expect(eventCallback).toHaveBeenCalledWith(
        'session_loaded',
        expect.objectContaining({
          sessionId: mockSessionState.sessionId,
        })
      );
    });

    test('should remove event listener correctly', async () => {
      const eventCallback = jest.fn();
      const removeListener = service.addEventListener(eventCallback);
      
      // Remove listener
      removeListener();
      
      mockAsyncStorage.setItem.mockResolvedValue();
      await service.save(mockSessionState);
      
      expect(eventCallback).not.toHaveBeenCalled();
    });
  });

  describe('Throttled Save', () => {
    test('should throttle save operations', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      
      // Call throttled save multiple times quickly
      service.saveThrottled(mockSessionState);
      service.saveThrottled(mockSessionState);
      service.saveThrottled(mockSessionState);
      
      // Wait for throttle delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should only save once due to throttling
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // 1 for session + 1 for metadata
    });
  });

  describe('Metadata Operations', () => {
    test('should get metadata without loading full state', async () => {
      const metadata = {
        version: '1.0.0',
        sessionId: 'test-session',
        lastSaved: Date.now(),
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));
      
      const result = await service.getMetadata();
      
      expect(result).toEqual({
        version: metadata.version,
        sessionId: metadata.sessionId,
        lastSaved: metadata.lastSaved,
        compressed: undefined, // Since we're testing the extended type
      });
    });

    test('should return null when no metadata exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await service.getMetadata();
      
      expect(result).toBeNull();
    });
  });
});

describe('SessionStorageService with Encryption', () => {
  let service: SessionStorageService;
  let mockSessionState: SessionState;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service with encryption enabled
    const testConfig: Partial<SessionStorageConfig> = {
      enableEncryption: true,
      enableBackup: false,
    };
    
    service = new SessionStorageService(testConfig);
    mockSessionState = createDefaultSessionState('encrypted-session-123');
  });

  afterEach(() => {
    service.dispose();
  });

  test('should use SecureStore when encryption is enabled', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockAsyncStorage.setItem.mockResolvedValue(); // For metadata
    
    await service.save(mockSessionState);
    
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      DEFAULT_SESSION_CONFIG.sessionKey,
      expect.any(String)
    );
  });

  test('should fallback to AsyncStorage when SecureStore fails', async () => {
    mockSecureStore.getItemAsync.mockRejectedValue(new Error('SecureStore error'));
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSessionState));
    
    const result = await service.load();
    
    expect(mockSecureStore.getItemAsync).toHaveBeenCalled();
    expect(mockAsyncStorage.getItem).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe('SessionStorageService with Backup', () => {
  let service: SessionStorageService;
  let mockSessionState: SessionState;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service with backup enabled
    const testConfig: Partial<SessionStorageConfig> = {
      enableBackup: true,
      maxBackups: 2,
    };
    
    service = new SessionStorageService(testConfig);
    mockSessionState = createDefaultSessionState('backup-session-123');
  });

  afterEach(() => {
    service.dispose();
  });

  test('should create backup when saving', async () => {
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.getItem.mockResolvedValue(null); // No existing backups
    
    await service.save(mockSessionState);
    
    // Should save session, metadata, and backup
    expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(3);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      `${DEFAULT_SESSION_CONFIG.backupKey}_0`,
      expect.any(String)
    );
  });

  test('should attempt recovery from backup when load fails', async () => {
    const backupData = JSON.stringify({
      ...mockSessionState,
      backupTimestamp: Date.now(),
    });
    
    mockAsyncStorage.getItem
      .mockResolvedValueOnce(null) // No main session
      .mockResolvedValueOnce(null) // No metadata  
      .mockResolvedValueOnce(backupData); // Has backup
    
    const result = await service.load();
    
    expect(result).toBeDefined();
    expect(result?.sessionId).toBe(mockSessionState.sessionId);
  });
}); 