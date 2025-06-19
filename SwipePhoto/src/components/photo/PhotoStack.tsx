/**
 * PhotoStack.tsx
 * 
 * Stack-based photo display component with preloading, layering,
 * z-index management, and real-time swipe gesture integration.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  Text,
  Animated,
} from 'react-native';
import PhotoPreloadingService, { 
  PhotoItem, 
  PreloadingOptions 
} from '../../services/PhotoPreloadingService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface PhotoStackProps {
  photos: PhotoItem[];
  currentIndex: number;
  onPhotoLoad?: (photoId: string) => void;
  onPhotoError?: (photoId: string, error: Error) => void;
  preloadingOptions?: Partial<PreloadingOptions>;
  showLoadingIndicator?: boolean;
  showStackDepth?: number; // How many cards to show behind current (default: 2)
  stackOffset?: number; // Pixel offset for stacked cards (default: 8)
  // Animation props for swipe integration
  swipeTranslateX?: Animated.Value;
  swipeProgress?: number;
  swipeDirection?: 'left' | 'right' | null;
  isAnimatingOut?: boolean;
}

interface PhotoCardProps {
  photo: PhotoItem;
  index: number;
  currentIndex: number;
  stackOffset: number;
  isVisible: boolean;
  swipeTranslateX?: Animated.Value;
  swipeProgress?: number;
  swipeDirection?: 'left' | 'right' | null;
  isAnimatingOut?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = React.memo(({
  photo,
  index,
  currentIndex,
  stackOffset,
  isVisible,
  swipeTranslateX,
  swipeProgress = 0,
  swipeDirection,
  isAnimatingOut = false,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Calculate card position in stack
  const position = index - currentIndex;
  const isCurrentCard = position === 0;
  const isBehindCard = position > 0 && position <= 2; // Show up to 2 cards behind
  
  // Base z-index and transform values
  const baseZIndex = isCurrentCard ? 100 : isBehindCard ? 100 - position : -1;
  const baseTranslateY = isBehindCard ? position * stackOffset : 0;
  const baseScale = isCurrentCard ? 1 : isBehindCard ? 1 - (position * 0.05) : 0.9;
  const baseOpacity = isCurrentCard ? 1 : isBehindCard ? 0.8 : 0;

  // Get appropriate image source from preloading service
  const imageSource = useMemo(() => {
    return PhotoPreloadingService.getImageSource(photo);
  }, [photo]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setError(null);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback((err: any) => {
    const error = new Error(`Failed to load image: ${photo.id}`);
    setError(error);
    setImageLoaded(false);
    onError?.(error);
  }, [photo.id, onError]);

  // Create animated styles for swipe integration
  const animatedStyle = useMemo(() => {
    if (!isCurrentCard || !swipeTranslateX) {
      // Static positioning for non-current cards
      return {
        zIndex: baseZIndex,
        transform: [
          { translateY: baseTranslateY },
          { scale: baseScale },
        ],
        opacity: baseOpacity,
      };
    }

    // Dynamic positioning for current card during swipe
    return {
      zIndex: baseZIndex + (isAnimatingOut ? 10 : 0), // Boost z-index when animating out
      transform: [
        { translateX: swipeTranslateX },
        { translateY: baseTranslateY },
        { 
          rotate: swipeTranslateX.interpolate({
            inputRange: [-screenWidth, 0, screenWidth],
            outputRange: ['-15deg', '0deg', '15deg'],
            extrapolate: 'clamp',
          })
        },
        { 
          scale: swipeTranslateX.interpolate({
            inputRange: [-screenWidth * 0.5, 0, screenWidth * 0.5],
            outputRange: [0.95, 1, 0.95],
            extrapolate: 'clamp',
          })
        }
      ],
      opacity: swipeTranslateX.interpolate({
        inputRange: [-screenWidth, 0, screenWidth],
        outputRange: [0.7, 1, 0.7],
        extrapolate: 'clamp',
      }),
    };
  }, [isCurrentCard, swipeTranslateX, baseZIndex, baseTranslateY, baseScale, baseOpacity, isAnimatingOut]);

  // Calculate background overlay color during swipe
  const overlayStyle = useMemo(() => {
    if (!isCurrentCard || swipeProgress === 0 || !swipeDirection) {
      return { opacity: 0 };
    }

    return {
      backgroundColor: swipeDirection === 'left' ? '#FF3D71' : '#00D68F',
      opacity: swipeProgress * 0.3,
    };
  }, [isCurrentCard, swipeProgress, swipeDirection]);

  // Don't render if not visible
  if (!isVisible && !isCurrentCard && !isBehindCard) {
    return null;
  }

  if (!imageSource) {
    return (
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorMessage}>Image not available</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Image
        source={imageSource}
        style={styles.image}
        onLoad={handleImageLoad}
        onError={handleImageError}
        resizeMode="cover"
      />
      
      {/* Swipe overlay color */}
      <Animated.View style={[styles.swipeOverlay, overlayStyle]} />
      
      {/* Loading indicator for current card */}
      {isCurrentCard && !imageLoaded && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00FF41" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      {/* Error state for current card */}
      {isCurrentCard && error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      )}
      
      {/* Card shadow for depth effect */}
      {isBehindCard && (
        <View style={[styles.cardShadow, { opacity: 0.1 * (3 - position) }]} />
      )}
    </Animated.View>
  );
});

