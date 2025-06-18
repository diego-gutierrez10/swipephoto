/**
 * SwipeGestureHandler.tsx
 * 
 * Core swipe gesture recognition component using React Native Reanimated 3
 * and Gesture Handler for detecting and tracking horizontal swipe movements.
 */

import React, { useState } from 'react';
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
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';
import { HapticFeedbackService, HapticFeedbackType } from '../../services/HapticFeedbackService';
import SwipeDirectionIndicators from './SwipeDirectionIndicators';

// Types for swipe detection
export type SwipeDirection = 'left' | 'right';
export type SwipeThreshold = {
  distance: number;
  velocity: number;
};

export interface SwipeGestureHandlerProps {
  children: React.ReactNode;
  onSwipeComplete: (direction: SwipeDirection) => void;
  onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
  onSwipeCancel?: () => void;
  thresholds?: Partial<SwipeThreshold>;
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
  onSwipeProgress,
  onSwipeCancel,
  thresholds = {},
  style,
  disabled = false,
  hapticFeedback = true,
  showIndicators = false,
}) => {
  // Merge thresholds with defaults
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  // Shared values for gesture tracking
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const gestureVelocity = useSharedValue(0);
  
  // State for visual indicators
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<SwipeDirection | null>(null);
  
  // Helper function to trigger haptic feedback based on swipe direction
  const triggerHapticFeedback = (direction: SwipeDirection) => {
    'worklet';
    if (!hapticFeedback) return;
    
    const feedbackType: HapticFeedbackType = direction === 'left' ? 'delete' : 'keep';
    // Call async function in background (fire and forget)
    runOnJS(() => HapticFeedbackService.triggerFeedback(feedbackType))();
  };
  
  // Track swipe progress and call callback
  useAnimatedReaction(
    () => {
      const progress = Math.abs(translateX.value) / finalThresholds.distance;
      const direction: SwipeDirection = translateX.value > 0 ? 'right' : 'left';
      
      return {
        progress: Math.min(progress, 1),
        direction: Math.abs(translateX.value) > 10 ? direction : null,
      };
    },
    (result) => {
      if (result) {
        // Update indicators state if enabled
        if (showIndicators) {
          runOnJS(setCurrentProgress)(result.progress);
          runOnJS(setCurrentDirection)(result.direction);
        }
        
        // Call progress callback if provided
        if (onSwipeProgress) {
          runOnJS(onSwipeProgress)(result.progress, result.direction);
        }
      }
    }
  );

  // Create optimized pan gesture with proper velocity tracking
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10]) // Reduce unintentional triggers
    .failOffsetY([-20, 20]) // Fail if vertical movement is too large
    .onBegin(() => {
      'worklet';
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      'worklet';
      // Use direct value assignment for <100ms response
      translateX.value = event.translationX;
      gestureVelocity.value = event.velocityX;
    })
    .onEnd((event) => {
      'worklet';
      const shouldSwipe = 
        Math.abs(event.velocityX) > finalThresholds.velocity || 
        Math.abs(translateX.value) > finalThresholds.distance;
      
      const direction: SwipeDirection = translateX.value > 0 ? 'right' : 'left';
      
      if (shouldSwipe) {
        // Complete swipe with timing animation (300ms duration)
        const targetPosition = direction === 'right' ? 500 : -500;
        
        // Trigger haptic feedback immediately when swipe is confirmed
        triggerHapticFeedback(direction);
        
        translateX.value = withTiming(
          targetPosition,
          COMPLETED_SWIPE_TIMING_CONFIG,
          (finished) => {
            'worklet';
            if (finished) {
              runOnJS(onSwipeComplete)(direction);
              // Reset position after callback
              translateX.value = 0;
            }
          }
        );
      } else {
        // Return to center with snap-back animation
        translateX.value = withSpring(0, {
          ...SNAPBACK_CONFIG,
          velocity: event.velocityX,
        });
        
        // Call cancel callback if provided
        if (onSwipeCancel) {
          runOnJS(onSwipeCancel)();
        }
      }
      
      isGestureActive.value = false;
    })
    .onFinalize(() => {
      'worklet';
      isGestureActive.value = false;
    });

  // Optimized animated styles using worklets
  const animatedStyles = useAnimatedStyle(() => {
    'worklet';
    
    // Calculate rotation for natural card feel (max ±20 degrees)
    // Use interpolation for smoother rotation mapping
    const rotation = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-20, 0, 20]
    );
    
    // Enhanced scale effect: lift up during gesture (1.02-1.05 range)
    const gestureProgress = Math.abs(translateX.value) / 100;
    const scaleFromGesture = interpolate(
      gestureProgress,
      [0, 1],
      [1, 1.03] // Subtle lift effect
    );
    const scale = isGestureActive.value ? scaleFromGesture : 1;
    
    // Add subtle opacity effect for cards being swiped away
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[style, animatedStyles]}>
        {children}
        {showIndicators && (
          <SwipeDirectionIndicators
            progress={currentProgress}
            direction={currentDirection}
            translateX={translateX}
            isActive={isGestureActive.value}
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