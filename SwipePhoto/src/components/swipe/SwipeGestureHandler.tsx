/**
 * SwipeGestureHandler.tsx
 * 
 * Core swipe gesture recognition component using React Native Reanimated 3
 * and Gesture Handler for detecting and tracking horizontal swipe movements.
 */

import React, { useState, ReactNode, useCallback, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
  useAnimatedReaction,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ViewStyle, Dimensions, Alert } from 'react-native';
import { HapticFeedbackService, HapticFeedbackType } from '../../services/HapticFeedbackService';
import SwipeDirectionIndicators from './SwipeDirectionIndicators';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types for swipe detection
export type SwipeDirection = 'left' | 'right';
export type SwipeThreshold = {
  distance: number;
  velocity: number;
};

export interface SwipeGestureHandlerProps {
  children: ReactNode;
  onSwipeComplete?: (direction: SwipeDirection) => void;
  isEnabled?: boolean;
  threshold?: number;
  // New animation props for real-time feedback
  translateX?: Animated.SharedValue<number>;
  onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  hapticFeedback?: boolean; // Enable/disable haptic feedback (default: true)
  showIndicators?: boolean; // Show visual direction indicators (default: false)
}

// Default thresholds for swipe detection
const DEFAULT_THRESHOLDS: SwipeThreshold = {
  distance: 120, // Minimum horizontal distance to trigger swipe (increased for less sensitivity)
  velocity: 500, // Minimum velocity to trigger immediate swipe (slightly increased)
};

// Animation configuration for spring animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 100,
  mass: 1,
  overshootClamping: false, // Allow natural overshoot for better feel
  restSpeedThreshold: 0.1,
  restDisplacementThreshold: 0.1,
};

// Configuration for completed swipe animations (300ms duration using withTiming)
const COMPLETED_SWIPE_TIMING_CONFIG = {
  duration: 300, // Exact 300ms as specified in requirements
  easing: Easing.out(Easing.cubic), // Natural easing for swipe completion
};

// Configuration for snap-back animations (using withSpring)
const SNAPBACK_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 1,
  overshootClamping: false,
};

