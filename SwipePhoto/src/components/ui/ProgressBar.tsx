import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

export interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string | [string, string];
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
  height = 12,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  fillColor = ['#39FF14', '#007AFF'],
  borderRadius = 6,
  showText = true,
  textFormat = 'fraction',
  style,
  accessibilityLabel,
  width = '100%',
  testID,
}) => {
  const progress = useSharedValue(0);
  
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  
  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 1000 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => {
    const interpolatedColor = Array.isArray(fillColor)
      ? interpolateColor(progress.value, [0, 100], fillColor)
      : fillColor;

    return {
      width: `${progress.value}%`,
      backgroundColor: interpolatedColor,
      shadowColor: interpolatedColor,
      shadowRadius: progress.value > 0 ? 10 : 0,
      shadowOpacity: progress.value > 0 ? 0.7 : 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: progress.value > 0 ? 10 : 0,
    };
  });

  const getDisplayText = (): string => {
    switch (textFormat) {
      case 'percentage':
        return `${Math.round(percentage)}%`;
      case 'fraction': {
        const format = (val: number) => (val / (1024 * 1024)).toFixed(1);
        return `${format(current)} / ${format(total)} MB`;
      }
      case 'both': {
        const format = (val: number) => (val / (1024 * 1024)).toFixed(1);
        return `${format(current)} / ${format(total)} MB (${Math.round(percentage)}%)`;
      }
      default:
        return `${Math.round(percentage)}%`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.progressContainer,
          { height, backgroundColor, borderRadius, width },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: current }}
        accessibilityLabel={accessibilityLabel || `Progress: ${current} of ${total}`}
        testID={testID}
      >
        <Animated.View style={[styles.progressFill, { borderRadius }, animatedStyle]} />
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.progressText}>{getDisplayText()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  progressContainer: {
    overflow: 'visible', // Changed to visible for glow effect
    position: 'relative',
  },
  progressFill: {
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ProgressBar; 