/**
 * PhotoStack.tsx
 * 
 * Stack-based photo display component with preloading, layering,
 * z-index management, and real-time swipe gesture integration.
 */

import React, { useMemo } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  Dimensions, 
  Animated,
} from 'react-native';
import OptimizedImage from '../common/OptimizedImage'; // Our new component
import { Photo } from '../../types/models'; // Adjusted type import

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simplified props
export interface PhotoStackProps {
  photos: Photo[];
  currentIndex: number;
  swipeTranslateX?: Animated.Value;
  swipeProgress?: number;
  swipeDirection?: 'left' | 'right' | null;
  stackDepth?: number;
  stackOffset?: number;
}

interface PhotoCardProps {
  photo: Photo;
  index: number;
  currentIndex: number;
  stackOffset: number;
  isVisible: boolean;
  swipeTranslateX?: Animated.Value;
}

const PhotoCard: React.FC<PhotoCardProps> = React.memo(({
  photo,
  index,
  currentIndex,
  stackOffset,
  isVisible,
  swipeTranslateX,
}) => {
  const position = index - currentIndex;
  const isCurrentCard = position === 0;
  
  // Determine if the card should be rendered
  const shouldRender = position >= 0 && position <= 2;

  if (!shouldRender || !isVisible) {
    return null;
  }

  const animatedStyle = useMemo(() => {
    const translateY = position * stackOffset;
    const scale = 1 - (position * 0.05);
    const opacity = isCurrentCard ? 1 : 0.8;

    if (!isCurrentCard || !swipeTranslateX) {
      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    }

    // Dynamic animation for the current card being swiped
    return {
      transform: [
        { translateX: swipeTranslateX },
        { 
          rotate: swipeTranslateX.interpolate({
            inputRange: [-screenWidth, 0, screenWidth],
            outputRange: ['-15deg', '0deg', '15deg'],
            extrapolate: 'clamp',
          })
        },
      ],
    };
  }, [isCurrentCard, position, stackOffset, swipeTranslateX]);

  return (
    <Animated.View style={[styles.card, { zIndex: 100 - position }, animatedStyle]}>
      {photo.uri ? (
         <OptimizedImage
            source={{ uri: photo.uri }}
            style={styles.image}
         />
      ) : (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Image URI is missing</Text>
        </View>
      )}
    </Animated.View>
  );
});

export const PhotoStack: React.FC<PhotoStackProps> = ({
  photos,
  currentIndex,
  stackDepth = 3,
  stackOffset = 8,
  swipeTranslateX,
}) => {
  return (
    <View style={styles.stackContainer}>
      {photos.map((photo, index) => {
        const isVisible = index >= currentIndex && index < currentIndex + stackDepth;
        return (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            currentIndex={currentIndex}
            stackOffset={stackOffset}
            isVisible={isVisible}
            swipeTranslateX={swipeTranslateX}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'absolute',
    backgroundColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: '100%',
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
});

export default PhotoStack; 