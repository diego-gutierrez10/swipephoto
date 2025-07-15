/**
 * HapticFeedbackService.ts
 * 
 * Service for managing haptic feedback across the SwipePhoto app.
 * Provides different feedback intensities and respects user preferences.
 * Uses a singleton pattern to maintain a consistent state.
 */
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTIC_STORAGE_KEY = '@hapticFeedback';

export type HapticFeedbackType = 'keep' | 'delete' | 'undo' | 'success' | 'error' | 'warning';

class HapticFeedbackService {
  private static instance: HapticFeedbackService;
  private isEnabled = true; // Default to true

  // Private constructor for singleton pattern
  private constructor() {}

  /**
   * Get the singleton instance of the service.
   */
  public static getInstance(): HapticFeedbackService {
    if (!HapticFeedbackService.instance) {
      HapticFeedbackService.instance = new HapticFeedbackService();
    }
    return HapticFeedbackService.instance;
  }

  /**
   * Initialize the service by loading the user's preference from storage.
   * This should be called once when the app starts.
   */
  public async initialize(): Promise<void> {
    try {
      const storedPreference = await AsyncStorage.getItem(HAPTIC_STORAGE_KEY);
      if (storedPreference !== null) {
        this.isEnabled = JSON.parse(storedPreference);
      } else {
        // If no preference is stored, default to true and save it.
        this.isEnabled = true;
        await AsyncStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(true));
      }
      console.log(`HapticFeedbackService initialized. Haptics are ${this.isEnabled ? 'ENABLED' : 'DISABLED'}.`);
    } catch (error) {
      console.error('HapticFeedbackService: Failed to initialize haptic preferences', error);
      this.isEnabled = true; // Fallback to enabled on error
    }
  }

  /**
   * Enable or disable haptic feedback globally and persist the setting.
   */
  public async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    try {
      await AsyncStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('HapticFeedbackService: Failed to save haptic preference', error);
    }
  }

  /**
   * Check if haptic feedback is currently enabled.
   */
  public isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Trigger haptic feedback with a specific style if enabled.
   * @param style - The intensity of the feedback.
   */
  public async trigger(style: Haptics.ImpactFeedbackStyle): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(style);
    } catch (error) {
      // This can happen on devices that don't support haptics.
      // console.warn('HapticFeedbackService: Failed to trigger haptic feedback.', error);
    }
  }

  /**
   * Trigger a notification feedback (e.g., success, error, warning).
   * @param type - The type of notification feedback.
   */
  public async notify(type: Haptics.NotificationFeedbackType): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(type);
    } catch (error) {
      // console.warn('HapticFeedbackService: Failed to trigger notification feedback.', error);
    }
  }
}

export default HapticFeedbackService.getInstance(); 