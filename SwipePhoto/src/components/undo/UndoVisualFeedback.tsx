/**
 * UndoVisualFeedback.tsx
 * 
 * Component providing visual feedback for undo actions.
 * Includes highlight effects, transition animations, and accessibility features.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { AudioFeedbackService } from '../../services/AudioFeedbackService';

export interface UndoVisualFeedbackProps {
  /**
   * Whether the feedback is currently visible/active
   */
  visible: boolean;
  
  /**
   * Type of undo feedback to display
   */
  type: 'card-restored' | 'action-undone' | 'stack-cleared';
  
  /**
   * Item that was restored (for display)
   */
  restoredItem?: {
    id: string;
    name?: string;
    type?: string;
  };
  
  /**
   * Position to animate from/to
   */
  animationOrigin?: {
    x: number;
    y: number;
  };
  
  /**
   * Callback when feedback animation completes
   */
  onComplete?: () => void;
  
  /**
   * Enable sound effects
   */
  enableSound?: boolean;
  
  /**
   * Enable reduced motion mode
   */
  reducedMotion?: boolean;
  
  /**
   * Custom styling
   */
  style?: any;
}

export const UndoVisualFeedback: React.FC<UndoVisualFeedbackProps> = ({
  visible,
  type,
  restoredItem,
  animationOrigin,
  onComplete,
  enableSound = true,
  reducedMotion = false,
  style,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Animation values
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const positionY = useRef(new Animated.Value(50)).current;
  const fadeOpacity = useRef(new Animated.Value(0)).current;
  
  // State for accessibility
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(reducedMotion);
  
  /**
   * Check accessibility preferences
   */
  useEffect(() => {
    const checkAccessibilityPreferences = async () => {
      try {
        const isReducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReducedMotionEnabled(isReducedMotionEnabled || reducedMotion);
      } catch (error) {
        // Fallback to prop value
        setIsReducedMotionEnabled(reducedMotion);
      }
    };

    checkAccessibilityPreferences();
  }, [reducedMotion]);

  /**
   * Main animation sequence
   */
  const runFeedbackAnimation = useCallback(() => {
    if (!visible) return;

    // Play sound effect if enabled
    if (enableSound) {
      AudioFeedbackService.playFeedback('undo').catch(console.warn);
    }

    if (isReducedMotionEnabled) {
      // Simplified animation for reduced motion
      Animated.sequence([
        Animated.timing(fadeOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    } else {
      // Full animation sequence
      Animated.parallel([
        // Fade in
        Animated.timing(fadeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale up
        Animated.spring(scaleAnimation, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        // Slide up
        Animated.spring(positionY, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        // Highlight pulse
        Animated.sequence([
          Animated.timing(highlightOpacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(highlightOpacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(highlightOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Hold for visibility
        setTimeout(() => {
          // Fade out
          Animated.parallel([
            Animated.timing(fadeOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 0.9,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete?.();
          });
        }, 1200);
      });
    }
  }, [
    visible,
    enableSound,
    isReducedMotionEnabled,
    fadeOpacity,
    scaleAnimation,
    positionY,
    highlightOpacity,
    onComplete,
  ]);

  /**
   * Reset animations when visibility changes
   */
  useEffect(() => {
    if (visible) {
      // Reset animation values
      highlightOpacity.setValue(0);
      scaleAnimation.setValue(0.8);
      positionY.setValue(50);
      fadeOpacity.setValue(0);
      
      // Start animation
      runFeedbackAnimation();
    }
  }, [visible, runFeedbackAnimation]);

  /**
   * Get feedback message based on type
   */
  const getFeedbackMessage = (): string => {
    switch (type) {
      case 'card-restored':
        return restoredItem?.name 
          ? `${restoredItem.name} restored`
          : 'Item restored to original position';
      case 'action-undone':
        return 'Last action undone';
      case 'stack-cleared':
        return 'Undo history cleared';
      default:
        return 'Action undone';
    }
  };

  /**
   * Get icon based on feedback type
   */
  const getIcon = (): string => {
    switch (type) {
      case 'card-restored':
        return '↺';
      case 'action-undone':
        return '⟲';
      case 'stack-cleared':
        return '✓';
      default:
        return '↺';
    }
  };

  if (!visible) {
    return null;
  }

  const responsiveSize = Math.min(screenWidth, screenHeight) * 0.8;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeOpacity,
          transform: [
            { scale: scaleAnimation },
            { translateY: positionY },
          ],
        },
        animationOrigin && {
          position: 'absolute',
          left: animationOrigin.x - responsiveSize / 2,
          top: animationOrigin.y - 40,
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel={getFeedbackMessage()}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Highlight background */}
      <Animated.View
        style={[
          styles.highlightBackground,
          {
            opacity: highlightOpacity,
          },
        ]}
      />
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.icon} accessible={false}>
          {getIcon()}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {getFeedbackMessage()}
        </Text>
        
        {/* Additional info for debugging */}
        {__DEV__ && restoredItem && (
          <Text style={styles.debugInfo}>
            ID: {restoredItem.id}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -40 }],
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 240,
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  highlightBackground: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    zIndex: -1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  debugInfo: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});

export default UndoVisualFeedback; 