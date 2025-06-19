/**
 * AudioFeedbackService.ts
 * 
 * Service for managing audio feedback effects throughout the SwipePhoto app.
 * Provides sound effects for undo actions while respecting user preferences.
 * Note: Simplified implementation without expo-av dependency.
 */

import { Platform } from 'react-native';

export type AudioFeedbackType = 'undo' | 'success' | 'error';

export interface AudioConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  respectSilentMode: boolean;
}

export class AudioFeedbackService {
  private static isEnabled = true;
  private static volume = 0.5;
  private static respectSilentMode = true;

  /**
   * Initialize audio service
   */
  static async initialize(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔊 AudioFeedbackService: Initialized successfully (simplified mode)');
      }
    } catch (error) {
      console.warn('AudioFeedbackService: Failed to initialize:', error);
    }
  }

  /**
   * Configure audio feedback settings
   */
  static configure(config: Partial<AudioConfig>): void {
    if (config.enabled !== undefined) {
      this.isEnabled = config.enabled;
    }
    if (config.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, config.volume));
    }
    if (config.respectSilentMode !== undefined) {
      this.respectSilentMode = config.respectSilentMode;
    }

    if (__DEV__) {
      console.log('🔊 AudioFeedbackService: Configuration updated', {
        enabled: this.isEnabled,
        volume: this.volume,
        respectSilentMode: this.respectSilentMode,
      });
    }
  }

  /**
   * Play undo sound effect
   */
  static async playUndoSound(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // Simplified implementation - just log for now
      // In a full implementation, this would play actual sound files
      if (__DEV__) {
        console.log('🔊 AudioFeedbackService: Playing undo sound (♪ beep-boop ♪)');
      }

      return true;
    } catch (error) {
      console.warn('AudioFeedbackService: Failed to play undo sound:', error);
      return false;
    }
  }

  /**
   * Play success sound effect
   */
  static async playSuccessSound(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      if (__DEV__) {
        console.log('🔊 AudioFeedbackService: Playing success sound (♪ ding ♪)');
      }

      return true;
    } catch (error) {
      console.warn('AudioFeedbackService: Failed to play success sound:', error);
      return false;
    }
  }

  /**
   * Play error sound effect
   */
  static async playErrorSound(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      if (__DEV__) {
        console.log('🔊 AudioFeedbackService: Playing error sound (♪ buzz ♪)');
      }

      return true;
    } catch (error) {
      console.warn('AudioFeedbackService: Failed to play error sound:', error);
      return false;
    }
  }

  /**
   * Generic sound effect trigger
   */
  static async playFeedback(type: AudioFeedbackType): Promise<boolean> {
    switch (type) {
      case 'undo':
        return await this.playUndoSound();
      case 'success':
        return await this.playSuccessSound();
      case 'error':
        return await this.playErrorSound();
      default:
        console.warn(`AudioFeedbackService: Unknown feedback type: ${type}`);
        return false;
    }
  }

  /**
   * Check if audio feedback is available on this device
   */
  static async checkAudioCapability(): Promise<boolean> {
    try {
      // Simplified check - assume audio is available
      return true;
    } catch (error) {
      console.warn('AudioFeedbackService: Audio not available on this device', error);
      return false;
    }
  }

  /**
   * Enable or disable audio feedback globally
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (__DEV__) {
      console.log(`🔊 AudioFeedbackService: ${enabled ? 'Enabled' : 'Disabled'}`);
    }
  }

  /**
   * Get current audio configuration
   */
  static getConfig(): AudioConfig {
    return {
      enabled: this.isEnabled,
      volume: this.volume,
      respectSilentMode: this.respectSilentMode,
    };
  }

  /**
   * Clean up loaded sounds
   */
  static async cleanup(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔊 AudioFeedbackService: Cleaned up successfully');
      }
    } catch (error) {
      console.warn('AudioFeedbackService: Cleanup failed:', error);
    }
  }
}

export default AudioFeedbackService; 