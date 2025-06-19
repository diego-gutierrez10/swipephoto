/**
 * UndoIntegratedSwipeCard.tsx
 * 
 * Swipe card component that automatically integrates with the undo system.
 * Records swipe actions and provides seamless undo functionality.
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import { SwipeGestureHandler, SwipeDirection } from './SwipeGestureHandler';
import OptimizedImage from '../common/OptimizedImage';
import { SwipeDirectionIndicators } from './SwipeDirectionIndicators';
import { useAppDispatch } from '../../store';
import { recordAndDispatchSwipeAction } from '../../store/thunks/undoThunks';

export interface UndoIntegratedSwipeCardProps {
  /**
   * Photo data
   */
  photo: {
    id: string;
    uri: string;
    width?: number;
    height?: number;
    altText?: string;
  };
  
  /**
   * Current index in the photo stack
   */
  currentIndex: number;
  
  /**
   * Session ID for tracking
   */
  sessionId?: string;
  
  /**
   * Category ID for organization
   */
  categoryId?: string;
  
  /**
   * Callback when swipe is completed (after recording for undo)
   */
  onSwipeComplete?: (direction: SwipeDirection, photoId: string) => void;
  
  /**
   * Callback for swipe progress updates
   */
  onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
  
  /**
   * Custom style overrides
   */
  style?: any;
  
  /**
   * Whether to show direction indicators
   */
  showIndicators?: boolean;
  
  /**
   * Enable haptic feedback
   */
  hapticFeedback?: boolean;
  
  /**
   * Debug mode
   */
  debug?: boolean;
}

export const UndoIntegratedSwipeCard: React.FC<UndoIntegratedSwipeCardProps> = ({
  photo,
  currentIndex,
  sessionId,
  categoryId,
  onSwipeComplete,
  onSwipeProgress,
  style,
  showIndicators = true,
  hapticFeedback = true,
  debug = false,
}) => {
  const dispatch = useAppDispatch();

  /**
   * Handle swipe completion with automatic undo recording
   */
  const handleSwipeComplete = useCallback(async (direction: SwipeDirection) => {
    try {
      // Record and dispatch the swipe action with undo integration
      await dispatch(recordAndDispatchSwipeAction({
        photoId: photo.id,
        direction,
        currentIndex,
        categoryId,
        metadata: {
          velocity: 500, // Default velocity, can be passed from gesture handler
          confidence: 0.9, // Default confidence
          sessionId,
        },
      })).unwrap();

      // Call parent callback after successful recording
      onSwipeComplete?.(direction, photo.id);

      // Show user feedback
      if (debug) {
        Alert.alert(
          'Swipe Recorded',
          `${direction} swipe on photo ${photo.id} recorded for undo`,
          [{ text: 'OK' }]
        );
      }

      if (__DEV__) {
        console.log('🔄 UndoIntegratedSwipeCard: Swipe completed and recorded', {
          photoId: photo.id,
          direction,
          currentIndex,
          sessionId,
        });
      }

    } catch (error) {
      // Handle error in swipe recording
      console.error('🔄 UndoIntegratedSwipeCard: Failed to record swipe:', error);
      
      // Still call parent callback even if recording failed
      onSwipeComplete?.(direction, photo.id);
      
      if (debug) {
        Alert.alert(
          'Recording Failed',
          'Swipe action could not be recorded for undo',
          [{ text: 'OK' }]
        );
      }
    }
  }, [dispatch, photo.id, currentIndex, categoryId, sessionId, onSwipeComplete, debug]);

  /**
   * Handle swipe progress updates
   */
  const handleSwipeProgress = useCallback((progress: number, direction: SwipeDirection | null) => {
    onSwipeProgress?.(progress, direction);
  }, [onSwipeProgress]);

  return (
    <View style={[styles.container, style]}>
      <SwipeGestureHandler
        onSwipeComplete={handleSwipeComplete}
        onSwipeProgress={handleSwipeProgress}
        hapticFeedback={hapticFeedback}
        showIndicators={showIndicators}
        style={styles.gestureHandler}
      >
                 <View style={styles.imageContainer}>
           <OptimizedImage
             source={photo.uri}
             style={styles.image}
           />
           
           {/* Debug info overlay */}
           {debug && (
             <View style={styles.debugOverlay}>
               <View style={styles.debugInfo}>
                 <Text style={styles.debugText}>Photo: {photo.id}</Text>
                 <Text style={styles.debugText}>Index: {currentIndex}</Text>
                 <Text style={styles.debugText}>Session: {sessionId || 'N/A'}</Text>
                 <Text style={styles.debugText}>Category: {categoryId || 'N/A'}</Text>
               </View>
             </View>
           )}
         </View>
      </SwipeGestureHandler>
      
      {/* Direction indicators */}
      {showIndicators && (
        <View style={styles.indicators}>
          <SwipeDirectionIndicators />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureHandler: {
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  indicators: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  debugInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default UndoIntegratedSwipeCard; 