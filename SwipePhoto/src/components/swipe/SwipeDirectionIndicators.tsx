/**
 * SwipeDirectionIndicators.tsx
 * 
 * Visual indicators that show swipe direction and action during gesture.
 * Displays color overlays and icons based on swipe progress and direction.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { SwipeDirection } from './SwipeGestureHandler';

export interface SwipeDirectionIndicatorsProps {
  progress: number; // 0 to 1
  direction: SwipeDirection | null;
  translateX: Animated.SharedValue<number>;
  isActive: boolean;
}

export const SwipeDirectionIndicators: React.FC<SwipeDirectionIndicatorsProps> = ({
  progress,
  direction,
  translateX,
  isActive,
}) => {
  
  // Animated styles for left indicator (DELETE)
  const leftIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    
    const isLeftSwipe = direction === 'left';
    const opacity = isLeftSwipe ? interpolate(progress, [0, 0.3, 1], [0, 0.8, 1]) : 0;
    const scale = isLeftSwipe ? interpolate(progress, [0, 0.5, 1], [0.8, 1, 1.1]) : 0.8;
    
    return {
      opacity: withSpring(opacity, { damping: 20, stiffness: 300 }),
      transform: [{ scale: withSpring(scale, { damping: 15, stiffness: 200 }) }],
    };
  });

  // Animated styles for right indicator (KEEP)
  const rightIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    
    const isRightSwipe = direction === 'right';
    const opacity = isRightSwipe ? interpolate(progress, [0, 0.3, 1], [0, 0.8, 1]) : 0;
    const scale = isRightSwipe ? interpolate(progress, [0, 0.5, 1], [0.8, 1, 1.1]) : 0.8;
    
    return {
      opacity: withSpring(opacity, { damping: 20, stiffness: 300 }),
      transform: [{ scale: withSpring(scale, { damping: 15, stiffness: 200 }) }],
    };
  });

  // Animated styles for background overlay
  const overlayStyle = useAnimatedStyle(() => {
    'worklet';
    
    if (!direction || progress < 0.1) {
      return { opacity: 0 };
    }
    
    const overlayOpacity = interpolate(progress, [0.1, 0.6, 1], [0, 0.3, 0.5]);
    
    return {
      opacity: withSpring(overlayOpacity, { damping: 25, stiffness: 400 }),
    };
  });

  // Get overlay color based on direction
  const getOverlayColor = () => {
    if (direction === 'left') return '#FF3D71'; // Red for DELETE
    if (direction === 'right') return '#00D68F'; // Green for KEEP
    return 'transparent';
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background Color Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          overlayStyle,
          { backgroundColor: getOverlayColor() },
        ]}
      />

      {/* Left Indicator (DELETE) */}
      <Animated.View style={[styles.leftIndicator, leftIndicatorStyle]}>
        <View style={styles.indicatorContent}>
          <Text style={styles.deleteIcon}>✕</Text>
          <Text style={styles.deleteLabel}>DELETE</Text>
        </View>
      </Animated.View>

      {/* Right Indicator (KEEP) */}
      <Animated.View style={[styles.rightIndicator, rightIndicatorStyle]}>
        <View style={styles.indicatorContent}>
          <Text style={styles.keepIcon}>✓</Text>
          <Text style={styles.keepLabel}>KEEP</Text>
        </View>
      </Animated.View>

      {/* Progress Indicator */}
      {isActive && progress > 0.1 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  leftIndicator: {
    position: 'absolute',
    left: 30,
    top: '50%',
    transform: [{ translateY: -40 }],
    alignItems: 'center',
  },
  rightIndicator: {
    position: 'absolute',
    right: 30,
    top: '50%',
    transform: [{ translateY: -40 }],
    alignItems: 'center',
  },
  indicatorContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 80,
  },
  deleteIcon: {
    fontSize: 32,
    color: '#FF3D71',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deleteLabel: {
    fontSize: 12,
    color: '#FF3D71',
    fontWeight: '700',
    letterSpacing: 1,
  },
  keepIcon: {
    fontSize: 32,
    color: '#00D68F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  keepLabel: {
    fontSize: 12,
    color: '#00D68F',
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SwipeDirectionIndicators; 