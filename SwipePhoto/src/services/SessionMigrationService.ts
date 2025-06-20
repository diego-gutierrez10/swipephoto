/**
 * SessionMigrationService.ts
 * 
 * Handles migration of session state between different app versions.
 * Ensures backward compatibility and safe upgrades.
 */

import {
  SessionState,
  ISessionMigration,
  SessionEvent,
  SessionEventCallback,
  createDefaultSessionState,
} from '../types/session';

/**
 * Migration step interface
 */
interface MigrationStep {
  from: string;
  to: string;
  migrate: (oldState: any) => any;
  description: string;
}

/**
 * Session migration service implementation
 */
export class SessionMigrationService implements ISessionMigration {
  private eventListeners: SessionEventCallback[] = [];
  
  // Define all migration steps
  private migrationSteps: MigrationStep[] = [
    // Future migrations will be added here
    // Example:
    // {
    //   from: '1.0.0',
    //   to: '1.1.0',
    //   migrate: this.migrateFrom100To110.bind(this),
    //   description: 'Add new user preference fields'
    // }
  ];

  constructor() {
    this.initializeMigrations();
  }

  /**
   * Initialize migration system
   */
  private initializeMigrations(): void {
    if (__DEV__) {
      console.log('🔄 SessionMigrationService: Initialized with migrations:', 
        this.migrationSteps.map(step => `${step.from} -> ${step.to}`));
    }
  }

  /**
   * Migrate session state from an older version
   */
  async migrate(oldState: any, oldVersion: string, newVersion: string): Promise<SessionState> {
    const startTime = Date.now();
    
    try {
      if (__DEV__) {
        console.log(`🔄 SessionMigrationService: Starting migration from ${oldVersion} to ${newVersion}`);
      }

      // If versions are the same, no migration needed
      if (oldVersion === newVersion) {
        return this.validateAndSanitizeState(oldState, newVersion);
      }

      // Find migration path
      const migrationPath = this.findMigrationPath(oldVersion, newVersion);
      if (migrationPath.length === 0) {
        throw new Error(`No migration path found from ${oldVersion} to ${newVersion}`);
      }

      // Apply migrations step by step
      let currentState = oldState;
      let currentVersion = oldVersion;

      for (const step of migrationPath) {
        try {
          if (__DEV__) {
            console.log(`🔄 Applying migration: ${step.from} -> ${step.to} (${step.description})`);
          }

          currentState = await step.migrate(currentState);
          currentVersion = step.to;
          
          // Update version in state
          if (currentState && typeof currentState === 'object') {
            currentState.version = currentVersion;
          }

        } catch (stepError) {
          console.error(`SessionMigrationService: Migration step failed: ${step.from} -> ${step.to}`, stepError);
          const errorMessage = stepError instanceof Error ? stepError.message : String(stepError);
          throw new Error(`Migration failed at step ${step.from} -> ${step.to}: ${errorMessage}`);
        }
      }

      // Final validation and sanitization
      const migratedState = this.validateAndSanitizeState(currentState, newVersion);

      this.emitEvent('session_migrated', {
        fromVersion: oldVersion,
        toVersion: newVersion,
        processingTime: Date.now() - startTime,
        stepsApplied: migrationPath.length,
      });

      if (__DEV__) {
        console.log(`✅ SessionMigrationService: Successfully migrated from ${oldVersion} to ${newVersion} in ${Date.now() - startTime}ms`);
      }

      return migratedState;

    } catch (error) {
      console.error('SessionMigrationService: Migration failed:', error);
      
      // If migration fails, create a fresh state but preserve what we can
      const fallbackState = this.createFallbackState(oldState, newVersion);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitEvent('session_recovery_failed', {
        fromVersion: oldVersion,
        toVersion: newVersion,
        error: errorMessage,
        fallbackUsed: true,
      });

      return fallbackState;
    }
  }

  /**
   * Check if migration is needed
   */
  needsMigration(currentVersion: string, targetVersion: string): boolean {
    if (!currentVersion || !targetVersion) return false;
    
    const needsMigration = currentVersion !== targetVersion;
    
    if (needsMigration && __DEV__) {
      console.log(`🔄 SessionMigrationService: Migration needed from ${currentVersion} to ${targetVersion}`);
    }
    
    return needsMigration;
  }

  /**
   * Get supported migration paths
   */
  getSupportedMigrations(): { from: string; to: string }[] {
    return this.migrationSteps.map(step => ({
      from: step.from,
      to: step.to,
    }));
  }

  /**
   * Find migration path between two versions
   */
  private findMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
    const path: MigrationStep[] = [];
    let currentVersion = fromVersion;

    // Simple linear path finding
    // For more complex version trees, implement Dijkstra's algorithm
    while (currentVersion !== toVersion) {
      const nextStep = this.migrationSteps.find(step => step.from === currentVersion);
      
      if (!nextStep) {
        // If no direct path, check if we can skip versions
        const availableSteps = this.migrationSteps.filter(step => 
          this.isVersionNewerThan(step.from, currentVersion) &&
          this.isVersionOlderThan(step.to, toVersion)
        );
        
        if (availableSteps.length === 0) {
          console.warn(`SessionMigrationService: No migration path found from ${currentVersion} to ${toVersion}`);
          break;
        }
        
        // Take the closest version step
        const closestStep = availableSteps.reduce((closest, step) => 
          this.isVersionCloserTo(step.to, toVersion, closest.to) ? step : closest
        );
        
        path.push(closestStep);
        currentVersion = closestStep.to;
      } else {
        path.push(nextStep);
        currentVersion = nextStep.to;
      }

      // Prevent infinite loops
      if (path.length > 10) {
        console.error('SessionMigrationService: Migration path too long, aborting');
        break;
      }
    }

