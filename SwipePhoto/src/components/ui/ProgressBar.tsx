import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export interface ProgressBarProps {
  keepCount: number;
  deleteCount: number;
  height?: number;
  keepColor?: string;
  deleteColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  width?: DimensionValue;
  testID?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  keepCount = 0,
  deleteCount = 0,
  height = 6,
  keepColor = '#39FF14', // Neon Green
  deleteColor = '#FF3D71', // Neon Red
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  borderRadius = 3,
  style,
  width = '100%',
  testID,
}) => {
  const keepProgress = useSharedValue(0);
  const deleteProgress = useSharedValue(0);
  
  const totalProcessed = keepCount + deleteCount;
  const keepPercentage = totalProcessed > 0 ? (keepCount / totalProcessed) * 100 : 0;
  const deletePercentage = totalProcessed > 0 ? (deleteCount / totalProcessed) * 100 : 0;
  
  useEffect(() => {
    keepProgress.value = withTiming(keepPercentage, { duration: 500 });
    deleteProgress.value = withTiming(deletePercentage, { duration: 500 });
  }, [keepPercentage, deletePercentage]);

  const animatedKeepStyle = useAnimatedStyle(() => {
    return {
      width: `${keepProgress.value}%`,
    };
  });

  const animatedDeleteStyle = useAnimatedStyle(() => {
    return {
      width: `${deleteProgress.value}%`,
    };
  });

  return (
      <View
        style={[
          styles.progressContainer,
          { height, backgroundColor, borderRadius, width },
        style
        ]}
        testID={testID}
      >
      <Animated.View style={[styles.progressFill, { backgroundColor: keepColor }, animatedKeepStyle]} />
      <Animated.View style={[styles.progressFill, { backgroundColor: deleteColor }, animatedDeleteStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});

export default ProgressBar; 