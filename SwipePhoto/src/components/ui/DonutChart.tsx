import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface DonutChartProps {
  progress: number; // 0-1 (0% to 100%)
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  duration?: number; // Animation duration in ms
}

export const DonutChart: React.FC<DonutChartProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  progressColor = '#00D68F',
  duration = 800,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate stroke dash offset based on progress
  const getStrokeDashoffset = (progressValue: number) => {
    return circumference - (progressValue * circumference);
  };

  useEffect(() => {
    // Animate to the new progress value
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration,
      useNativeDriver: false, // SVG properties don't support native driver
    }).start();
  }, [progress, duration, animatedProgress]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={getStrokeDashoffset(progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} // Start from top
          opacity={progress > 0 ? 1 : 0} // Hide when no progress
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
});

export default DonutChart; 