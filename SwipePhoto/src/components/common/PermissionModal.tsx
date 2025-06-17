import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../constants/theme';
import { PermissionStatus, PermissionRequestOptions } from '../../types';
import { usePhotoPermissions } from '../../hooks';
import PermissionIcon from '../ui/PermissionIcon';

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: (status: PermissionStatus) => void;
  onPermissionDenied?: (status: PermissionStatus) => void;
  options?: PermissionRequestOptions;
  title?: string;
  message?: string;
  context?: 'photo-picker' | 'organize' | 'camera' | 'general';
}

/**
 * Contextual permission modal for inline permission requests
 * Shows when user triggers an action that requires permissions
 */
export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
  options = {},
  title,
  message,
  context = 'general',
}) => {
  const {
    status,
    isLoading,
    hasPermission,
    canRequest,
    needsSettings,
    requestPermissions,
    openSettings,
  } = usePhotoPermissions();

  const [isRequesting, setIsRequesting] = useState(false);

  // Get contextual content based on the context
  const getContextualContent = () => {
    switch (context) {
      case 'photo-picker':
        return {
          title: title || 'Photo Access Needed',
          message: message || 'To select photos for organization, SwipePhoto needs access to your photo library.',
          icon: 'images' as const,
        };
      case 'organize':
        return {
          title: title || 'Organize Your Photos',
          message: message || 'Grant photo access to start organizing your images into custom categories.',
          icon: 'albums' as const,
        };
      case 'camera':
        return {
          title: title || 'Camera Access',
          message: message || 'Take new photos to add to your organized collections.',
          icon: 'camera' as const,
        };
      default:
        return {
          title: title || 'Photo Access Required',
          message: message || 'SwipePhoto needs access to your photos to help you organize them.',
          icon: 'images' as const,
        };
    }
  };

  const { title: contextTitle, message: contextMessage, icon } = getContextualContent();

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    if (isLoading || isRequesting) return;
    
    setIsRequesting(true);
    
    try {
      const result = await requestPermissions(options);
      
      if (result.status === 'granted' || result.status === 'limited') {
        onPermissionGranted?.(result.status);
        onClose();
      } else {
        onPermissionDenied?.(result.status);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      onPermissionDenied?.('unavailable');
    } finally {
      setIsRequesting(false);
    }
  }, [isLoading, isRequesting, requestPermissions, options, onPermissionGranted, onPermissionDenied, onClose]);

  // Handle settings navigation
  const handleOpenSettings = useCallback(async () => {
    await openSettings();
    onClose();
  }, [openSettings, onClose]);

  // Don't show modal if permission is already granted
  if (hasPermission) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Close button */}
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close permission dialog"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>

            {/* Icon */}
            <View style={styles.iconContainer}>
              {isRequesting ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View style={styles.iconBackground}>
                  <Ionicons name={icon} size={40} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Content */}
            <Text style={styles.title} accessibilityRole="header">
              {contextTitle}
            </Text>
            
            <Text style={styles.message}>
              {contextMessage}
            </Text>

            {/* Permission status indicator */}
            {status !== 'undetermined' && (
              <View style={styles.statusContainer}>
                <PermissionIcon status={status} size={32} />
                <Text style={styles.statusText}>
                  {status === 'denied' ? 'Permission denied' :
                   status === 'blocked' ? 'Permission blocked' :
                   status === 'limited' ? 'Limited access' :
                   'Permission granted'}
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              {needsSettings ? (
                <>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleOpenSettings}
                    accessibilityRole="button"
                    accessibilityLabel="Open settings to grant permission"
                  >
                    <Text style={styles.primaryButtonText}>
                      Open Settings
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text style={styles.secondaryButtonText}>
                      Cancel
                    </Text>
                  </Pressable>
                </>
              ) : canRequest ? (
                <>
                  <Pressable
                    style={[styles.primaryButton, isRequesting && styles.disabledButton]}
                    onPress={handleRequestPermission}
                    disabled={isRequesting}
                    accessibilityRole="button"
                    accessibilityLabel="Allow photo access"
                  >
                    <Text style={[styles.primaryButtonText, isRequesting && styles.disabledButtonText]}>
                      {isRequesting ? 'Requesting...' : 'Allow Access'}
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={onClose}
                    disabled={isRequesting}
                    accessibilityRole="button"
                    accessibilityLabel="Not now"
                  >
                    <Text style={[styles.secondaryButtonText, isRequesting && styles.disabledButtonText]}>
                      Not Now
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={styles.secondaryButtonText}>
                    Close
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    ...shadows.large,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  disabledButton: {
    backgroundColor: colors.textDisabled,
  },
  disabledButtonText: {
    color: colors.background,
    opacity: 0.7,
  },
});

export default PermissionModal; 