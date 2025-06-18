/**
 * HapticFeedbackService.ts
 * 
 * Service for managing haptic feedback across the SwipePhoto app.
 * Provides different feedback intensities for different swipe actions.
 * Uses expo-haptics for Expo Go compatibility.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedbackType = 'keep' | 'delete';

export class HapticFeedbackService {
  private static isEnabled = true;
  
  /**
   * Enable or disable haptic feedback globally
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if haptic feedback is currently enabled
   */
  static isHapticEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Trigger haptic feedback for KEEP action (very light, barely perceptible)
   */
  static async triggerKeepFeedback(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      // Use the lightest impact for both iOS and Android
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('HapticFeedback: Failed to trigger keep feedback', error);
    }
  }
  
  /**
   * Trigger haptic feedback for DELETE action (double the intensity of KEEP)
   */
  static async triggerDeleteFeedback(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      // Use medium impact for both iOS and Android (stronger than light)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('HapticFeedback: Failed to trigger delete feedback', error);
    }
  }
  
  /**
   * Generic haptic feedback trigger based on action type
   */
  static async triggerFeedback(type: HapticFeedbackType): Promise<void> {
    switch (type) {
      case 'keep':
        await this.triggerKeepFeedback();
        break;
      case 'delete':
        await this.triggerDeleteFeedback();
        break;
      default:
        console.warn(`HapticFeedback: Unknown feedback type: ${type}`);
    }
  }
  
  /**
   * Test haptic feedback capability
   */
  static async testHapticCapability(): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    } catch (error) {
      console.warn('HapticFeedback: Device does not support haptic feedback', error);
      return false;
    }
  }
}

export default HapticFeedbackService; 