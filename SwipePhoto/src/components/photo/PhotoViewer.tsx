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

import React from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Photo metadata interface
export interface PhotoMetadata {
  date?: string;
  fileSize?: string;
  location?: string;
  sourceApp?: string;
}

// Main component props interface
export interface PhotoViewerProps {
  visible: boolean;
  onClose: () => void;
  imageSource: ImageSourcePropType;
  altText?: string;
  metadata?: PhotoMetadata;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  onClose,
  imageSource,
  altText = 'Photo',
  metadata,
}) => {
  
  // Handle background press to close
  const handleBackgroundPress = () => {
    onClose();
  };

  // Handle close button press
  const handleClosePress = () => {
    onClose();
  };

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

            {/* Image container with touch handlers */}
            <Pressable 
              style={styles.imageContainer}
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
            </Pressable>
          </View>
        </Pressable>
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