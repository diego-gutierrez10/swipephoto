import { useState, useEffect, useCallback } from 'react';
import PhotoPermissionsService from '../services/PhotoPermissionsService';
import {
  PermissionStatus,
  PermissionRequestResult,
  PermissionRequestOptions,
  PermissionEvent,
} from '../types';

// Get the singleton instance
const permissionsService = PhotoPermissionsService.getInstance();

/**
 * Hook for managing photo permissions in React components
 */
export const usePhotoPermissions = () => {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestResult, setLastRequestResult] = useState<PermissionRequestResult | null>(null);

  // Handle permission events
  const handlePermissionEvent = useCallback((event: PermissionEvent) => {
    if (event.status) {
      setStatus(event.status);
      if (event.type === 'requestCompleted') {
        setLastRequestResult({
          status: event.status,
          canAskAgain: event.status !== 'blocked' && event.status !== 'granted',
          message: `Permission ${event.status}`,
        });
      }
    }
  }, []);

  // Check permission status
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentStatus = await permissionsService.checkPermissionStatus();
      setStatus(currentStatus);
      return currentStatus;
    } catch (error) {
      console.error('Failed to check permission status:', error);
      setStatus('unavailable');
      return 'unavailable' as PermissionStatus;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (options?: PermissionRequestOptions) => {
    setIsLoading(true);
    try {
      const result = await permissionsService.requestPermissions(options);
      setLastRequestResult(result);
      setStatus(result.status);
      return result;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      const errorResult: PermissionRequestResult = {
        status: 'unavailable',
        canAskAgain: false,
        message: 'Failed to request permission',
      };
      setLastRequestResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open settings
  const openSettings = useCallback(async () => {
    try {
      return await permissionsService.openSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    permissionsService.clearCache();
    setStatus('undetermined');
    setLastRequestResult(null);
  }, []);

  // Get request history
  const getRequestHistory = useCallback(() => {
    return permissionsService.getRequestHistory();
  }, []);

  // Set up event listener on mount
  useEffect(() => {
    permissionsService.addEventListener(handlePermissionEvent);
    
    // Check initial status
    checkStatus();

    return () => {
      permissionsService.removeEventListener(handlePermissionEvent);
    };
  }, [handlePermissionEvent, checkStatus]);

  // Computed properties
  const hasPermission = status === 'granted' || status === 'limited';
  const canRequest = status === 'undetermined' || (status === 'denied' && lastRequestResult?.canAskAgain !== false);
  const needsSettings = status === 'blocked';

  return {
    // State
    status,
    isLoading,
    lastRequestResult,
    
    // Computed
    hasPermission,
    canRequest,
    needsSettings,
    
    // Actions
    checkStatus,
    requestPermissions,
    openSettings,
    clearCache,
    getRequestHistory,
  };
};

export default usePhotoPermissions; 