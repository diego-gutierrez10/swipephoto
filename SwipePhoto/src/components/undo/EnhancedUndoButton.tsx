/**
 * EnhancedUndoButton.tsx
 * 
 * Enhanced undo button with advanced animations, haptic feedback,
 * and smooth interaction states using the custom useButtonAnimation hook.
 */

import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  ViewStyle,
  Animated,
  useWindowDimensions,
  Platform,
  View,
} from 'react-native';
import { useUndo } from '../../hooks/useUndo';
import { useButtonAnimation } from '../../hooks/useButtonAnimation';
import { HapticFeedbackService } from '../../services/HapticFeedbackService';

// Enhanced Undo icon component with press animation
const AnimatedUndoIcon: React.FC<{ 
  size?: number; 
  color?: string; 
  disabled?: boolean;
  pressScale?: Animated.Value;
}> = ({ 
  size = 24, 
  color = '#FFFFFF',
  disabled = false,
  pressScale
}) => {
  const iconStyle = {
    fontSize: size,
    color: disabled ? '#666666' : color,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    lineHeight: size,
    transform: pressScale ? [{ scale: pressScale }] : [],
  };

  return (
    <Animated.Text style={iconStyle} accessible={false}>
      ↶
    </Animated.Text>
  );
};

interface EnhancedUndoButtonProps {
  /**
   * Custom positioning overrides
   */
  position?: {
    bottom?: number;
    right?: number;
  };
  
  /**
   * Custom size override
   */
  size?: number;
  
  /**
   * Custom styling
   */
  style?: ViewStyle;
  
  /**
   * Whether to use haptic feedback on press
   */
  enableHaptics?: boolean;
  
  /**
   * Animation configuration
   */
  animationConfig?: {
    duration?: number;
    pressedScale?: number;
    respectReduceMotion?: boolean;
  };
  
  /**
   * Test identifier for testing
   */
  testID?: string;
}

export const EnhancedUndoButton: React.FC<EnhancedUndoButtonProps> = ({
  position,
  size,
  style,
  enableHaptics = true,
  animationConfig = {},
  testID = 'enhanced-undo-button',
}) => {
  const { width } = useWindowDimensions();
  
  // Connect to undo functionality
  const {
    canUndo,
    undoCount,
    undo,
    lastAction,
  } = useUndo();

  // Setup button animations
  const {
    animationStyle,
    touchHandlers,
    animationState,
    animateIn,
    animateOut,
  } = useButtonAnimation({
    duration: 150,
    pressedScale: 0.92,
    enableHaptics,
    respectReduceMotion: true,
    ...animationConfig,
  });

  // Handle visibility animations based on canUndo state
  useEffect(() => {
    if (canUndo && !animationState.isVisible) {
      animateIn();
    } else if (!canUndo && animationState.isVisible) {
      animateOut();
    }
  }, [canUndo, animationState.isVisible, animateIn, animateOut]);

  // Handle undo action with enhanced feedback
  const handleUndo = useCallback(async () => {
    if (!canUndo || animationState.isAnimating) return;

    // Provide haptic feedback with error handling
    if (enableHaptics) {
      try {
        await HapticFeedbackService.triggerDeleteFeedback();
      } catch (error) {
        // Haptic feedback is optional, fail silently
        if (__DEV__) {
          console.warn('🔄 EnhancedUndoButton: Haptic feedback failed:', error);
        }
      }
    }

    // Perform undo
    const undoneAction = undo();
    
    if (undoneAction && __DEV__) {
      console.log('🔄 EnhancedUndoButton: Undo performed', {
        actionId: undoneAction.id,
        photoId: undoneAction.photoId,
        direction: undoneAction.direction,
        remainingCount: undoCount - 1,
        animationState: animationState,
      });
    }
  }, [canUndo, undo, undoCount, enableHaptics, animationState]);

  // Calculate responsive size based on screen dimensions
  const responsiveSize = size || (width < 768 ? 48 : 56);
  const responsiveBottom = position?.bottom || (width < 768 ? 16 : 24);
  const responsiveRight = position?.right || (width < 768 ? 16 : 24);

  // Don't render if no undo actions are available and not animating
  if (!canUndo && !animationState.isVisible && !animationState.isAnimating) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: responsiveSize,
          height: responsiveSize,
          borderRadius: responsiveSize / 2,
          bottom: responsiveBottom,
          right: responsiveRight,
        },
        animationStyle,
        style,
      ]}
      pointerEvents={canUndo ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.button,
          {
            width: responsiveSize,
            height: responsiveSize,
            borderRadius: responsiveSize / 2,
          },
        ]}
        {...touchHandlers}
        onTouchEnd={handleUndo}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Undo last action${lastAction ? `: ${lastAction.direction} swipe on photo ${lastAction.photoId}` : ''}`}
        accessibilityHint={`Undoes your last swipe action. ${undoCount} action${undoCount !== 1 ? 's' : ''} available to undo.`}
        accessibilityState={{
          disabled: !canUndo,
        }}
        testID={testID}
      >
        <AnimatedUndoIcon 
          size={responsiveSize * 0.4} 
          color="#FFFFFF"
          disabled={!canUndo}
        />
        
        {/* Enhanced badge showing undo count with animation */}
        {undoCount > 1 && (
          <Animated.View style={[styles.badge, animationStyle]}>
            <Animated.Text style={styles.badgeText}>
              {undoCount}
            </Animated.Text>
          </Animated.View>
        )}
        
        {/* Ripple effect overlay for press feedback */}
        {animationState.isPressed && (
          <Animated.View 
            style={[
              styles.rippleEffect,
              {
                width: responsiveSize,
                height: responsiveSize,
                borderRadius: responsiveSize / 2,
              },
            ]} 
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000, // Ensure it's above other elements
  },
  button: {
    backgroundColor: '#007AFF', // iOS blue for primary action
    justifyContent: 'center',
    alignItems: 'center',
    
    // Enhanced shadow for better visual hierarchy
    elevation: 12, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    
    // Platform-specific adjustments
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30', // Red badge for count
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    
    // Badge shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rippleEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: 0,
    left: 0,
  },
});

export default EnhancedUndoButton; 