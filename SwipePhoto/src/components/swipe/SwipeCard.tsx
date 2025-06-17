/**
 * SwipeCard.tsx
 * 
 * Advanced swipe card component with physics-based animations
 * including tilt, slide, and scaling effects with 300ms duration
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SwipeGestureHandler, SwipeDirection } from './SwipeGestureHandler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation constants following task specifications
const ANIMATION_CONFIG = {
  duration: 300, // Exactly 300ms as specified
  maxRotation: 20, // 15-20 degrees max rotation as specified
  scaleRange: [1, 1.05], // Subtle scaling effect
  damping: 15,
  stiffness: 100,
};

export interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeComplete: (direction: SwipeDirection) => void;
  onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeComplete,
  onSwipeProgress,
  style,
  disabled = false,
}) => {
  
  // Create animated styles based on gesture data
  const createAnimatedStyles = (
    translateX: Animated.SharedValue<number>,
    isGestureActive: Animated.SharedValue<boolean>
  ) => {
    return useAnimatedStyle(() => {
      // Calculate rotation based on horizontal movement (tilt effect)
      const rotation = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-ANIMATION_CONFIG.maxRotation, 0, ANIMATION_CONFIG.maxRotation],
        Extrapolate.CLAMP
      );

      // Calculate scale effect during active gesture
      const scale = interpolate(
        Math.abs(translateX.value),
        [0, 50],
        ANIMATION_CONFIG.scaleRange,
        Extrapolate.CLAMP
      );

      // Apply additional scale boost when gesture is active
      const activeScale = isGestureActive.value ? 1.02 : 1;
      const finalScale = scale * activeScale;

      // Calculate opacity for smooth fade effect
      const opacity = interpolate(
        Math.abs(translateX.value),
        [0, SCREEN_WIDTH * 0.8],
        [1, 0.7],
        Extrapolate.CLAMP
      );

      return {
        transform: [
          { translateX: translateX.value },
          { rotate: `${rotation}deg` },
          { scale: finalScale },
        ],
        opacity,
      };
    });
  };

  // Handle swipe completion with smooth animation
  const handleSwipeComplete = (direction: SwipeDirection) => {
    'worklet';
    // Run callback on JS thread
    runOnJS(onSwipeComplete)(direction);
  };

  // Handle swipe progress updates
  const handleSwipeProgress = (progress: number, direction: SwipeDirection | null) => {
    'worklet';
    if (onSwipeProgress) {
      runOnJS(onSwipeProgress)(progress, direction);
    }
  };

  return (
    <SwipeGestureHandler
      onSwipeComplete={handleSwipeComplete}
      onSwipeProgress={handleSwipeProgress}
      animationConfig={{
        duration: ANIMATION_CONFIG.duration,
        damping: ANIMATION_CONFIG.damping,
        stiffness: ANIMATION_CONFIG.stiffness,
      }}
      disabled={disabled}
      createAnimatedStyles={createAnimatedStyles}
    >
      <Animated.View style={[styles.card, style]}>
        {children}
      </Animated.View>
    </SwipeGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    shadowColor: '#00FF41',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default SwipeCard; 