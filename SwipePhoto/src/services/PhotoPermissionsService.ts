import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import {
  PermissionStatus,
  PermissionRequestResult,
  PermissionCallback,
  PermissionEvent,
  PermissionRequestOptions,
  CachedPermissionInfo,
  IPhotoPermissionsService,
} from '../types';

class PhotoPermissionsService implements IPhotoPermissionsService {
  private static instance: PhotoPermissionsService;
  private listeners: PermissionCallback[] = [];
  private cache: CachedPermissionInfo | null = null;
  private readonly CACHE_KEY = '@SwipePhoto:permissions_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get singleton instance
   */
  public static getInstance(): PhotoPermissionsService {
    if (!PhotoPermissionsService.instance) {
      PhotoPermissionsService.instance = new PhotoPermissionsService();
    }
    return PhotoPermissionsService.instance;
  }

  /**
   * Convert expo-media-library permission status to our permission status
   */
  private mapPermissionStatus(status: MediaLibrary.PermissionStatus): PermissionStatus {
    // expo-media-library has different status values than react-native-permissions
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else if (status === 'undetermined') {
      return 'undetermined';
    } else {
      // Handle any other status or check for limited access
      // Note: expo-media-library may not have a 'limited' status
      return 'unavailable';
    }
  }

  /**
   * Load cached permission info
   */
  private async loadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedPermissionInfo;
        // Check if cache is still valid
        const now = new Date();
        const lastChecked = new Date(parsed.lastChecked);
        if (now.getTime() - lastChecked.getTime() < this.CACHE_DURATION) {
          this.cache = {
            ...parsed,
            lastChecked: lastChecked,
            lastRequested: parsed.lastRequested ? new Date(parsed.lastRequested) : undefined,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load permissions cache:', error);
    }
  }

  /**
   * Save permission info to cache
   */
  private async saveCache(info: CachedPermissionInfo): Promise<void> {
    try {
      this.cache = info;
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(info));
    } catch (error) {
      console.warn('Failed to save permissions cache:', error);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: PermissionEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.warn('Permission event listener error:', error);
      }
    });
  }

  /**
   * Check current permission status
   */
  public async checkPermissionStatus(): Promise<PermissionStatus> {
    await this.loadCache();

    // Return cached status if available and recent
    if (this.cache) {
      const now = new Date();
      const lastChecked = new Date(this.cache.lastChecked);
      if (now.getTime() - lastChecked.getTime() < this.CACHE_DURATION) {
        return this.cache.status;
      }
    }

    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      const mappedStatus = this.mapPermissionStatus(status);

      // Update cache
      const cacheInfo: CachedPermissionInfo = {
        status: mappedStatus,
        lastChecked: new Date(),
        requestCount: this.cache?.requestCount || 0,
        lastRequested: this.cache?.lastRequested,
      };
      await this.saveCache(cacheInfo);

      // Emit status change event if different from cache
      if (this.cache && this.cache.status !== mappedStatus) {
        this.emitEvent({
          type: 'statusChanged',
          status: mappedStatus,
          previousStatus: this.cache.status,
          timestamp: new Date(),
        });
      }

      return mappedStatus;
    } catch (error) {
      console.error('Failed to check permission status:', error);
      return 'unavailable';
    }
  }

  /**
   * Request photo library permissions
   */
  public async requestPermissions(
    options: PermissionRequestOptions = {}
  ): Promise<PermissionRequestResult> {
    const {
      showRationale = true,
      allowLimited = true,
      fallbackToSettings = true,
    } = options;

    try {
      // Check current status first
      const currentStatus = await this.checkPermissionStatus();
      
      // If already granted, return success
      if (currentStatus === 'granted' || (currentStatus === 'limited' && allowLimited)) {
        return {
          status: currentStatus,
          canAskAgain: false,
          message: 'Permission already granted',
        };
      }

      // If blocked (in Expo this is typically when status is denied and canAskAgain is false)
      if (currentStatus === 'denied') {
        const { canAskAgain } = await MediaLibrary.getPermissionsAsync();
        
        if (!canAskAgain) {
          if (fallbackToSettings) {
            Alert.alert(
              'Permission Required',
              'Photo access has been blocked. Please enable it in Settings to use this feature.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => this.openSettings() },
              ]
            );
          }
          
          return {
            status: 'blocked',
            canAskAgain: false,
            message: 'Permission blocked, requires manual settings change',
          };
        }
      }

      // Request permission
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      const finalStatus = this.mapPermissionStatus(status);

      // Update cache with request info
      const cacheInfo: CachedPermissionInfo = {
        status: finalStatus,
        lastChecked: new Date(),
        requestCount: (this.cache?.requestCount || 0) + 1,
        lastRequested: new Date(),
      };
      await this.saveCache(cacheInfo);

      // Emit request completed event
      this.emitEvent({
        type: 'requestCompleted',
        status: finalStatus,
        previousStatus: currentStatus,
        timestamp: new Date(),
      });

      const isSuccess = finalStatus === 'granted' || (finalStatus === 'limited' && allowLimited);
      
      return {
        status: finalStatus,
        canAskAgain,
        message: isSuccess
          ? 'Permission granted successfully'
          : `Permission ${finalStatus}. ${canAskAgain ? 'You can ask again.' : 'Cannot ask again.'}`,
      };
    } catch (error) {
      console.error('Failed to request permissions:', error);
      
      // Emit error event
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error('Unknown permission error'),
        timestamp: new Date(),
      });

      return {
        status: 'unavailable',
        canAskAgain: false,
        message: 'Failed to request permission due to system error',
      };
    }
  }

  /**
   * Open device settings for permission management
   * Note: Expo doesn't provide direct access to specific permission settings,
   * so we open general settings
   */
  public async openSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
        return true;
      } else if (Platform.OS === 'android') {
        await Linking.openURL('package:' + await this.getAndroidPackageName());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to open settings:', error);
      
      // Fallback: try to open general settings
      try {
        if (Platform.OS === 'ios') {
          await Linking.openURL('App-Prefs:');
        } else {
          await Linking.openURL('package:com.android.settings');
        }
        return true;
      } catch (fallbackError) {
        console.error('Failed to open fallback settings:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Get Android package name for settings link
   */
  private async getAndroidPackageName(): Promise<string> {
    // In Expo, we can use the application ID from expo constants
    try {
      const Constants = require('expo-constants').default;
      return Constants.expoConfig?.android?.package || 'host.exp.exponent';
    } catch {
      return 'host.exp.exponent'; // Expo Go package name as fallback
    }
  }

  /**
   * Add event listener for permission changes
   */
  public addEventListener(callback: PermissionCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(callback: PermissionCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Clear permission cache
   */
  public clearCache(): void {
    this.cache = null;
    AsyncStorage.removeItem(this.CACHE_KEY).catch(error => {
      console.warn('Failed to clear permissions cache:', error);
    });
  }

  /**
   * Get request history for debugging
   */
  public getRequestHistory(): CachedPermissionInfo | null {
    return this.cache;
  }
}

export default PhotoPermissionsService; 