/**
 * PhotoViewer.tsx
 * 
 * Full-screen photo viewer component with modal overlay, responsive image display,
 * subtle rounded corners, and accessibility features.
 * 
 * Features:
 * - Modal/portal rendering above all content
 * - Responsive image container with aspect ratio preservation
 * - Close button (top-right) and background tap to close
 * - Accessibility support with ARIA roles and keyboard navigation
 * - Subtle rounded corners (8px radius)
 * - Touch event listeners for future gesture integration
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  State,
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

// Photo metadata interface
export interface PhotoMetadata {
  date?: string;
  fileSize?: string;
  location?: string;
  sourceApp?: string;
}

// Context interfaces for gesture handlers
interface PinchContext {
  startScale: number;
}

interface PanContext {
  startTranslateX: number;
  startTranslateY: number;
}

// Main component props interface
export interface PhotoViewerProps {
  visible: boolean;
  onClose: () => void;
  imageSource: ImageSourcePropType;
  altText?: string;
  metadata?: PhotoMetadata;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  onClose,
  imageSource,
  altText = 'Photo',
  metadata,
}) => {
  // Zoom and pan state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);

  // Gesture refs
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const doubleTapRef = useRef(null);

  // Constants
  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  // Handle background press to close
  const handleBackgroundPress = () => {
    onClose();
  };

  // Handle close button press
  const handleClosePress = () => {
    onClose();
  };

  // Reset zoom when opening/closing
  const resetZoom = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    lastScale.value = 1;
    lastTranslateX.value = 0;
    lastTranslateY.value = 0;
  };

  // Reset zoom when component becomes visible
  React.useEffect(() => {
    if (visible) {
      resetZoom();
    }
  }, [visible]);

  // Handle pinch gesture
  const onPinchGestureEvent = (event: any) => {
    'worklet';
    const newScale = Math.min(Math.max(lastScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    scale.value = newScale;
  };

  const onPinchStateChange = (event: any) => {
    'worklet';
    if (event.state === State.END) {
      lastScale.value = scale.value;
      
      // Snap back to bounds if needed
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        lastScale.value = MIN_SCALE;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
        lastScale.value = MAX_SCALE;
      }
    }
  };

  // Handle pan gesture
  const onPanGestureEvent = (event: any) => {
    'worklet';
    // Only allow panning when zoomed in
    if (scale.value > 1) {
      // Calculate boundaries
      const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
      const maxTranslateY = (screenHeight * (scale.value - 1)) / 2;
      
      const newTranslateX = lastTranslateX.value + event.translationX;
      const newTranslateY = lastTranslateY.value + event.translationY;
      
      // Constrain to boundaries
      translateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
      translateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
    }
  };

  const onPanStateChange = (event: any) => {
    'worklet';
    if (event.state === State.END) {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    }
  };

  // Handle double tap
  const onDoubleTap = (event: any) => {
    'worklet';
    if (event.state === State.ACTIVE) {
      if (scale.value > 1) {
        // Zoom out to 1x
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        lastScale.value = 1;
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        scale.value = withSpring(2);
        lastScale.value = 2;
      }
    }
  };

  // Animated style for the image container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // Prevent event bubbling when pressing on the image
  const handleImagePress = () => {
    // Prevent closing when tapping the image itself
    // This will be used for metadata toggle in future subtasks
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      accessibilityRole="none"
      accessibilityLabel="Photo viewer"
      accessibilityHint="Full screen photo viewer. Press close button or tap background to exit."
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      
      <SafeAreaView style={styles.container}>
        <GestureHandlerRootView style={styles.container}>
          <Pressable 
            style={styles.backdrop}
            onPress={handleBackgroundPress}
            accessibilityLabel="Close photo viewer"
            accessibilityHint="Tap to close the photo viewer"
          >
            {/* Main content area */}
            <View style={styles.contentContainer}>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClosePress}
                accessibilityRole="button"
                accessibilityLabel="Close"
                accessibilityHint="Close the photo viewer"
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {/* Gesture handlers for zoom and pan */}
              <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                onHandlerStateChange={onDoubleTap}
              >
                <Animated.View style={styles.imageContainer}>
                  <PinchGestureHandler
                    ref={pinchRef}
                    onGestureEvent={onPinchGestureEvent}
                    onHandlerStateChange={onPinchStateChange}
                  >
                    <Animated.View style={animatedStyle}>
                      <PanGestureHandler
                        ref={panRef}
                        onGestureEvent={onPanGestureEvent}
                        onHandlerStateChange={onPanStateChange}
                        minPointers={1}
                        maxPointers={1}
                      >
                        <Animated.View>
                          <Pressable 
                            onPress={handleImagePress}
                            accessibilityRole="image"
                            accessibilityLabel={altText}
                          >
                            <Image
                              source={imageSource}
                              style={styles.image}
                              resizeMode="contain"
                              accessibilityIgnoresInvertColors={true}
                            />
                          </Pressable>
                        </Animated.View>
                      </PanGestureHandler>
                    </Animated.View>
                  </PinchGestureHandler>
                  
                  {/* Metadata Overlay */}
                  {metadata && (
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
                </Animated.View>
              </TapGestureHandler>
            </View>
          </Pressable>
        </GestureHandlerRootView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 8, // Subtle rounded corners as specified
    // Ensure image doesn't exceed safe boundaries
    width: '100%',
    height: '100%',
  },
  metadataOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Gradient background from transparent to dark
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  metadataContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20, // Extra padding for gradient effect
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    minHeight: 80, // Ensure enough space for gradient
  },
  metadataText: {
    color: '#f0f0f0', // Light gray for high contrast
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 2,
    // Handle text overflow
    textAlign: 'left',
  },
});

export default PhotoViewer; 