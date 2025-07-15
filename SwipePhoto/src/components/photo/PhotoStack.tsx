/**
 * PhotoStack.tsx
 * 
 * Stack-based photo display component with preloading, layering,
 * z-index management, and real-time swipe gesture integration.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Animated as RNAnimated,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import OptimizedImage from '../common/OptimizedImage'; // Our new component
import { Photo } from '../../types/models'; // Adjusted type import
import { colors } from '../../constants/theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;

// Simplified props
export interface PhotoStackProps {
  photos: Photo[];
  currentIndex: number;
  onCardTap?: () => void;
  translateX?: SharedValue<number>; // Now accepts a shared value
  isLoadingMore?: boolean; // NEW: Show loading state when waiting for more photos
}

export const PhotoStack: React.FC<PhotoStackProps> = ({
  photos,
  currentIndex,
  onCardTap,
  translateX,
  isLoadingMore = false,
}) => {
  const currentPhoto = photos[currentIndex];

  // Calculate the exact size the image should be displayed at
  const getImageDisplaySize = () => {
    if (!currentPhoto || !currentPhoto.width || !currentPhoto.height) {
      return { width: screenWidth * 0.9, height: screenWidth * 0.9 };
    }

      const imageAspectRatio = currentPhoto.width / currentPhoto.height;
    const maxWidth = screenWidth * 0.95; // Use more screen width
    
    // Calculate available height more conservatively to avoid header/footer overlap
    // Header is ~60px, Footer is ~100px, add some margin for safety
    const headerHeight = 60;
    const footerHeight = 100;
    const safetyMargin = 40; // Extra space for safety
    const availableHeight = screenHeight - headerHeight - footerHeight - safetyMargin;
    const maxHeight = Math.min(availableHeight, screenWidth * 1.4); // Cap at reasonable size

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspectRatio > maxWidth / maxHeight) {
      // Image is wider, constrain by width
      displayWidth = maxWidth;
      displayHeight = maxWidth / imageAspectRatio;
      } else {
      // Image is taller, constrain by height
      displayHeight = maxHeight;
      displayWidth = maxHeight * imageAspectRatio;
      }
      
    return { width: displayWidth, height: displayHeight };
  };

  const imageSize = getImageDisplaySize();
  
  const wrapperStyle: ViewStyle = {
    width: imageSize.width,
    height: imageSize.height,
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    if (!translateX) {
      return {
        borderWidth: 2,
        borderColor: colors.neon.blue,
      };
    }

    const borderColor = interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [colors.neon.red, colors.neon.blue, colors.neon.green]
    );

    return {
      borderWidth: 3,
      borderColor,
    };
  }, [translateX]);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    if (!translateX) {
      return {
        opacity: 0,
      };
    }

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 0.4],
      Extrapolate.CLAMP
    );

    const backgroundColor = translateX.value > 0 ? colors.neon.green : colors.neon.red;

    return {
      opacity,
      backgroundColor,
    };
  }, [translateX]);

  if (!currentPhoto && !isLoadingMore) {
    return (
      <View style={styles.stackContainer}>
        <Text style={styles.errorText}>No photo to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackContainer}>
      <View style={wrapperStyle}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={onCardTap}
          style={styles.touchable}
        >
          {currentPhoto ? (
            currentPhoto.uri ? (
              <OptimizedImage
                uri={currentPhoto.uri}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Image URI is missing</Text>
              </View>
            )
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          <Animated.View style={[styles.overlay, animatedOverlayStyle]} />
        </TouchableOpacity>
      </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a', // Dark gray instead of pure black for less noticeable letterboxing
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  loadingText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PhotoStack; 
