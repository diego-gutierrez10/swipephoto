/**
 * PhotoCard.tsx
 * 
 * Photo card component showcasing advanced swipe animations
 * with tilt, slide, scaling, and visual feedback effects
 */

import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SwipeCard } from '../swipe/SwipeCard';
import { SwipeDirection } from '../swipe/SwipeGestureHandler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PhotoCardProps {
  photo?: {
    id: string;
    uri: string;
    filename?: string;
    width?: number;
    height?: number;
  };
  onSwipeComplete: (direction: SwipeDirection) => void;
  onSwipeProgress?: (progress: number, direction: SwipeDirection | null) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onSwipeComplete,
  onSwipeProgress,
}) => {
  
  // Mock photo if none provided for demo
  const mockPhoto = {
    id: 'demo-photo',
    uri: 'https://picsum.photos/300/400',
    filename: 'demo-image.jpg',
    width: 300,
    height: 400,
  };
  
  const currentPhoto = photo || mockPhoto;

  return (
    <SwipeCard
      onSwipeComplete={onSwipeComplete}
      onSwipeProgress={onSwipeProgress}
      style={styles.photoCard}
    >
      <View style={styles.photoContainer}>
        {/* Photo Display */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: currentPhoto.uri }}
            style={styles.photo}
            resizeMode="cover"
          />
          
          {/* Overlay gradient for better text readability */}
          <View style={styles.photoOverlay} />
        </View>

        {/* Photo Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.filename} numberOfLines={1}>
            {currentPhoto.filename}
          </Text>
          
          {currentPhoto.width && currentPhoto.height && (
            <Text style={styles.dimensions}>
              {currentPhoto.width} × {currentPhoto.height}
            </Text>
          )}
        </View>

        {/* Swipe Action Indicators */}
        <View style={styles.actionIndicators}>
          <View style={[styles.actionIndicator, styles.deleteIndicator]}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>Delete</Text>
          </View>
          <View style={[styles.actionIndicator, styles.keepIndicator]}>
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionText}>Keep</Text>
          </View>
        </View>
      </View>
    </SwipeCard>
  );
};

const styles = StyleSheet.create({
  photoCard: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 1.2,
    marginHorizontal: 10,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)', // Gradient overlay for better text readability
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  filename: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dimensions: {
    color: '#CCCCCC',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionIndicators: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  deleteIndicator: {
    borderColor: '#FF3D71',
    borderWidth: 1,
  },
  keepIndicator: {
    borderColor: '#00D68F',
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PhotoCard; 