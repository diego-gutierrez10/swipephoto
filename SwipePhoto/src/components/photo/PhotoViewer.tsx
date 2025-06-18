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
 * - Optimized performance with React.memo and proper gesture handling
 */

import React, { useState, useRef, useCallback, memo } from 'react';
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
import { usePhotoTransition, usePhotoNavigation } from '../../hooks';

// Photo metadata interface
export interface PhotoMetadata {
  date?: string;
  fileSize?: string;
  location?: string;
  sourceApp?: string;
}

// Context interfaces for gesture handlers
interface PinchContext extends Record<string, unknown> {
  startScale: number;
}

interface PanContext extends Record<string, unknown> {
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
  // Animation options
  enableFadeIn?: boolean;
  animationDuration?: number;
  // Navigation support (for future multi-photo support)
  onPhotoChange?: (index: number) => void;
  currentPhotoIndex?: number;
  enableNavigationTransitions?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PhotoViewer: React.FC<PhotoViewerProps> = memo(({
  visible,
  onClose,
  imageSource,
  altText = 'Photo',
  metadata,
  // Animation options
  enableFadeIn,
  animationDuration,
  // Navigation support (for future multi-photo support)
  onPhotoChange,
  currentPhotoIndex,
  enableNavigationTransitions,
}) => {
  // Zoom and pan state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Gesture refs
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const doubleTapRef = useRef(null);

  // Constants
  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  // Image loading state for transitions
  const [imageLoaded, setImageLoaded] = useState(false);

  // Photo transition animations
  const { animatedStyle: fadeInStyle } = usePhotoTransition(
    visible && imageLoaded && enableFadeIn !== false,
    {
      duration: animationDuration || 200,
    }
  );

  // Photo navigation support
  const { navigateToPhoto } = usePhotoNavigation(
    onPhotoChange || (() => {}),
    {
      zoomResetDuration: 150,
      transitionDuration: animationDuration || 200,
      autoResetZoom: enableNavigationTransitions !== false,
    }
  );

  // Handle background press to close
  const handleBackgroundPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle close button press
  const handleClosePress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Reset zoom when opening/closing
  const resetZoom = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, [scale, translateX, translateY]);

  // Reset zoom when component becomes visible
  React.useEffect(() => {
    if (visible) {
      resetZoom();
    }
  }, [visible, resetZoom]);

  // Handle image load events for transitions
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
  }, []);

  // Reset image loaded state when modal closes or image source changes
  React.useEffect(() => {
    if (!visible) {
      setImageLoaded(false);
    }
  }, [visible]);

  React.useEffect(() => {
    setImageLoaded(false);
  }, [imageSource]);

  // Handle pinch gesture - using useAnimatedGestureHandler for proper worklet handling
  const pinchGestureHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, PinchContext>({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = Math.min(Math.max(context.startScale * event.scale, MIN_SCALE), MAX_SCALE);
      scale.value = newScale;
    },
    onEnd: () => {
      // Snap back to bounds if needed
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
      }
    },
  });

  // Handle pan gesture - using useAnimatedGestureHandler for proper worklet handling
  const panGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, PanContext>({
    onStart: (_, context) => {
      context.startTranslateX = translateX.value;
      context.startTranslateY = translateY.value;
    },
    onActive: (event, context) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        // Calculate boundaries based on current scale
        const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
        const maxTranslateY = (screenHeight * (scale.value - 1)) / 2;
        
        const newTranslateX = context.startTranslateX + event.translationX;
        const newTranslateY = context.startTranslateY + event.translationY;
        
        // Constrain to boundaries
        translateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
        translateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
      }
    },
  });

  // Handle double tap - using useAnimatedGestureHandler for proper worklet handling
  const doubleTapHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      if (scale.value > 1) {
        // Zoom out to 1x
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        // Zoom in to 2x
        scale.value = withSpring(2);
      }
    },
  });

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
  const handleImagePress = useCallback(() => {
    // Prevent closing when tapping the image itself
    // This will be used for metadata toggle in future subtasks
  }, []);

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
                onGestureEvent={doubleTapHandler}
              >
                <Animated.View style={styles.imageContainer}>
                  <PinchGestureHandler
                    ref={pinchRef}
                    onGestureEvent={pinchGestureHandler}
                  >
                    <Animated.View style={animatedStyle}>
                      <PanGestureHandler
                        ref={panRef}
                        onGestureEvent={panGestureHandler}
                        minPointers={1}
                        maxPointers={1}
                      >
                        <Animated.View>
                          <Pressable 
                            onPress={handleImagePress}
                            accessibilityRole="image"
                            accessibilityLabel={altText}
                          >
                            <Animated.View style={enableFadeIn !== false ? fadeInStyle : undefined}>
                              <Image
                                source={imageSource}
                                style={styles.image}
                                resizeMode="contain"
                                accessibilityIgnoresInvertColors={true}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                              />
                            </Animated.View>
                          </Pressable>
                        </Animated.View>
                      </PanGestureHandler>
                    </Animated.View>
                  </PinchGestureHandler>
                  
                  {/* Always Visible Metadata Overlay */}
                  {metadata && (
                    <View style={styles.metadataOverlay}>
                      <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                        style={styles.metadataContainer}
                      >
                        {/* Date - Top priority, large and bold */}
                        {metadata.date && (
                          <Text style={styles.metadataDateText} numberOfLines={1}>
                            {metadata.date}
                          </Text>
                        )}
                        
                        {/* Source App - Secondary info */}
                        {metadata.sourceApp && (
                          <Text style={styles.metadataSourceText} numberOfLines={1}>
                            {metadata.sourceApp}
                          </Text>
                        )}
                        
                        {/* Location - When available */}
                        {metadata.location && (
                          <Text style={styles.metadataLocationText} numberOfLines={1}>
                            📍 {metadata.location}
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
});

PhotoViewer.displayName = 'PhotoViewer';

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
  metadataDateText: {
    color: '#ffffff', // Pure white for primary information
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'left',
  },
  metadataSourceText: {
    color: '#e0e0e0', // Slightly dimmer for secondary info
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 2,
    textAlign: 'left',
  },
  metadataLocationText: {
    color: '#d0d0d0', // Even dimmer for tertiary info
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    marginTop: 2,
    textAlign: 'left',
  },
});

export default PhotoViewer; 