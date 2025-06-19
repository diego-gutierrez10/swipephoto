/**
 * MainSwipeCard.tsx
 * 
 * Primary swipe card component integrating SwipeGestureHandler with PhotoStack
 * for Task 7.1 basic swipe gesture detection and Task 7.3 visual swipe animations.
 * Reuses visual design elements from SwipeTestCard (colored indicators).
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeGestureHandler, { SwipeDirection } from './SwipeGestureHandler';
import PhotoStack from '../photo/PhotoStack';
import type { PhotoItem } from '../../services/PhotoPreloadingService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface MainSwipeCardProps {
  photos: PhotoItem[];
  currentIndex: number;
  onSwipeComplete: (direction: SwipeDirection) => void;
  onPhotoChange?: (newIndex: number) => void;
}

const MainSwipeCard: React.FC<MainSwipeCardProps> = ({
  photos,
  currentIndex,
  onSwipeComplete,
  onPhotoChange,
}) => {
  // Counters for testing swipe functionality
  const [keepCount, setKeepCount] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);

  // State for real-time swipe feedback
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Animated values for integration
  const translateX = useRef(new Animated.Value(0)).current;

  // Current photo for display
  const currentPhoto = photos[currentIndex];

  const handleSwipeComplete = useCallback((direction: SwipeDirection) => {
    // Trigger haptic feedback and update counters
    if (direction === 'right') {
      setKeepCount(prev => prev + 1);
    } else {
      setDeleteCount(prev => prev + 1);
    }

    // Reset animation state
    setIsAnimatingOut(false);
    setSwipeProgress(0);
    setSwipeDirection(null);

    // Move to next photo and notify parent
    const nextIndex = currentIndex + 1;
    if (nextIndex < photos.length && onPhotoChange) {
      onPhotoChange(nextIndex);
    }

    // Call parent callback
    onSwipeComplete(direction);
  }, [onSwipeComplete, onPhotoChange, currentIndex, photos.length]);

  const handleSwipeProgress = useCallback((progress: number, direction: SwipeDirection | null) => {
    setSwipeProgress(progress);
    setSwipeDirection(direction);
  }, []);

  const handleSwipeStart = useCallback(() => {
    // Visual feedback could be added here
  }, []);

  const handleSwipeEnd = useCallback(() => {
    if (swipeProgress >= 1) {
      setIsAnimatingOut(true);
    }
  }, [swipeProgress]);

  if (!currentPhoto) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPhotosText}>No photos available</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Swipe gesture handler with PhotoStack */}
      <SwipeGestureHandler
        onSwipeComplete={handleSwipeComplete}
        onSwipeProgress={handleSwipeProgress}
        onSwipeStart={handleSwipeStart}
        onSwipeEnd={handleSwipeEnd}
        translateX={undefined}
        isEnabled={true}
        threshold={120} // Match SwipeTestCard threshold
        showIndicators={false} // We'll use PhotoStack's visual feedback
        style={styles.gestureContainer}
      >
        <PhotoStack
          photos={photos}
          currentIndex={currentIndex}
          swipeTranslateX={translateX}
          swipeProgress={swipeProgress}
          swipeDirection={swipeDirection}
          isAnimatingOut={isAnimatingOut}
          showStackDepth={2}
          stackOffset={8}
          preloadingOptions={{
            preloadCount: 3,
            maxCacheSize: 8,
            enableProgressiveLoading: true,
          }}
        />
      </SwipeGestureHandler>

      {/* Visual indicators with gray background */}
      <View style={styles.indicatorsContainer}>
        {/* KEEP indicator (right swipe) */}
        <Animated.View style={[
          styles.indicator,
          {
            opacity: swipeDirection === 'right' ? Math.min(swipeProgress * 2, 1) : 0.3,
            transform: [
              { 
                scale: swipeDirection === 'right' ? 1 + (swipeProgress * 0.2) : 1 
              }
            ]
          }
        ]}>
          <Text style={styles.keepIcon}>✓</Text>
          <Text style={styles.keepText}>KEEP</Text>
        </Animated.View>

        {/* DELETE indicator (left swipe) */}
        <Animated.View style={[
          styles.indicator,
          {
            opacity: swipeDirection === 'left' ? Math.min(swipeProgress * 2, 1) : 0.3,
            transform: [
              { 
                scale: swipeDirection === 'left' ? 1 + (swipeProgress * 0.2) : 1 
              }
            ]
          }
        ]}>
          <Text style={styles.deleteIcon}>✕</Text>
          <Text style={styles.deleteText}>DELETE</Text>
        </Animated.View>
      </View>

      {/* Debug counters (Task 7.1 requirement) */}
      <View style={styles.countersContainer}>
        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>KEEP</Text>
          <Text style={styles.counterValue}>{keepCount}</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>DELETE</Text>
          <Text style={styles.counterValue}>{deleteCount}</Text>
        </View>
      </View>

      {/* Current photo info */}
      <View style={styles.photoInfo}>
        <Text style={styles.photoInfoText}>
          📸 {currentIndex + 1} / {photos.length}
        </Text>
        <Text style={styles.photoInfoText}>
          📅 {new Date().toLocaleDateString()}
        </Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  
  // Visual indicators matching SwipeTestCard design
  indicatorsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    pointerEvents: 'none',
    zIndex: 10,
  },
  indicator: {
    width: 100,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.8)', // Gray background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  keepIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D68F', // Green icon
    marginBottom: 2,
  },
  keepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00D68F', // Green text
  },
  deleteIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3D71', // Red icon
    marginBottom: 2,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3D71', // Red text
  },

  // Debug counters
  countersContainer: {
    position: 'absolute',
    bottom: 120,
    flexDirection: 'row',
    gap: 20,
    zIndex: 10,
  },
  counterBox: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  counterLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  counterValue: {
    color: '#00FF41',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Photo info
  photoInfo: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  photoInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginVertical: 2,
  },
});

export default MainSwipeCard; 