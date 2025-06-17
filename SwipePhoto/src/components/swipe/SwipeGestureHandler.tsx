/**
 * SwipeGestureHandler.tsx
 * 
 * Core swipe gesture recognition component using React Native Reanimated 3
 * and Gesture Handler for detecting and tracking horizontal swipe movements.
 */

import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

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
  thresholds?: Partial<SwipeThreshold>;
  style?: ViewStyle;
  disabled?: boolean;
}

// Default thresholds for swipe detection
const DEFAULT_THRESHOLDS: SwipeThreshold = {
  distance: 100, // Minimum horizontal distance to trigger swipe
  velocity: 800, // Minimum velocity to trigger immediate swipe
};

// Animation configuration for spring animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 100,
  overshootClamping: true,
  restSpeedThreshold: 0.1,
  restDisplacementThreshold: 0.1,
};

export const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = ({
  children,
  onSwipeComplete,
  onSwipeProgress,
  thresholds = {},
  style,
  disabled = false,
}) => {
  // Merge thresholds with defaults
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  // Shared values for gesture tracking
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const gestureVelocity = useSharedValue(0);
  
  // Track swipe progress and call callback
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
        // Complete swipe with spring animation
        const targetPosition = direction === 'right' ? 500 : -500;
        
        translateX.value = withSpring(
          targetPosition,
          {
            ...SPRING_CONFIG,
            velocity: event.velocityX,
          },
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
        // Return to center with spring animation
        translateX.value = withSpring(0, {
          ...SPRING_CONFIG,
          velocity: event.velocityX,
          stiffness: 200, // Higher stiffness for snap-back
        });
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
    
    // Calculate rotation for natural card feel (max 20 degrees)
    const rotation = (translateX.value / 20);
    const clampedRotation = Math.max(-20, Math.min(20, rotation));
    
    // Add subtle scale effect during active gesture
    const scale = isGestureActive.value ? 0.98 : 1;
    
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${clampedRotation}deg` },
        { scale: withSpring(scale, { damping: 20, stiffness: 300 }) },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[style, animatedStyles]}>
        {children}
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
        translateX.value = withSpring(
          targetPosition,
          {
            ...SPRING_CONFIG,
            velocity: event.velocityX,
          },
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
          ...SPRING_CONFIG,
          velocity: event.velocityX,
          stiffness: 200,
        });
      }
      
      isGestureActive.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => {
    'worklet';
    
    const rotation = (translateX.value / 20);
    const clampedRotation = Math.max(-20, Math.min(20, rotation));
    const scale = isGestureActive.value ? 0.98 : 1;
    
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${clampedRotation}deg` },
        { scale: withSpring(scale, { damping: 20, stiffness: 300 }) },
      ],
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