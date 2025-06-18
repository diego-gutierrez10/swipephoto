/**
 * usePhotoTransition.ts
 * 
 * Custom hook for smooth photo transition animations with fade-in and scale effects.
 * Includes accessibility support for reduced motion preferences.
 * 
 * Features:
 * - 200ms fade-in animation (opacity 0 to 1)
 * - Subtle scale animation (98% to 100%)
 * - Respects reduced motion accessibility settings
 * - Proper cleanup to prevent memory leaks
 * - Smooth easing using bezier curves
 */

import { useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface PhotoTransitionOptions {
  /** Duration of animation in milliseconds (default: 200) */
  duration?: number;
  /** Initial opacity value (default: 0) */
  initialOpacity?: number;
  /** Final opacity value (default: 1) */
  finalOpacity?: number;
  /** Initial scale value (default: 0.98) */
  initialScale?: number;
  /** Final scale value (default: 1) */
  finalScale?: number;
  /** Whether to animate immediately on mount (default: false) */
  animateOnMount?: boolean;
}

export interface PhotoTransitionReturn {
  /** Animated style object to apply to component */
  animatedStyle: any;
  /** Function to trigger animation manually */
  startAnimation: () => void;
  /** Function to reset animation to initial state */
  resetAnimation: () => void;
  /** Function to set animation to final state instantly */
  setFinal: () => void;
  /** Current animation state */
  isAnimating: boolean;
}

export const usePhotoTransition = (
  isLoaded: boolean,
  options: PhotoTransitionOptions = {}
): PhotoTransitionReturn => {
  const {
    duration = 200,
    initialOpacity = 0,
    finalOpacity = 1,
    initialScale = 0.98,
    finalScale = 1,
    animateOnMount = false,
  } = options;

  // Shared values for animations
  const opacity = useSharedValue(initialOpacity);
  const scale = useSharedValue(initialScale);
  const isAnimating = useSharedValue(false);

  // Check for reduced motion preference
  const checkReducedMotion = useCallback(async () => {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false;
    }
  }, []);

  // Animation function with accessibility support
  const startAnimation = useCallback(async () => {
    const prefersReducedMotion = await checkReducedMotion();
    const animationDuration = prefersReducedMotion ? 0 : duration;
    
    // Set animating state
    isAnimating.value = true;

    // Define easing curve for smooth animation
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);

    // Animate opacity and scale simultaneously
    opacity.value = withTiming(finalOpacity, {
      duration: animationDuration,
      easing,
    });

    scale.value = withTiming(finalScale, {
      duration: animationDuration,
      easing,
    }, (finished) => {
      if (finished) {
        runOnJS(() => {
          isAnimating.value = false;
        })();
      }
    });
  }, [duration, finalOpacity, finalScale, checkReducedMotion, opacity, scale, isAnimating]);

  // Reset animation to initial state
  const resetAnimation = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(scale);
    opacity.value = initialOpacity;
    scale.value = initialScale;
    isAnimating.value = false;
  }, [initialOpacity, initialScale, opacity, scale, isAnimating]);

  // Set to final state instantly
  const setFinal = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(scale);
    opacity.value = finalOpacity;
    scale.value = finalScale;
    isAnimating.value = false;
  }, [finalOpacity, finalScale, opacity, scale, isAnimating]);

  // Trigger animation when isLoaded changes
  useEffect(() => {
    if (isLoaded) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [isLoaded, startAnimation, resetAnimation]);

  // Trigger animation on mount if specified
  useEffect(() => {
    if (animateOnMount) {
      startAnimation();
    }
  }, [animateOnMount, startAnimation]);

  // Cleanup function to cancel animations
  useEffect(() => {
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [opacity, scale]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return {
    animatedStyle,
    startAnimation,
    resetAnimation,
    setFinal,
    isAnimating: isAnimating.value,
  };
};

export default usePhotoTransition; 