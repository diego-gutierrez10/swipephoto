import React from 'react';
import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';

interface LottieAnimationProps {
  source: any;
  width?: number;
  height?: number;
  color?: string;
  speed?: number;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ source, width = 200, height = 200, color, speed = 1 }) => {
  const colorFilter = color ? [{ keypath: '*', color: color }] : undefined;

  return (
    <View style={[styles.container, { width, height }]}>
      <LottieView 
        source={source} 
        autoPlay 
        loop 
        style={styles.animation}
        colorFilters={colorFilter}
        speed={speed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default LottieAnimation; 