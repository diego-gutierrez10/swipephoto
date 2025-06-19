/**
 * useButtonAnimation.ts
 * 
 * Custom hook for handling button animations with scale transform,
 * touch feedback, and accessibility compliance.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Animated, Easing, AccessibilityInfo } from 'react-native';

export interface ButtonAnimationConfig {
  /**
   * Animation duration in milliseconds
   */
  duration?: number;
  
  /**
   * Scale factor when pressed (0.95 = 95% of original size)
   */
  pressedScale?: number;
  
  /**
   * Enable haptic feedback
   */
  enableHaptics?: boolean;
  
  /**
   * Whether to respect reduce motion preferences
   */
  respectReduceMotion?: boolean;
}

export interface ButtonAnimationReturn {
  /**
   * Animated scale value for transform
   */
  scale: Animated.Value;
  
  /**
   * Function to trigger press animation
   */
  animatePress: (pressed: boolean) => void;
  
  /**
   * Function to trigger entrance animation
   */
  animateIn: () => Promise<void>;
  
  /**
   * Function to trigger exit animation
   */
  animateOut: () => Promise<void>;
  
  /**
   * Animated style for transform
   */
  animationStyle: {
    opacity: Animated.Value;
    transform: { scale: Animated.Value }[];
  };
  
  /**
   * Touch handlers for press feedback
   */
  touchHandlers: {
    onPressIn: () => void;
    onPressOut: () => void;
  };
  
  /**
   * Current animation state
   */
  animationState: {
    isPressed: boolean;
    isVisible: boolean;
    isAnimating: boolean;
  };
}

const DEFAULT_CONFIG = {
  duration: 150,
  pressedScale: 0.95,
  enableHaptics: true,
  respectReduceMotion: true,
};

/**
 * Hook for button press animations with accessibility support
 */
export const useButtonAnimation = (
  config: ButtonAnimationConfig = {}
): ButtonAnimationReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Animation values
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // State tracking
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  // Check for reduce motion preference
  useEffect(() => {
    if (finalConfig.respectReduceMotion) {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setReduceMotionEnabled(enabled || false);
      });

      // Listen for changes in reduce motion preference
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setReduceMotionEnabled
      );

      return () => subscription?.remove();
    }
  }, [finalConfig.respectReduceMotion]);

  // Calculate animation duration based on reduce motion preference
  const getAnimationDuration = useCallback(() => {
    return reduceMotionEnabled ? 0 : finalConfig.duration;
  }, [reduceMotionEnabled, finalConfig.duration]);

  /**
   * Animate button press state
   */
  const animatePress = useCallback((pressed: boolean) => {
    if (isAnimating) return; // Prevent conflicting animations
    
    const targetScale = pressed ? finalConfig.pressedScale : 1;
    const duration = getAnimationDuration();
    
    setIsPressed(pressed);
    
    if (duration === 0) {
      scale.setValue(targetScale);
      return;
    }

    Animated.timing(scale, {
      toValue: targetScale,
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [
    scale, 
    finalConfig.pressedScale, 
    getAnimationDuration, 
    isAnimating
  ]);

  /**
   * Animate button entrance
   */
  const animateIn = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      setIsVisible(true);
      setIsAnimating(true);
      
      const duration = getAnimationDuration();
      
      if (duration === 0) {
        opacity.setValue(1);
        scale.setValue(1);
        setIsAnimating(false);
        resolve();
        return;
      }

      // Start with button slightly smaller and invisible
      opacity.setValue(0);
      scale.setValue(0.8);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 1.2, // Slightly longer for smooth fade
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        setIsAnimating(false);
        if (finished) resolve();
      });
    });
  }, [opacity, scale, getAnimationDuration]);

  /**
   * Animate button exit
   */
  const animateOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      setIsVisible(false);
      setIsAnimating(true);
      
      const duration = getAnimationDuration();
      
      if (duration === 0) {
        opacity.setValue(0);
        scale.setValue(0.8);
        setIsAnimating(false);
        resolve();
        return;
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.8, // Faster exit
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: duration * 0.8,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        setIsAnimating(false);
        if (finished) resolve();
      });
    });
  }, [opacity, scale, getAnimationDuration]);

  /**
   * Touch handlers for press feedback
   */
  const handlePressIn = useCallback(() => {
    animatePress(true);
  }, [animatePress]);

  const handlePressOut = useCallback(() => {
    animatePress(false);
  }, [animatePress]);

  // Combined animated style
  const animationStyle = {
    opacity,
    transform: [{ scale }],
  };

  const touchHandlers = {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  };

  const animationState = {
    isPressed,
    isVisible,
    isAnimating,
  };

  return {
    scale,
    animatePress,
    animateIn,
    animateOut,
    animationStyle,
    touchHandlers,
    animationState,
  };
};

export default useButtonAnimation; 