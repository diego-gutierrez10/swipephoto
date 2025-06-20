/**
 * SessionStorageService.ts
 * 
 * Main implementation of session persistence with encryption, compression, 
 * and versioning support using AsyncStorage and expo-secure-store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  SessionState,
  ISessionStorageInterface,
  SessionStorageConfig,
  DEFAULT_SESSION_CONFIG,
  SessionEvent,
  SessionEventCallback,
  createDefaultSessionState,
} from '../types/session';

/**
 * Error types for session storage operations
 */
export enum SessionStorageError {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SERIALIZATION_FAILED = 'SERIALIZATION_FAILED',
  DATA_CORRUPTED = 'DATA_CORRUPTED',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
}

/**
 * Session storage service implementation
 */
export class SessionStorageService implements ISessionStorageInterface {
  private config: SessionStorageConfig;
  private eventListeners: SessionEventCallback[] = [];
  private saveThrottle: NodeJS.Timeout | null = null;
  private lastSaveTime = 0;

  constructor(config: Partial<SessionStorageConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.initializeStorage();
  }

  /**
   * Initialize storage and perform checks
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Check if AsyncStorage is available
      await AsyncStorage.getItem('__test__');
      
      // Check if SecureStore is available (not available in web)
      if (this.config.enableEncryption && Platform.OS !== 'web') {
        await SecureStore.getItemAsync('__test__');
      }
      
      if (__DEV__) {
        console.log('📦 SessionStorageService: Storage initialized successfully');
      }
    } catch (error) {
      console.error('SessionStorageService: Storage initialization failed:', error);
      this.emitEvent('storage_error', { error, context: 'initialization' });
    }
  }

  /**
   * Save session state to storage
   */
  async save(sessionState: SessionState): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update timestamp
      const stateToSave: SessionState = {
        ...sessionState,
        lastSaved: startTime,
      };

      // Serialize state
      const serializedState = JSON.stringify(stateToSave);
      
      // Check storage size limits
      if (serializedState.length > this.config.maxStorageSize) {
        throw new Error(`${SessionStorageError.QUOTA_EXCEEDED}: Session state exceeds max size`);
      }

      // Compress if enabled
      let dataToStore = serializedState;
      if (this.config.compressionEnabled) {
        dataToStore = await this.compressData(serializedState);
      }

      // Encrypt and store
      if (this.config.enableEncryption && Platform.OS !== 'web') {
        await SecureStore.setItemAsync(this.config.sessionKey, dataToStore);
      } else {
        await AsyncStorage.setItem(this.config.sessionKey, dataToStore);
      }

      // Save metadata separately for quick access
      const metadata = {
        version: stateToSave.version,
        sessionId: stateToSave.sessionId,
        lastSaved: stateToSave.lastSaved,
        appVersion: stateToSave.appVersion,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.enableEncryption && Platform.OS !== 'web',
      };
      
      await AsyncStorage.setItem(
        this.config.metadataKey, 
        JSON.stringify(metadata)
      );

      // Create backup if enabled
      if (this.config.enableBackup) {
        await this.createBackup(stateToSave);
      }

      this.lastSaveTime = startTime;
      this.emitEvent('session_saved', { 
        sessionId: stateToSave.sessionId, 
        size: dataToStore.length,
        processingTime: Date.now() - startTime,
      });