export const PhotoStack: React.FC<PhotoStackProps> = ({
  photos,
  currentIndex,
  onPhotoLoad,
  onPhotoError,
  preloadingOptions,
  showLoadingIndicator = true,
  showStackDepth = 2,
  stackOffset = 8,
  swipeTranslateX,
  swipeProgress = 0,
  swipeDirection,
  isAnimatingOut = false,
}) => {
  const [loadingStats, setLoadingStats] = useState<{
    totalCached: number;
    loading: number;
    errors: number;
  }>({ totalCached: 0, loading: 0, errors: 0 });

  // Configure preloading service
  useEffect(() => {
    PhotoPreloadingService.configure({
      preloadCount: 3,
      maxCacheSize: 10,
      enableProgressiveLoading: true,
      ...preloadingOptions,
    });
  }, [preloadingOptions]);

  // Preload photos when current index changes
  useEffect(() => {
    const preloadPhotos = async () => {
      try {
        await PhotoPreloadingService.preloadPhotos(
          photos,
          currentIndex,
          (progress) => {
            // Update loading stats
            const stats = PhotoPreloadingService.getCacheStats();
            setLoadingStats({
              totalCached: stats.totalCached,
              loading: stats.activeLoads,
              errors: stats.errors,
            });
          }
        );
      } catch (error) {
        console.error('Error preloading photos:', error);
      }
    };

    preloadPhotos();
  }, [photos, currentIndex]);

  // Calculate visible photo range for rendering optimization
  const visibleRange = useMemo(() => {
    const start = Math.max(0, currentIndex - 1);
    const end = Math.min(photos.length, currentIndex + showStackDepth + 2);
    return { start, end };
  }, [currentIndex, photos.length, showStackDepth]);

  const handlePhotoLoad = useCallback((photoId: string) => {
    onPhotoLoad?.(photoId);
  }, [onPhotoLoad]);

  const handlePhotoError = useCallback((photoId: string, error: Error) => {
    onPhotoError?.(photoId, error);
  }, [onPhotoError]);

  return (
    <View style={styles.container}>
      {/* Render photos in stack */}
      {photos.slice(visibleRange.start, visibleRange.end).map((photo, arrayIndex) => {
        const photoIndex = visibleRange.start + arrayIndex;
        return (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={photoIndex}
            currentIndex={currentIndex}
            stackOffset={stackOffset}
            isVisible={true}
            swipeTranslateX={swipeTranslateX}
            swipeProgress={swipeProgress}
            swipeDirection={swipeDirection}
            isAnimatingOut={isAnimatingOut}
            onLoad={() => handlePhotoLoad(photo.id)}
            onError={(error) => handlePhotoError(photo.id, error)}
          />
        );
      })}

      {/* Debug loading stats (only in development) */}
      {__DEV__ && showLoadingIndicator && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            📸 {currentIndex + 1}/{photos.length}
          </Text>
          <Text style={styles.debugText}>
            💾 Cached: {loadingStats.totalCached}
          </Text>
          <Text style={styles.debugText}>
            ⏳ Loading: {loadingStats.loading}
          </Text>
          {loadingStats.errors > 0 && (
            <Text style={styles.debugTextError}>
              ⚠️ Errors: {loadingStats.errors}
            </Text>
          )}
          {swipeDirection && (
            <Text style={styles.debugText}>
              🎯 Swipe: {swipeDirection} ({Math.round(swipeProgress * 100)}%)
            </Text>
          )}
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
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    pointerEvents: 'none',
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  debugText: {
    color: '#00FF41',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  debugTextError: {
    color: '#FF3D71',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default PhotoStack; 