import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionState } from '../types/session';

// Recovery-specific types
export interface CrashDetectionResult {
  hasCrashed: boolean;
  crashTimestamp?: number;
  sessionData?: SessionState | null;
  corruptionLevel: 'none' | 'minor' | 'major' | 'severe';
  recoveryRecommendation: 'restore' | 'partial_restore' | 'fresh_start';
}

export interface RecoveryUIOptions {
  showRecoveryDialog: boolean;
  title: string;
  message: string;
  options: RecoveryOption[];
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: 'restore_full' | 'restore_partial' | 'start_fresh' | 'show_details';
  recommended?: boolean;
}

export interface SessionSnapshot {
  id: string;
  timestamp: number;
  sessionState: SessionState;
  journeyPoint: string;
  integrity: string; // SHA-256 hash
  size: number;
}

export interface RecoveryTelemetry {
  crashDetected: boolean;
  recoveryAttempted: boolean;
  recoverySuccess: boolean;
  errorType?: string;
  sessionAge?: number;
  dataCorruption?: boolean;
  userChoice?: string;
  recoveryDuration?: number;
}

// Storage keys
const STORAGE_KEYS = {
  STARTUP_FLAG: '@SwipePhoto_startup_flag',
  RECOVERY_JOURNAL: '@SwipePhoto_recovery_journal',
  LAST_SNAPSHOT: '@SwipePhoto_last_snapshot',
  RECOVERY_TELEMETRY: '@SwipePhoto_recovery_telemetry',
  SESSION_STATE: '@SwipePhoto_session_state',
} as const;

export class SessionRecoveryManager {
  private static instance: SessionRecoveryManager | null = null;
  private isInitialized = false;
  private journalBuffer: Array<{ timestamp: number; change: any; journeyPoint: string }> = [];
  private snapshotTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SessionRecoveryManager {
    if (!SessionRecoveryManager.instance) {
      SessionRecoveryManager.instance = new SessionRecoveryManager();
    }
    return SessionRecoveryManager.instance;
  }