    return path;
  }

  /**
   * Validate and sanitize migrated state
   */
  private validateAndSanitizeState(state: any, targetVersion: string): SessionState {
    try {
      // If state is null or invalid, create default
      if (!state || typeof state !== 'object') {
        console.warn('SessionMigrationService: Invalid state, creating default');
        return createDefaultSessionState(`session_${Date.now()}`);
      }

      // Ensure required fields exist
      const requiredFields = {
        version: targetVersion,
        sessionId: state.sessionId || `session_${Date.now()}`,
        lastSaved: Date.now(),
        appVersion: targetVersion,
      };

      // Create sanitized state with defaults
      const sanitizedState: SessionState = {
        ...createDefaultSessionState(requiredFields.sessionId),
        ...state,
        ...requiredFields,
      };

      // Validate navigation state
      if (!sanitizedState.navigation || typeof sanitizedState.navigation !== 'object') {
        sanitizedState.navigation = createDefaultSessionState(requiredFields.sessionId).navigation;
      }

      // Validate progress state
      if (!sanitizedState.progress || typeof sanitizedState.progress !== 'object') {
        sanitizedState.progress = createDefaultSessionState(requiredFields.sessionId).progress;
        sanitizedState.progress.sessionId = requiredFields.sessionId;
      }

      // Validate user preferences
      if (!sanitizedState.userPreferences || typeof sanitizedState.userPreferences !== 'object') {
        sanitizedState.userPreferences = createDefaultSessionState(requiredFields.sessionId).userPreferences;
      }

      // Validate undo state
      if (!sanitizedState.undoState || typeof sanitizedState.undoState !== 'object') {
        sanitizedState.undoState = createDefaultSessionState(requiredFields.sessionId).undoState;
      }

      // Validate metadata
      if (!sanitizedState.metadata || typeof sanitizedState.metadata !== 'object') {
        sanitizedState.metadata = createDefaultSessionState(requiredFields.sessionId).metadata;
      }

      return sanitizedState;

    } catch (error) {
      console.error('SessionMigrationService: State validation failed:', error);
      return createDefaultSessionState(`session_${Date.now()}`);
    }
  }

  /**
   * Create fallback state when migration completely fails
   */
  private createFallbackState(oldState: any, targetVersion: string): SessionState {
    const fallbackState = createDefaultSessionState(`fallback_${Date.now()}`);
    
    // Try to preserve some user preferences if possible
    try {
      if (oldState?.userPreferences) {
        fallbackState.userPreferences = {
          ...fallbackState.userPreferences,
          theme: oldState.userPreferences.theme || fallbackState.userPreferences.theme,
          hapticFeedbackEnabled: oldState.userPreferences.hapticFeedbackEnabled ?? fallbackState.userPreferences.hapticFeedbackEnabled,
          soundEnabled: oldState.userPreferences.soundEnabled ?? fallbackState.userPreferences.soundEnabled,
        };
      }
    } catch (error) {
      console.warn('SessionMigrationService: Could not preserve user preferences:', error);
    }

    fallbackState.version = targetVersion;
    fallbackState.appVersion = targetVersion;
    
    return fallbackState;
  }

  /**
   * Version comparison utilities
   */
  private isVersionNewerThan(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) > 0;
  }

  private isVersionOlderThan(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) < 0;
  }

  private isVersionCloserTo(version1: string, target: string, version2: string): boolean {
    const diff1 = Math.abs(this.compareVersions(version1, target));
    const diff2 = Math.abs(this.compareVersions(version2, target));
    return diff1 < diff2;
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    try {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      
      const maxLength = Math.max(parts1.length, parts2.length);
      
      for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
      }
      
      return 0;
    } catch (error) {
      console.error('SessionMigrationService: Version comparison failed:', error);
      return 0;
    }
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
   * Emit migration event
   */
  private emitEvent(event: SessionEvent, data?: any): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('SessionMigrationService: Event callback failed:', error);
      }
    });
  }

  /**
   * Add new migration step (for future use)
   */
  addMigrationStep(step: MigrationStep): void {
    this.migrationSteps.push(step);
    
    if (__DEV__) {
      console.log(`🔄 SessionMigrationService: Added migration step ${step.from} -> ${step.to}`);
    }
  }

  /**
   * Example migration methods (for future versions)
   */
  
  // private migrateFrom100To110(oldState: any): any {
  //   return {
  //     ...oldState,
  //     userPreferences: {
  //       ...oldState.userPreferences,
  //       // Add new preference with default value
  //       newFeatureEnabled: true,
  //     },
  //   };
  // }

  /**
   * Dispose of the service
   */
  dispose(): void {
    this.eventListeners = [];
  }
} 