      if (__DEV__) {
        console.log('💾 SessionStorageService: Session saved successfully', {
          sessionId: stateToSave.sessionId,
          size: `${(dataToStore.length / 1024).toFixed(1)}KB`,
          compressed: this.config.compressionEnabled,
          encrypted: this.config.enableEncryption && Platform.OS !== 'web',
        });
      }

    } catch (error) {
      console.error('SessionStorageService: Save failed:', error);
      this.emitEvent('storage_error', { error, context: 'save' });
      throw error;
    }
  }

  /**
   * Load session state from storage
   */
  async load(): Promise<SessionState | null> {
    const startTime = Date.now();
    
    try {
      // Try to load from secure storage first, then fallback to AsyncStorage
      let rawData: string | null = null;
      
      if (this.config.enableEncryption && Platform.OS !== 'web') {
        try {
          rawData = await SecureStore.getItemAsync(this.config.sessionKey);
        } catch (secureError) {
          console.warn('SessionStorageService: SecureStore failed, falling back to AsyncStorage');
          rawData = await AsyncStorage.getItem(this.config.sessionKey);
        }
      } else {
        rawData = await AsyncStorage.getItem(this.config.sessionKey);
      }

      if (!rawData) {
        if (__DEV__) {
          console.log('📦 SessionStorageService: No session data found');
        }
        return null;
      }

      // Decompress if needed
      let jsonData = rawData;
      const metadata = await this.getMetadata();
      if (metadata?.compressed) {
        jsonData = await this.decompressData(rawData);
      }

      // Parse session state
      const sessionState: SessionState = JSON.parse(jsonData);

      // Validate session state
      this.validateSessionState(sessionState);

      this.emitEvent('session_loaded', { 
        sessionId: sessionState.sessionId,
        version: sessionState.version,
        processingTime: Date.now() - startTime,
      });

      if (__DEV__) {
        console.log('📦 SessionStorageService: Session loaded successfully', {
          sessionId: sessionState.sessionId,
          version: sessionState.version,
          age: `${((Date.now() - sessionState.lastSaved) / 1000 / 60).toFixed(1)}min`,
        });
      }

      return sessionState;

    } catch (error) {
      console.error('SessionStorageService: Load failed:', error);
      
      // Try to recover from backup
      try {
        const backupState = await this.loadFromBackup();
        if (backupState) {
          console.log('SessionStorageService: Recovered from backup');
          this.emitEvent('session_recovery_success', { source: 'backup' });
          return backupState;
        }
      } catch (backupError) {
        console.error('SessionStorageService: Backup recovery failed:', backupError);
      }

      this.emitEvent('storage_error', { error, context: 'load' });
      return null;
    }
  }

  /**
   * Check if a valid session exists
   */
  async isSessionAvailable(): Promise<boolean> {
    try {
      const metadata = await this.getMetadata();
      if (!metadata) return false;

      // Check if session is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const age = Date.now() - metadata.lastSaved;
      
      return age < maxAge;
    } catch (error) {
      console.error('SessionStorageService: Session availability check failed:', error);
      return false;
    }
  }

  /**
   * Clear all session data
   */
  async clear(): Promise<void> {
    try {
      // Clear main session data
      if (this.config.enableEncryption && Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(this.config.sessionKey);
      } else {
        await AsyncStorage.removeItem(this.config.sessionKey);
      }

      // Clear metadata
      await AsyncStorage.removeItem(this.config.metadataKey);

      // Clear backups
      for (let i = 0; i < this.config.maxBackups; i++) {
        await AsyncStorage.removeItem(`${this.config.backupKey}_${i}`);
      }

      this.emitEvent('session_ended', {});

      if (__DEV__) {
        console.log('🗑️ SessionStorageService: Session data cleared');
      }

    } catch (error) {
      console.error('SessionStorageService: Clear failed:', error);
      this.emitEvent('storage_error', { error, context: 'clear' });
      throw error;
    }
  }

  /**
   * Get session metadata without loading full state
   */
  async getMetadata(): Promise<Pick<SessionState, 'version' | 'sessionId' | 'lastSaved'> & { compressed?: boolean } | null> {
    try {
      const metadataJson = await AsyncStorage.getItem(this.config.metadataKey);
      if (!metadataJson) return null;

      const metadata = JSON.parse(metadataJson);
      return {
        version: metadata.version,
        sessionId: metadata.sessionId,
        lastSaved: metadata.lastSaved,
        compressed: metadata.compressed,
      };
    } catch (error) {
      console.error('SessionStorageService: Metadata load failed:', error);
      return null;
    }
  }

  /**
   * Check if storage has sufficient space
   */
  async hasStorageSpace(): Promise<boolean> {
    try {
      const stats = await this.getStorageStats();
      const remainingSpace = this.config.maxStorageSize - stats.sessionSize;
      return remainingSpace > (this.config.maxStorageSize * 0.1); // 10% buffer
    } catch (error) {
      console.error('SessionStorageService: Storage space check failed:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalSize: number;
    sessionSize: number;
    availableSpace: number;
  }> {
    try {
      const sessionData = await AsyncStorage.getItem(this.config.sessionKey);
      const sessionSize = sessionData ? sessionData.length : 0;
      
      return {
        totalSize: this.config.maxStorageSize,
        sessionSize,
        availableSpace: this.config.maxStorageSize - sessionSize,
      };
    } catch (error) {
      console.error('SessionStorageService: Storage stats failed:', error);
      return {
        totalSize: this.config.maxStorageSize,
        sessionSize: 0,
        availableSpace: this.config.maxStorageSize,
      };
    }
  }

  /**
   * Throttled save operation
   */
  saveThrottled(sessionState: SessionState): void {
    if (this.saveThrottle) {
      clearTimeout(this.saveThrottle);
    }

    this.saveThrottle = setTimeout(() => {
      this.save(sessionState).catch(error => {
        console.error('SessionStorageService: Throttled save failed:', error);
      });
    }, this.config.throttleDelay);
  }

  /**
   * Add event listener
   */
  addEventListener(callback: SessionEventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit session event
   */
  private emitEvent(event: SessionEvent, data?: any): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('SessionStorageService: Event callback failed:', error);
      }
    });
  }

  /**
   * Compress data (simple implementation for now)
   */
  private async compressData(data: string): Promise<string> {
    try {
      // For now, we'll use a simple approach
      // In a real implementation, you might use a compression library
      return data;
    } catch (error) {
      throw new Error(`${SessionStorageError.COMPRESSION_FAILED}: ${error}`);
    }
  }

  /**
   * Decompress data
   */
  private async decompressData(data: string): Promise<string> {
    try {
      // For now, we'll use a simple approach
      return data;
    } catch (error) {
      throw new Error(`${SessionStorageError.COMPRESSION_FAILED}: ${error}`);
    }
  }

  /**
   * Create backup of session state
   */
  private async createBackup(sessionState: SessionState): Promise<void> {
    try {
      const backupData = JSON.stringify({
        ...sessionState,
        backupTimestamp: Date.now(),
      });

      // Rotate backups - keep only maxBackups
      for (let i = this.config.maxBackups - 1; i > 0; i--) {
        const currentBackup = await AsyncStorage.getItem(`${this.config.backupKey}_${i - 1}`);
        if (currentBackup) {
          await AsyncStorage.setItem(`${this.config.backupKey}_${i}`, currentBackup);
        }
      }

      // Save new backup
      await AsyncStorage.setItem(`${this.config.backupKey}_0`, backupData);

    } catch (error) {
      console.error('SessionStorageService: Backup creation failed:', error);
    }
  }

  /**
   * Load from backup
   */
  private async loadFromBackup(): Promise<SessionState | null> {
    for (let i = 0; i < this.config.maxBackups; i++) {
      try {
        const backupData = await AsyncStorage.getItem(`${this.config.backupKey}_${i}`);
        if (backupData) {
          const backupState = JSON.parse(backupData);
          this.validateSessionState(backupState);
          return backupState;
        }
      } catch (error) {
        console.error(`SessionStorageService: Backup ${i} is corrupted:`, error);
        continue;
      }
    }
    return null;
  }

  /**
   * Validate session state structure
   */
  private validateSessionState(state: any): void {
    if (!state || typeof state !== 'object') {
      throw new Error(`${SessionStorageError.DATA_CORRUPTED}: Invalid session state structure`);
    }

    const requiredFields = ['version', 'sessionId', 'navigation', 'progress', 'userPreferences'];
    for (const field of requiredFields) {
      if (!(field in state)) {
        throw new Error(`${SessionStorageError.DATA_CORRUPTED}: Missing required field: ${field}`);
      }
    }

    // Check version compatibility
    if (!this.config.supportedVersions.includes(state.version)) {
      throw new Error(`${SessionStorageError.VERSION_MISMATCH}: Unsupported version: ${state.version}`);
    }
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    if (this.saveThrottle) {
      clearTimeout(this.saveThrottle);
      this.saveThrottle = null;
    }
    this.eventListeners = [];
  }
} 