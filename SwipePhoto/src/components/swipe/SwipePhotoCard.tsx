/**
 * SwipePhotoCard.tsx
 * 
 * Card component that combines swipe gestures with photo display and metadata overlay
 * This is the main component for the photo swiping experience
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeGestureHandler, SwipeDirection } from './SwipeGestureHandler';

// Photo metadata interface
interface PhotoMetadata {
  date?: string;
  fileSize?: string;
  location?: string;
  sourceApp?: string;
}

export interface SwipePhotoCardProps {
  imageSource: ImageSourcePropType;
  altText?: string;
  metadata?: PhotoMetadata;
  onDelete?: () => void;
  onKeep?: () => void;
  onImagePress?: () => void;
  showMetadata?: boolean;
  showDebugInfo?: boolean;
}

export const SwipePhotoCard: React.FC<SwipePhotoCardProps> = ({
  imageSource,
  altText = 'Photo',
  metadata,
  onDelete,
  onKeep,
  onImagePress,
  showMetadata = true,
  showDebugInfo = false,
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [swipeCount, setSwipeCount] = useState({ left: 0, right: 0, cancelled: 0 });

  const handleSwipeComplete = (direction: SwipeDirection) => {
    setSwipeCount(prev => ({
      ...prev,
      [direction]: prev[direction] + 1,
    }));

    if (direction === 'left') {
      onDelete?.();
    } else {
      onKeep?.();
    }

    // Show feedback
    Alert.alert(
      'Photo Action',
      `Photo ${direction === 'left' ? 'deleted' : 'kept'}!`,
      [{ text: 'OK' }]
    );

    // Reset progress indicators
    setSwipeProgress(0);
    setSwipeDirection(null);
  };

  const handleSwipeProgress = (progress: number, direction: SwipeDirection | null) => {
    setSwipeProgress(progress);
    setSwipeDirection(direction);
  };

  const handleSwipeCancel = () => {
    setSwipeCount(prev => ({ ...prev, cancelled: prev.cancelled + 1 }));
    setSwipeProgress(0);
    setSwipeDirection(null);
  };

  const handleImagePress = () => {
    if (onImagePress) {
      onImagePress();
    }
  };

  const getSwipeOpacity = () => {
    return Math.max(0.1, swipeProgress * 0.7);
  };

  const getSwipeColor = () => {
    if (!swipeDirection) return 'transparent';
    return swipeDirection === 'left' ? 'rgba(255, 61, 113, 0.3)' : 'rgba(0, 214, 143, 0.3)';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SwipeGestureHandler
        onSwipeComplete={handleSwipeComplete}
        onSwipeProgress={handleSwipeProgress}
        onSwipeCancel={handleSwipeCancel}
        hapticFeedback={true}
        showIndicators={true}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          {/* Main Image */}
          <Pressable
            style={styles.imageContainer}
            onPress={handleImagePress}
            accessibilityRole="image"
            accessibilityLabel={altText}
          >
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="cover"
              accessibilityIgnoresInvertColors={true}
            />

            {/* Metadata Overlay */}
            {showMetadata && metadata && (
              <View style={styles.metadataOverlay}>
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                  style={styles.metadataContainer}
                >
                  {metadata.date && (
                    <Text style={styles.metadataText} numberOfLines={1}>
                      📅 {metadata.date}
                    </Text>
                  )}
                  {metadata.fileSize && (
                    <Text style={styles.metadataText} numberOfLines={1}>
                      📄 {metadata.fileSize}
                    </Text>
                  )}
                  {metadata.location && (
                    <Text style={styles.metadataText} numberOfLines={1}>
                      📍 {metadata.location}
                    </Text>
                  )}
                  {metadata.sourceApp && (
                    <Text style={styles.metadataText} numberOfLines={1}>
                      📱 {metadata.sourceApp}
                    </Text>
                  )}
                </LinearGradient>
              </View>
            )}

            {/* Swipe Feedback Overlay */}
            <View 
              style={[
                styles.swipeFeedbackOverlay,
                {
                  opacity: getSwipeOpacity(),
                  backgroundColor: getSwipeColor(),
                }
              ]}
              pointerEvents="none"
            />
          </Pressable>
        </View>
      </SwipeGestureHandler>

      {/* Debug Information */}
      {showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Direction: {swipeDirection || 'None'}
          </Text>
          <Text style={styles.debugText}>
            Progress: {(swipeProgress * 100).toFixed(1)}%
          </Text>
          <Text style={styles.debugText}>
            Deleted: {swipeCount.left} | Kept: {swipeCount.right}
          </Text>
          <Text style={styles.debugText}>
            Cancelled: {swipeCount.cancelled}
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    width: 320,
    height: 480,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  metadataOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  metadataContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 80,
  },
  metadataText: {
    color: '#f0f0f0',
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 2,
    textAlign: 'left',
  },
  swipeFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  debugContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    backgroundColor: '#1A1A1A',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#00FF41',
  },
  debugText: {
    fontSize: 14,
    marginVertical: 2,
    textAlign: 'center',
    color: '#CCCCCC',
  },
});

export default SwipePhotoCard; 