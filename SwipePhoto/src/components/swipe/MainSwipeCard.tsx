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
import { PhotoCounter } from '../ui';
import { EnhancedUndoButton } from '../undo/EnhancedUndoButton';
import { UndoVisualFeedback } from '../undo/UndoVisualFeedback';
import { useUndo } from '../../hooks/useUndo';
import { useAppDispatch } from '../../store';
import { recordAndDispatchSwipeAction } from '../../store/thunks/undoThunks';
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
  // Redux dispatch for undo functionality
  const dispatch = useAppDispatch();
  
  // Undo system integration
  const { canUndo, undoCount, undo, recordSwipe, visualFeedback } = useUndo();
  


  // State for real-time swipe feedback
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Animated values for integration
  const translateX = useRef(new Animated.Value(0)).current;

  // Current photo for display
  const currentPhoto = photos[currentIndex];

  const handleSwipeComplete = useCallback(async (direction: SwipeDirection) => {
    // Notify parent component about the swipe
    onSwipeComplete(direction);

    // Reset local animation state
    setIsAnimatingOut(false);
    setSwipeProgress(0);
    setSwipeDirection(null);
  }, [onSwipeComplete]);

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

      {/* TODO: Visual indicators for swipe feedback - to be implemented in future update
      <View style={styles.indicatorsContainer}>
        <Animated.View style={[
          styles.indicator,
          styles.deleteIndicator,
          {
            opacity: swipeDirection === 'left' ? Math.min(swipeProgress * 3, 1) : 0,
            transform: [
              { 
                scale: swipeDirection === 'left' ? 1 + (swipeProgress * 0.2) : 0.9 
              }
            ]
          }
        ]}>
          <Text style={styles.deleteIcon}>✕</Text>
          <Text style={styles.deleteText}>DELETE</Text>
        </Animated.View>

        <Animated.View style={[
          styles.indicator,
          styles.keepIndicator,
          {
            opacity: swipeDirection === 'right' ? Math.min(swipeProgress * 3, 1) : 0,
            transform: [
              { 
                scale: swipeDirection === 'right' ? 1 + (swipeProgress * 0.2) : 0.9 
              }
            ]
          }
        ]}>
          <Text style={styles.keepIcon}>✓</Text>
          <Text style={styles.keepText}>KEEP</Text>
        </Animated.View>
      </View>
      */}



      {/* Photo Counter - Task 8.2 implementation */}
      <PhotoCounter
        current={currentIndex + 1}
        total={photos.length}
        style={styles.photoCounter}
        testID="main-swipe-photo-counter"
      />

      {/* Date info */}
      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          📅 {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Undo Button - Task 9 Implementation */}
      <EnhancedUndoButton
        position={{ bottom: 200, right: 20 }}
        size={56}
        style={styles.undoButton}
        enableHaptics={true}
        testID="main-swipe-undo-button"
      />

      {/* Visual Feedback for Undo Actions - Task 9.5 */}
      <UndoVisualFeedback
        visible={false}
        type="card-restored"
        style={styles.undoFeedback}
        enableSound={true}
        reducedMotion={false}
      />
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
  
  /* TODO: Visual indicators styles - to be implemented in future update
  // Visual indicators matching SwipeTestCard design
  indicatorsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    width: '100%',
    height: 80,
    marginTop: -40, // Center the container vertically
    pointerEvents: 'none',
    zIndex: 10,
  },
  indicator: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.8)', // Gray background with transparency
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  keepIndicator: {
    position: 'absolute',
    left: screenWidth / 2 + 20, // Centro + umbral pequeño hacia la derecha
    top: 0,
  },
  deleteIndicator: {
    position: 'absolute',
    left: screenWidth / 2 - 100, // Centro - ancho del cuadro (80px) - umbral pequeño (20px)
    top: 0,
  },
  keepIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D68F', // Green icon
    marginBottom: 2,
  },
  keepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00D68F', // Green text
    textAlign: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3D71', // Red icon
    marginBottom: 2,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3D71', // Red text
    textAlign: 'center',
  },
  */



  // Photo Counter - Task 8.2
  photoCounter: {
    position: 'absolute',
    bottom: 60,
    zIndex: 10,
  },

  // Date info
  dateInfo: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },

  // Undo Button - Task 9
  undoButton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    zIndex: 20,
  },

  // Undo Visual Feedback - Task 9.5
  undoFeedback: {
    position: 'absolute',
    top: screenHeight * 0.4,
    left: 0,
    right: 0,
    zIndex: 15,
  },
});

export default MainSwipeCard; 