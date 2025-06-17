/**
 * Permission status types for photo library access
 */
export type PermissionStatus = 
  | 'granted'      // User has granted full access
  | 'limited'      // iOS 14+ limited photo selection
  | 'denied'       // User has explicitly denied permission
  | 'blocked'      // User has permanently blocked permission
  | 'undetermined' // Permission has never been requested
  | 'unavailable'; // Feature not available on device

/**
 * Permission request result
 */
export interface PermissionRequestResult {
  status: PermissionStatus;
  canAskAgain: boolean;
  message?: string;
}

/**
 * Permission service events
 */
export type PermissionEventType = 'statusChanged' | 'requestCompleted' | 'settingsOpened' | 'error';

export interface PermissionEvent {
  type: PermissionEventType;
  status?: PermissionStatus;
  previousStatus?: PermissionStatus;
  timestamp: Date;
  error?: Error; // For error events
}

/**
 * Permission callback function
 */
export type PermissionCallback = (event: PermissionEvent) => void;

/**
 * Options for permission requests
 */
export interface PermissionRequestOptions {
  showRationale?: boolean;    // Show explanation before requesting
  allowLimited?: boolean;     // Accept limited access on iOS
  fallbackToSettings?: boolean; // Open settings if permission denied
}

/**
 * Cached permission info
 */
export interface CachedPermissionInfo {
  status: PermissionStatus;
  lastChecked: Date;
  requestCount: number;
  lastRequested?: Date;
}

/**
 * Photo permissions service interface
 */
export interface IPhotoPermissionsService {
  /**
   * Check current permission status
   */
  checkPermissionStatus(): Promise<PermissionStatus>;
  
  /**
   * Request photo library permissions
   */
  requestPermissions(options?: PermissionRequestOptions): Promise<PermissionRequestResult>;
  
  /**
   * Open device settings for the app
   */
  openSettings(): Promise<boolean>;
  
  /**
   * Add event listener for permission changes
   */
  addEventListener(callback: PermissionCallback): void;
  
  /**
   * Remove event listener
   */
  removeEventListener(callback: PermissionCallback): void;
  
  /**
   * Clear cached permission data
   */
  clearCache(): void;
  
  /**
   * Get permission request history
   */
  getRequestHistory(): CachedPermissionInfo | null;
} 