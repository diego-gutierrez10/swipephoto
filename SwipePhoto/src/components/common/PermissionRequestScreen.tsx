import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../constants/theme';
import { PermissionStatus, PermissionRequestOptions } from '../../types';
import { usePhotoPermissions } from '../../hooks';
import PermissionIcon from '../ui/PermissionIcon';

interface PermissionRequestScreenProps {
  onPermissionGranted?: (status: PermissionStatus) => void;
  onPermissionDenied?: (status: PermissionStatus) => void;
  onSkip?: () => void;
  options?: PermissionRequestOptions;
  title?: string;
  description?: string;
  showSkipOption?: boolean;
}

/**
 * Permission request screen that guides users through granting photo access
 * Follows platform guidelines and accessibility best practices
 */
export const PermissionRequestScreen: React.FC<PermissionRequestScreenProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  onSkip,
  options = {},
  title = "Access Your Photos",
  description = "SwipePhoto helps you organize your photos locally on your device. Your photos stay completely private and are never uploaded or shared.",
  showSkipOption = true,
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

  const [currentView, setCurrentView] = useState<'request' | 'loading' | 'success' | 'denied' | 'blocked'>('request');

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    if (isLoading) return;
    
    setCurrentView('loading');
    
    try {
      const result = await requestPermissions(options);
      
      if (result.status === 'granted' || result.status === 'limited') {
        setCurrentView('success');
        onPermissionGranted?.(result.status);
      } else if (result.status === 'blocked') {
        setCurrentView('blocked');
        onPermissionDenied?.(result.status);
      } else {
        setCurrentView('denied');
        onPermissionDenied?.(result.status);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setCurrentView('denied');
      onPermissionDenied?.('unavailable');
    }
  }, [isLoading, requestPermissions, options, onPermissionGranted, onPermissionDenied]);

  // Handle settings navigation
  const handleOpenSettings = useCallback(async () => {
    await openSettings();
  }, [openSettings]);

  // Handle skip
  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  // Render different views based on current state
  const renderContent = () => {
    switch (currentView) {
      case 'loading':
        return renderLoadingView();
      case 'success':
        return renderSuccessView();
      case 'denied':
        return renderDeniedView();
      case 'blocked':
        return renderBlockedView();
      default:
        return renderRequestView();
    }
  };

  const renderRequestView = () => (
    <>
      <View style={styles.iconContainer}>
        <PermissionIcon status="undetermined" size={100} />
      </View>
      
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      
      <Text style={styles.description} accessibilityLabel={`${description}. This explains why the app needs photo access.`}>
        {description}
      </Text>

      <View style={styles.benefitsList}>
        <BenefitItem 
          icon="finger-print" 
          text="100% Private Processing" 
          description="All photo organization happens locally on your device"
        />
        <BenefitItem 
          icon="shield-checkmark" 
          text="No Data Collection" 
          description="We never access, store, or share your personal photos"
        />
        <BenefitItem 
          icon="albums" 
          text="Smart Organization" 
          description="Swipe photos into custom categories for easy management"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.primaryButton, !canRequest && styles.disabledButton]}
          onPress={handleRequestPermission}
          disabled={!canRequest || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Allow photo access"
          accessibilityHint="Grants SwipePhoto permission to organize your photos locally"
        >
          <Text style={[styles.primaryButtonText, !canRequest && styles.disabledButtonText]}>
            Allow Photo Access
          </Text>
        </Pressable>

        {showSkipOption && (
          <Pressable
            style={styles.secondaryButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
            accessibilityHint="Continue without granting photo access"
          >
            <Text style={styles.secondaryButtonText}>
              Skip for Now
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );

  const renderLoadingView = () => (
    <>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Requesting Permission...</Text>
      <Text style={styles.description}>
        Please check the system dialog and grant permission to continue.
      </Text>
    </>
  );

  const renderSuccessView = () => (
    <>
      <View style={styles.iconContainer}>
        <PermissionIcon status={status} size={100} />
      </View>
      
      <Text style={styles.title}>
        {status === 'limited' ? 'Limited Access Granted!' : 'Access Granted!'}
      </Text>
      <Text style={styles.description}>
        {status === 'limited' 
          ? 'You can now organize your selected photos. You can add more photos anytime in Settings.'
          : 'You can now organize all your photos with SwipePhoto!'
        }
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => onPermissionGranted?.(status)}
        accessibilityRole="button"
        accessibilityLabel="Continue to app"
      >
        <Text style={styles.primaryButtonText}>
          Get Started
        </Text>
      </Pressable>
    </>
  );

  const renderDeniedView = () => (
    <>
      <View style={styles.iconContainer}>
        <PermissionIcon status="denied" size={100} />
      </View>
      
      <Text style={styles.title}>Permission Denied</Text>
      <Text style={styles.description}>
        SwipePhoto needs photo access to organize your images. You can try again or grant permission in Settings.
      </Text>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.primaryButton}
          onPress={handleRequestPermission}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={handleOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Text style={styles.secondaryButtonText}>
            Open Settings
          </Text>
        </Pressable>
      </View>
    </>
  );

  const renderBlockedView = () => (
    <>
      <View style={styles.iconContainer}>
        <PermissionIcon status="blocked" size={100} />
      </View>
      
      <Text style={styles.title}>Permission Required</Text>
      <Text style={styles.description}>
        Photo access has been blocked. Please enable it in Settings to use SwipePhoto's organization features.
      </Text>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.primaryButton}
          onPress={handleOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Text style={styles.primaryButtonText}>
            Open Settings
          </Text>
        </Pressable>

        {showSkipOption && (
          <Pressable
            style={styles.secondaryButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.secondaryButtonText}>
              Skip for Now
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for benefit items
const BenefitItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  description: string;
}> = ({ icon, text, description }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIcon}>
      <Ionicons name={icon} size={24} color={colors.primary} />
    </View>
    <View style={styles.benefitTextContainer}>
      <Text style={styles.benefitText}>{text}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsList: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.medium,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
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

export default PermissionRequestScreen; 