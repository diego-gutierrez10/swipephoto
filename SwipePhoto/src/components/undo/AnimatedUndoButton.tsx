/**
 * AnimatedUndoButton.tsx
 * 
 * Enhanced version of UndoButton with smooth animations for showing/hiding
 * based on undo availability. Uses React Native's Animated API.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  Easing,
} from 'react-native';
import { UndoButton } from './UndoButton';
import { useUndo } from '../../hooks/useUndo';

interface AnimatedUndoButtonProps {
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
   * Test identifier for testing
   */
  testID?: string;
  
  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number;
}

export const AnimatedUndoButton: React.FC<AnimatedUndoButtonProps> = ({
  position,
  size,
  style,
  enableHaptics = true,
  testID = 'animated-undo-button',
  animationDuration = 300,
}) => {
  const { canUndo } = useUndo();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current; // Start slightly below

  // Animate in/out based on canUndo state
  useEffect(() => {
    if (canUndo) {
      // Animate in with spring effect
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: animationDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
      ]).start();
    } else {
      // Animate out with smooth fade
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: animationDuration * 0.8,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: animationDuration * 0.8,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 10,
          duration: animationDuration * 0.8,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [canUndo, scaleAnim, opacityAnim, translateYAnim, animationDuration]);

  // Always render the container to maintain animation state
  // The UndoButton itself will handle conditional rendering based on canUndo

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
        style,
      ]}
      pointerEvents={canUndo ? 'auto' : 'none'}
      testID={`${testID}-container`}
    >
      <UndoButton
        position={position}
        size={size}
        enableHaptics={enableHaptics}
        testID={testID}
        style={styles.buttonOverride} // Remove positioning since container handles it
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    // The UndoButton will handle its own positioning, but we need to ensure
    // the container doesn't interfere
  },
  buttonOverride: {
    // Override position to relative since the animated container handles absolute positioning
    position: 'relative' as any,
    bottom: undefined,
    right: undefined,
  },
});

export default AnimatedUndoButton; 