export const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = ({
  children,
  onSwipeComplete,
  isEnabled = true,
  threshold = 120,
  translateX: externalTranslateX,
  onSwipeProgress,
  onSwipeStart,
  onSwipeEnd,
  style,
  disabled = false,
  hapticFeedback = true,
  showIndicators = false,
}) => {
  // Create internal shared values for animation
  const internalTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  // Use external translateX if provided, otherwise use internal
  const activeTranslateX = externalTranslateX || internalTranslateX;

  // State for visual indicators
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<SwipeDirection | null>(null);
  
  const animatedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        translateX: activeTranslateX,
      })
    : children;

  // Helper function to trigger haptic feedback based on swipe direction
  const triggerHapticFeedback = (direction: SwipeDirection) => {
    'worklet';
    if (!hapticFeedback) return;
    
    const feedbackType: HapticFeedbackType = direction === 'left' ? 'delete' : 'keep';
    // Call async function in background (fire and forget)
    runOnJS(() => HapticFeedbackService.triggerFeedback(feedbackType))();
  };
  
  // Create optimized pan gesture with real-time animation
  const panGesture = Gesture.Pan()
    .enabled(!disabled && isEnabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      'worklet';
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onUpdate((event) => {
      'worklet';
      if (!isEnabled) return;

      // Update position
      activeTranslateX.value = event.translationX;
      translateY.value = event.translationY * 0.2; // Slight vertical movement

      // Calculate rotation based on horizontal movement
      const rotationAngle = interpolate(
        activeTranslateX.value,
        [-screenWidth / 2, 0, screenWidth / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );
      rotate.value = rotationAngle;

      // Calculate scale (slight shrink during drag)
      scale.value = interpolate(
        Math.abs(activeTranslateX.value),
        [0, screenWidth * 0.5],
        [1, 0.95],
        Extrapolate.CLAMP
      );

      // Calculate progress and direction for callbacks
      const progress = Math.abs(activeTranslateX.value) / threshold;
      const direction = activeTranslateX.value > 0 ? 'right' : 'left';

      if (onSwipeProgress && Math.abs(activeTranslateX.value) > 10) {
        runOnJS(onSwipeProgress)(Math.min(progress, 1), direction);
      }
    })
    .onEnd((event) => {
      'worklet';
      if (!isEnabled) return;

      const shouldSwipe = Math.abs(activeTranslateX.value) > threshold;
      const direction: SwipeDirection = activeTranslateX.value > 0 ? 'right' : 'left';

      if (shouldSwipe) {
        // Animate to completion
        isAnimating.value = true;
        const targetX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;
        
        activeTranslateX.value = withTiming(targetX, { duration: 300 }, (finished) => {
          'worklet';
          if (finished) {
            // IMPORTANT: First, run the JS thread logic to update the state (e.g., change the photo index)
            if (onSwipeComplete) {
              runOnJS(onSwipeComplete)(direction);
            }

            // After the state update is initiated, reset the UI thread values for the new card
            activeTranslateX.value = 0;
            translateY.value = 0;
            rotate.value = 0;
            scale.value = 1;
            isAnimating.value = false;
          }
        });
        
        translateY.value = withTiming(0, { duration: 300 });
        rotate.value = withTiming(direction === 'right' ? 20 : -20, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
      } else {
        // Snap back to center
        activeTranslateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        rotate.value = withSpring(0, { damping: 20, stiffness: 300 });
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        
        if (onSwipeProgress) {
          runOnJS(onSwipeProgress)(0, null);
        }
      }

      if (onSwipeEnd) {
        runOnJS(onSwipeEnd)();
      }
    });

  // Animated style for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: activeTranslateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[style, animatedStyle]}>
        {animatedChildren}
        {showIndicators && (
          <SwipeDirectionIndicators
            progress={currentProgress}
            direction={currentDirection}
            translateX={activeTranslateX}
            isActive={isAnimating.value}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
};

// Hook for easier integration
export const useSwipeGesture = (
  onSwipeComplete: (direction: SwipeDirection) => void,
  options?: {
    thresholds?: Partial<SwipeThreshold>;
    onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
  }
) => {
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  
  const { thresholds = {}, onSwipeProgress } = options || {};
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Track swipe progress
  useAnimatedReaction(
    () => {
      if (!onSwipeProgress) return null;
      
      const progress = Math.abs(translateX.value) / finalThresholds.distance;
      const direction: SwipeDirection = translateX.value > 0 ? 'right' : 'left';
      
      return {
        progress: Math.min(progress, 1),
        direction: Math.abs(translateX.value) > 10 ? direction : null,
      };
    },
    (result) => {
      if (result && onSwipeProgress) {
        runOnJS(onSwipeProgress)(result.progress, result.direction);
      }
    }
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      'worklet';
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      const shouldSwipe = 
        Math.abs(event.velocityX) > finalThresholds.velocity || 
        Math.abs(translateX.value) > finalThresholds.distance;
      
      const direction: SwipeDirection = translateX.value > 0 ? 'right' : 'left';
      
      if (shouldSwipe) {
        const targetPosition = direction === 'right' ? 500 : -500;
        translateX.value = withTiming(
          targetPosition,
          COMPLETED_SWIPE_TIMING_CONFIG,
          (finished) => {
            'worklet';
            if (finished) {
              runOnJS(onSwipeComplete)(direction);
              translateX.value = 0;
            }
          }
        );
      } else {
        translateX.value = withSpring(0, {
          ...SNAPBACK_CONFIG,
          velocity: event.velocityX,
        });
      }
      
      isGestureActive.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => {
    'worklet';
    
    // Calculate rotation using interpolation for smoother feel
    const rotation = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-20, 0, 20]
    );
    
    // Enhanced scale effect: lift up during gesture
    const gestureProgress = Math.abs(translateX.value) / 100;
    const scaleFromGesture = interpolate(
      gestureProgress,
      [0, 1],
      [1, 1.03]
    );
    const scale = isGestureActive.value ? scaleFromGesture : 1;
    
    // Opacity effect for cards being swiped away
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, 150, 300],
      [1, 0.8, 0.5]
    );
    
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
        { scale: withSpring(scale, { damping: 20, stiffness: 300, mass: 1 }) },
      ],
      opacity: opacity,
    };
  });

  return { 
    panGesture, 
    animatedStyles, 
    translateX, 
    isGestureActive,
    // Additional utilities for debugging
    getCurrentTranslation: () => translateX.value,
    isActive: () => isGestureActive.value,
  };
};

export default SwipeGestureHandler; 