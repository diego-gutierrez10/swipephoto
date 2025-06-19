/**
 * PhotoCounter.tsx
 * 
 * A minimalist photo counter component that displays current photo position
 * in the format "Photo X of Y" with appropriate styling and animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

export interface PhotoCounterProps {
  current: number;
  total: number;
  style?: ViewStyle;
  textColor?: string;
  backgroundColor?: string;
  showIcon?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const PhotoCounter: React.FC<PhotoCounterProps> = ({
  current,
  total,
  style,
  textColor = 'rgba(255, 255, 255, 0.9)',
  backgroundColor = 'rgba(0, 0, 0, 0.6)',
  showIcon = true,
  accessibilityLabel,
  testID,
}) => {
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // Animate when counter value changes
  useEffect(() => {
    // Quick scale and fade animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [current, fadeAnimation, scaleAnimation]);

  // Format the counter text
  const getCounterText = (): string => {
    return `Photo ${current} of ${total}`;
  };

  // Calculate progress percentage for accessibility
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }],
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={
        accessibilityLabel || 
        `${getCounterText()}, ${percentage} percent complete`
      }
      testID={testID}
    >
      <View style={styles.content}>
        {showIcon && (
          <Text style={[styles.icon, { color: textColor }]}>📸</Text>
        )}
        <Text style={[styles.counterText, { color: textColor }]}>
          {getCounterText()}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default PhotoCounter; 