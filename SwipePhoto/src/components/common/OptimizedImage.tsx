/**
 * OptimizedImage.tsx
 * 
 * High-performance image component with loading states, error handling,
 * and progressive loading capabilities.
 * 
 * Features:
 * - FastImage integration for better performance
 * - Loading indicators with progress
 * - Error states with retry functionality
 * - Progressive loading with placeholders
 * - Automatic preloading of adjacent images
 * - Network-aware quality selection
 */

import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import FastImage, { ResizeMode, ImageStyle as FastImageStyle } from 'react-native-fast-image';
import { useOptimizedImage, UseOptimizedImageOptions } from '../../hooks/useOptimizedImage';

export interface OptimizedImageProps extends UseOptimizedImageOptions {
  source: string;
  style?: FastImageStyle;
  containerStyle?: ViewStyle;
  resizeMode?: ResizeMode;
  altText?: string;
  showLoadingIndicator?: boolean;
  showRetryButton?: boolean;
  onPress?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  containerStyle,
  resizeMode = FastImage.resizeMode.cover,
  altText = 'Image',
  showLoadingIndicator = true,
  showRetryButton = true,
  onPress,
  onLoad,
  onError,
  placeholder,
  errorComponent,
  loadingComponent,
  ...optimizationOptions
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const {
    source: optimizedSource,
    isLoading,
    hasError,
    loadProgress,
    retry,
  } = useOptimizedImage(source, optimizationOptions);

  // Handle image load completion
  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback(() => {
    setImageLoaded(false);
    onError?.();
  }, [onError]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    setImageLoaded(false);
    retry();
  }, [retry]);

  // Render loading state
  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    if (!showLoadingIndicator) {
      return null;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        {loadProgress > 0 && (
          <Text style={styles.progressText}>
            {Math.round(loadProgress * 100)}%
          </Text>
        )}
      </View>
    );
  };

  // Render error state
  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load image</Text>
        {showRetryButton && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderBox} />
      </View>
    );
  };

  // Main image component
  const imageComponent = (
    <FastImage
      source={{
        uri: optimizedSource.uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      style={[styles.image, style]}
      resizeMode={resizeMode}
      onLoad={handleLoad}
      onError={handleError}
      accessibilityIgnoresInvertColors={true}
      accessibilityLabel={altText}
    />
  );

  // Content based on state
  let content: React.ReactNode;

  if (hasError) {
    content = renderError();
  } else if (isLoading || !imageLoaded) {
    content = (
      <>
        {renderPlaceholder()}
        <View style={styles.overlay}>
          {renderLoading()}
        </View>
      </>
    );
  } else {
    content = imageComponent;
  }

  // Wrap with pressable if onPress is provided
  if (onPress) {
    return (
      <Pressable
        style={[styles.container, containerStyle]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${altText}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderBox: {
    width: 40,
    height: 40,
    backgroundColor: '#d0d0d0',
    borderRadius: 4,
  },
});

export default memo(OptimizedImage); 