  /**
   * Initialize the recovery manager - should be called at app startup
   */
  public async initialize(): Promise<CrashDetectionResult> {
    console.log('🔄 SessionRecoveryManager: Initializing crash detection...');
    
    try {
      const result = await this.detectCrash();
      
      if (result.hasCrashed) {
        console.log('⚠️ SessionRecoveryManager: Crash detected, preparing recovery options...');
        await this.logRecoveryTelemetry({
          crashDetected: true,
          recoveryAttempted: false,
          recoverySuccess: false,
          sessionAge: result.sessionData ? Date.now() - (result.sessionData.lastSaved || 0) : undefined,
          dataCorruption: result.corruptionLevel !== 'none'
        });
      } else {
        console.log('✅ SessionRecoveryManager: Normal startup detected');
      }

      // Set startup flag to indicate normal operation
      await this.setStartupFlag(true);
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      this.isInitialized = true;
      return result;
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect if the app crashed in the previous session
   */
  private async detectCrash(): Promise<CrashDetectionResult> {
    try {
      // Check if startup flag was properly cleared in previous session
      const startupFlag = await AsyncStorage.getItem(STORAGE_KEYS.STARTUP_FLAG);
      const hadNormalExit = startupFlag === 'false' || startupFlag === null;

      if (hadNormalExit) {
        return {
          hasCrashed: false,
          corruptionLevel: 'none',
          recoveryRecommendation: 'restore'
        };
      }

      // Crash detected - try to recover session data
      console.log('⚠️ SessionRecoveryManager: Abnormal shutdown detected, checking session integrity...');
      
      const sessionData = await this.loadLastValidSession();
      const corruptionLevel = sessionData ? await this.validateSessionIntegrity(sessionData) : 'severe';
      
      const recoveryRecommendation = this.determineRecoveryStrategy(corruptionLevel);

      return {
        hasCrashed: true,
        crashTimestamp: Date.now(),
        sessionData,
        corruptionLevel,
        recoveryRecommendation
      };

    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error detecting crash:', error);
      return {
        hasCrashed: true,
        corruptionLevel: 'severe',
        recoveryRecommendation: 'fresh_start'
      };
    }
  }

  /**
   * Validate the integrity of recovered session data
   */
  private async validateSessionIntegrity(sessionData: SessionState): Promise<'none' | 'minor' | 'major' | 'severe'> {
    try {
      // Basic structure validation
      if (!sessionData || typeof sessionData !== 'object') {
        return 'severe';
      }

      // Check required fields
      const requiredFields = ['version', 'sessionId', 'navigation'];
      const missingFields = requiredFields.filter(field => !(field in sessionData));
      
      if (missingFields.length > 0) {
        console.warn('⚠️ SessionRecoveryManager: Missing required fields:', missingFields);
        return missingFields.length > 1 ? 'major' : 'minor';
      }

      // Version compatibility check
      if (sessionData.version && !this.isVersionCompatible(sessionData.version)) {
        console.warn('⚠️ SessionRecoveryManager: Version incompatibility detected');
        return 'major';
      }

      // Data freshness check (if session is too old, might be corrupted)
      const sessionAge = Date.now() - (sessionData.lastSaved || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        console.warn('⚠️ SessionRecoveryManager: Session data is too old');
        return 'minor';
      }

      // Check basic data consistency
      if (!sessionData.navigation?.currentScreen || !sessionData.sessionId) {
        return 'minor';
      }

      console.log('✅ SessionRecoveryManager: Session data integrity validated');
      return 'none';

    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error validating session integrity:', error);
      return 'severe';
    }
  }

  /**
   * Check if session version is compatible with current app version
   */
  private isVersionCompatible(sessionVersion: string): boolean {
    // Simple version compatibility check
    const currentVersion = '1.0.0'; // Should be imported from app config
    const sessionMajor = parseInt(sessionVersion.split('.')[0]);
    const currentMajor = parseInt(currentVersion.split('.')[0]);
    
    return sessionMajor === currentMajor;
  }

  /**
   * Determine the best recovery strategy based on corruption level
   */
  private determineRecoveryStrategy(corruptionLevel: 'none' | 'minor' | 'major' | 'severe'): 'restore' | 'partial_restore' | 'fresh_start' {
    switch (corruptionLevel) {
      case 'none':
        return 'restore';
      case 'minor':
        return 'partial_restore';
      case 'major':
      case 'severe':
      default:
        return 'fresh_start';
    }
  }

  /**
   * Load the last valid session from storage
   */
  private async loadLastValidSession(): Promise<SessionState | null> {
    try {
      // Try to load from snapshot first
      const snapshotData = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SNAPSHOT);
      if (snapshotData) {
        const snapshot: SessionSnapshot = JSON.parse(snapshotData);
        if (await this.verifySnapshotIntegrity(snapshot)) {
          console.log('✅ SessionRecoveryManager: Loaded session from snapshot');
          return snapshot.sessionState;
        }
      }

      // Fallback to direct session storage
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      return null;
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error loading last session:', error);
      return null;
    }
  }

  /**
   * Verify snapshot integrity using hash
   */
  private async verifySnapshotIntegrity(snapshot: SessionSnapshot): Promise<boolean> {
    try {
      const dataString = JSON.stringify(snapshot.sessionState);
      const computedHash = await this.generateHash(dataString);
      return computedHash === snapshot.integrity;
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error verifying snapshot integrity:', error);
      return false;
    }
  }

  /**
   * Generate recovery UI options based on crash detection result
   */
  public generateRecoveryUIOptions(result: CrashDetectionResult): RecoveryUIOptions {
    const baseTitle = 'App Recovery';
    
    switch (result.recoveryRecommendation) {
      case 'restore':
        return {
          showRecoveryDialog: true,
          title: baseTitle,
          message: 'The app was unexpectedly closed. Your previous session has been recovered and can be restored.',
          options: [
            {
              id: 'restore_full',
              label: 'Restore Session',
              description: 'Continue where you left off',
              action: 'restore_full',
              recommended: true
            },
            {
              id: 'start_fresh',
              label: 'Start Fresh',
              description: 'Begin a new session',
              action: 'start_fresh'
            }
          ]
        };

      case 'partial_restore':
        return {
          showRecoveryDialog: true,
          title: baseTitle,
          message: 'Some of your session data may have been affected. You can restore what\'s available or start fresh.',
          options: [
            {
              id: 'restore_partial',
              label: 'Restore Available Data',
              description: 'Recover what can be safely restored',
              action: 'restore_partial',
              recommended: true
            },
            {
              id: 'show_details',
              label: 'Show Details',
              description: 'See what data is available',
              action: 'show_details'
            },
            {
              id: 'start_fresh',
              label: 'Start Fresh',
              description: 'Begin a new session',
              action: 'start_fresh'
            }
          ]
        };

      case 'fresh_start':
      default:
        return {
          showRecoveryDialog: true,
          title: baseTitle,
          message: 'The previous session data appears to be corrupted. Starting with a fresh session is recommended.',
          options: [
            {
              id: 'start_fresh',
              label: 'Start Fresh',
              description: 'Begin a new session (recommended)',
              action: 'start_fresh',
              recommended: true
            },
            {
              id: 'show_details',
              label: 'Show Technical Details',
              description: 'View error information',
              action: 'show_details'
            }
          ]
        };
    }
  }

  /**
   * Execute recovery action based on user choice
   */
  public async executeRecovery(
    action: 'restore_full' | 'restore_partial' | 'start_fresh' | 'show_details',
    sessionData?: SessionState | null
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 SessionRecoveryManager: Executing recovery action: ${action}`);
      
      let success = false;
      
      switch (action) {
        case 'restore_full':
          if (sessionData) {
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(sessionData));
            success = true;
            console.log('✅ SessionRecoveryManager: Full session restored successfully');
          }
          break;

        case 'restore_partial':
          if (sessionData) {
            const cleanedData = await this.cleanCorruptedData(sessionData);
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(cleanedData));
            success = true;
            console.log('✅ SessionRecoveryManager: Partial session restored successfully');
          }
          break;

        case 'start_fresh':
          await this.clearAllRecoveryData();
          success = true;
          console.log('✅ SessionRecoveryManager: Fresh session started');
          break;

        case 'show_details':
          // This would typically open a debug/details screen
          success = true;
          break;
      }

      // Log telemetry
      await this.logRecoveryTelemetry({
        crashDetected: true,
        recoveryAttempted: true,
        recoverySuccess: success,
        userChoice: action,
        recoveryDuration: Date.now() - startTime
      });

      return success;
    } catch (error) {
      console.error(`❌ SessionRecoveryManager: Error executing recovery action ${action}:`, error);
      
      await this.logRecoveryTelemetry({
        crashDetected: true,
        recoveryAttempted: true,
        recoverySuccess: false,
        errorType: error instanceof Error ? error.message : 'Unknown error',
        userChoice: action,
        recoveryDuration: Date.now() - startTime
      });

      return false;
    }
  }

  /**
   * Clean corrupted data from session state
   */
  private async cleanCorruptedData(sessionData: SessionState): Promise<SessionState> {
    const cleaned = { ...sessionData };
    
    try {
      // Reset navigation to safe defaults if corrupted
      if (!cleaned.navigation?.currentScreen) {
        cleaned.navigation = {
          ...cleaned.navigation,
          currentScreen: 'Home',
          currentPhotoIndex: 0,
          selectedCategoryId: null,
          selectedCategoryType: null
        };
      }

      // Reset timestamp to current time
      cleaned.lastSaved = Date.now();

      // Ensure session ID exists
      if (!cleaned.sessionId) {
        cleaned.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      console.log('✅ SessionRecoveryManager: Session data cleaned successfully');
      return cleaned;
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error cleaning session data:', error);
      throw error;
    }
  }

  /**
   * Start monitoring session for automatic snapshots
   */
  private startSessionMonitoring(): void {
    // Create snapshot every 5 minutes during active use
    this.snapshotTimer = setInterval(() => {
      this.createSessionSnapshot('periodic');
    }, 5 * 60 * 1000);

    console.log('✅ SessionRecoveryManager: Session monitoring started');
  }

  /**
   * Create a session snapshot at important journey points
   */
  public async createSessionSnapshot(journeyPoint: string): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      if (!sessionData) {
        return;
      }

      const sessionState: SessionState = JSON.parse(sessionData);
      const snapshot: SessionSnapshot = {
        id: this.generateSnapshotId(),
        timestamp: Date.now(),
        sessionState,
        journeyPoint,
        integrity: await this.generateHash(sessionData),
        size: sessionData.length
      };

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SNAPSHOT, JSON.stringify(snapshot));
      console.log(`📸 SessionRecoveryManager: Snapshot created at ${journeyPoint}`);
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error creating snapshot:', error);
    }
  }

  /**
   * Record incremental state changes in the recovery journal
   */
  public recordJournalEntry(change: any, journeyPoint: string): void {
    try {
      this.journalBuffer.push({
        timestamp: Date.now(),
        change,
        journeyPoint
      });

      // Keep only last 100 entries in memory
      if (this.journalBuffer.length > 100) {
        this.journalBuffer = this.journalBuffer.slice(-100);
      }

      // Persist journal periodically
      if (this.journalBuffer.length % 10 === 0) {
        this.persistJournal();
      }
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error recording journal entry:', error);
    }
  }

  /**
   * Persist the journal buffer to storage
   */
  private async persistJournal(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_JOURNAL, JSON.stringify(this.journalBuffer));
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error persisting journal:', error);
    }
  }

  /**
   * Set startup flag to indicate normal operation
   */
  private async setStartupFlag(isRunning: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STARTUP_FLAG, isRunning.toString());
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error setting startup flag:', error);
    }
  }

  /**
   * Clear startup flag on normal app exit
   */
  public async onAppExit(): Promise<void> {
    try {
      await this.setStartupFlag(false);
      await this.persistJournal();
      
      if (this.snapshotTimer) {
        clearInterval(this.snapshotTimer);
      }
      
      console.log('✅ SessionRecoveryManager: App exit handled cleanly');
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error during app exit:', error);
    }
  }

  /**
   * Clear all recovery-related data
   */
  private async clearAllRecoveryData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      this.journalBuffer = [];
      console.log('✅ SessionRecoveryManager: All recovery data cleared');
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error clearing recovery data:', error);
    }
  }

  /**
   * Log recovery telemetry for analytics
   */
  private async logRecoveryTelemetry(telemetry: Partial<RecoveryTelemetry>): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_TELEMETRY);
      const telemetryLog = existingData ? JSON.parse(existingData) : [];
      
      telemetryLog.push({
        timestamp: Date.now(),
        ...telemetry
      });

      // Keep only last 50 entries
      const trimmedLog = telemetryLog.slice(-50);
      
      await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_TELEMETRY, JSON.stringify(trimmedLog));
      console.log('📊 SessionRecoveryManager: Telemetry logged:', telemetry);
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error logging telemetry:', error);
    }
  }

  /**
   * Generate a hash for data integrity verification
   */
  private async generateHash(data: string): Promise<string> {
    // Simple hash function for demo - in production, use crypto library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recovery telemetry for debugging
   */
  public async getRecoveryTelemetry(): Promise<Array<RecoveryTelemetry & { timestamp: number }>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_TELEMETRY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ SessionRecoveryManager: Error getting telemetry:', error);
      return [];
    }
  }

  /**
   * Reset the recovery manager instance for testing
   */
  public static resetInstance(): void {
    if (SessionRecoveryManager.instance) {
      const instance = SessionRecoveryManager.instance;
      if (instance.snapshotTimer) {
        clearInterval(instance.snapshotTimer);
      }
    }
    SessionRecoveryManager.instance = null;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
    this.journalBuffer = [];
    this.isInitialized = false;
    console.log('✅ SessionRecoveryManager: Disposed');
  }
} 