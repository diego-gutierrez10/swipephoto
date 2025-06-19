import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
  DimensionValue,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  showText?: boolean;
  textFormat?: 'percentage' | 'fraction' | 'both';
  style?: ViewStyle;
  accessibilityLabel?: string;
  width?: DimensionValue;
  testID?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  height = 4,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  fillColor = '#007AFF',
  borderRadius = 2,
  showText = false,
  textFormat = 'percentage',
  style,
  accessibilityLabel,
  width = '100%',
  testID,
}) => {
  const fillAnimation = useRef(new Animated.Value(0)).current;
  
  // Calculate progress percentage and ensure it's safe for React Native Animated
  const rawPercentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const percentage = Math.round(rawPercentage * 100) / 100; // Round to 2 decimal places max
  
  // Animate progress bar fill
  useEffect(() => {
    // Ensure the animated value is an integer or simple decimal to avoid precision issues
    const safeAnimatedValue = Math.round(percentage * 10) / 10; // Round to 1 decimal place
    
    Animated.timing(fillAnimation, {
      toValue: safeAnimatedValue,
      duration: 300, // 0.3s as specified in requirements
      useNativeDriver: false, // width animations require non-native driver
    }).start();
  }, [percentage, fillAnimation]);

  // Format text based on textFormat prop
  const getDisplayText = (): string => {
    switch (textFormat) {
      case 'percentage':
        return `${Math.round(percentage)}%`;
      case 'fraction':
        return `${Math.round(current)} of ${total}`;
      case 'both':
        return `${Math.round(current)} of ${total} (${Math.round(percentage)}%)`;
      default:
        return `${Math.round(percentage)}%`;
    }
  };

  // Animated width interpolation
  const animatedWidth = fillAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar Container */}
      <View
        style={[
          styles.progressContainer,
          {
            height,
            backgroundColor,
            borderRadius,
            width,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: total,
          now: Math.round(current),
        }}
        accessibilityLabel={
          accessibilityLabel || `Progress: ${Math.round(current)} of ${total} completed`
        }
        testID={testID}
      >
        {/* Animated Fill */}
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth,
              backgroundColor: fillColor,
              borderRadius,
            },
          ]}
        />
      </View>

      {/* Optional Text Display */}
      {showText && (
        <Text style={styles.progressText} accessibilityLiveRegion="polite">
          {getDisplayText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  progressContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProgressBar; 