/**
 * useOptimizedImage.ts
 * 
 * Custom hook for optimized image loading with performance monitoring,
 * caching, preloading, and error handling.
 * 
 * Features:
 * - FastImage integration for better performance
 * - Circular image cache with memory management
 * - Progressive loading with placeholders
 * - Network-aware quality selection
 * - Preloading for next/previous images
 * - Loading state and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageSourcePropType } from 'react-native';
import FastImage from 'react-native-fast-image';
import NetInfo from '@react-native-community/netinfo';
import { Image } from 'expo-image';

export interface OptimizedImageSource {
  uri: string;
  headers?: { [key: string]: string };
  priority?: 'low' | 'normal' | 'high';
  cache?: 'web' | 'cacheOnly' | 'immutable';
}

export interface UseOptimizedImageOptions {
  preloadNext?: string[];
  preloadPrevious?: string[];
  enableNetworkAdaptation?: boolean;
  cacheSize?: number;
  loadingTimeout?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface UseOptimizedImageResult {
  source: OptimizedImageSource;
  isLoading: boolean;
  hasError: boolean;
  loadProgress: number;
  retry: () => void;
  preloadImages: (urls: string[]) => Promise<void>;
  clearCache: () => void;
}

// Global image cache
const imageCache = new Map<string, boolean>();
const preloadQueue = new Set<string>();
const MAX_CACHE_SIZE = 50;
const MAX_CONCURRENT_PRELOADS = 3;

// Network quality state
let currentNetworkQuality: 'low' | 'medium' | 'high' = 'high';

// Initialize network monitoring
NetInfo.addEventListener((state: any) => {
  if (state.type === 'cellular') {
    switch (state.details?.cellularGeneration) {
      case '2g':
      case '3g':
        currentNetworkQuality = 'low';
        break;
      case '4g':
        currentNetworkQuality = 'medium';
        break;
      case '5g':
        currentNetworkQuality = 'high';
        break;
      default:
        currentNetworkQuality = 'medium';
    }
  } else if (state.type === 'wifi') {
    currentNetworkQuality = 'high';
  } else {
    currentNetworkQuality = 'low';
  }
});

// Utility functions
const getOptimalImageUrl = (baseUrl: string, quality: 'low' | 'medium' | 'high'): string => {
  // In a real app, this would append quality parameters or select different endpoints
  // For now, we'll just return the base URL
  return baseUrl;
};

const getOptimalQuality = (requestedQuality?: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' => {
  if (requestedQuality) return requestedQuality;
  return currentNetworkQuality;
};

const getFastImagePriority = (priority?: 'low' | 'normal' | 'high') => {
  switch (priority) {
    case 'high':
      return FastImage.priority.high;
    case 'low':
      return FastImage.priority.low;
    default:
      return FastImage.priority.normal;
  }
};

const getFastImageCache = (cache?: 'web' | 'cacheOnly' | 'immutable') => {
  switch (cache) {
    case 'cacheOnly':
      return FastImage.cacheControl.cacheOnly;
    case 'immutable':
      return FastImage.cacheControl.immutable;
    default:
      return FastImage.cacheControl.web;
  }
};

export const useOptimizedImage = (
  imageUrl: string,
  options: UseOptimizedImageOptions = {}
): UseOptimizedImageResult => {
  const {
    preloadNext = [],
    preloadPrevious = [],
    enableNetworkAdaptation = true,
    cacheSize = 20,
    loadingTimeout = 1000,
    quality: requestedQuality,
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Get optimal quality based on network conditions
  const optimalQuality = enableNetworkAdaptation 
    ? getOptimalQuality(requestedQuality)
    : (requestedQuality || 'high');

  // Create optimized source
  const optimizedUrl = getOptimalImageUrl(imageUrl, optimalQuality);
  
  const source: OptimizedImageSource = {
    uri: optimizedUrl,
    priority: 'normal',
    cache: 'immutable',
  };

  // Handle image loading
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setLoadProgress(0);
    startTimeRef.current = Date.now();

    // Set loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setLoadProgress(0.5); // Show partial progress after timeout
    }, loadingTimeout * 0.2);
  }, [loadingTimeout]);

  const handleLoadProgress = useCallback((progress: number) => {
    setLoadProgress(Math.min(progress, 0.9)); // Cap at 90% until completion
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(1);
    setHasError(false);
    
    // Log performance metrics
    if (startTimeRef.current) {
      const loadTime = Date.now() - startTimeRef.current;
      console.log(`Image loaded in ${loadTime}ms: ${imageUrl}`);
      
      // Update cache
      imageCache.set(imageUrl, true);
      
      // Manage cache size
      if (imageCache.size > MAX_CACHE_SIZE) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) {
          imageCache.delete(firstKey);
        }
      }
    }

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  }, [imageUrl]);

  const handleLoadError = useCallback((error: any) => {
    console.warn(`Failed to load image: ${imageUrl}`, error);
    setIsLoading(false);
    setHasError(true);
    setLoadProgress(0);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  }, [imageUrl]);

  // Retry function
  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setHasError(false);
    handleLoadStart();
  }, [handleLoadStart]);

  // Preload images function
  const preloadImages = useCallback(async (urls: string[]) => {
    const urlsToPreload = urls.filter(url => !imageCache.has(url) && !preloadQueue.has(url));
    
    if (urlsToPreload.length === 0) return;

    // Add to preload queue
    urlsToPreload.forEach(url => preloadQueue.add(url));

    try {
      // Limit concurrent preloads
      const chunks: string[][] = [];
      for (let i = 0; i < urlsToPreload.length; i += MAX_CONCURRENT_PRELOADS) {
        chunks.push(urlsToPreload.slice(i, i + MAX_CONCURRENT_PRELOADS));
      }

      for (const chunk of chunks) {
        const preloadSources = chunk.map(url => ({
          uri: getOptimalImageUrl(url, optimalQuality),
          priority: FastImage.priority.low,
        }));

        await FastImage.preload(preloadSources);
        
        // Mark as cached
        chunk.forEach(url => {
          imageCache.set(url, true);
          preloadQueue.delete(url);
        });
      }
    } catch (error) {
      console.warn('Preload failed:', error);
      urlsToPreload.forEach(url => preloadQueue.delete(url));
    }
  }, [optimalQuality]);

  // Clear cache function
  const clearCache = useCallback(() => {
    imageCache.clear();
    preloadQueue.clear();
    // Note: FastImage cache clearing methods might require specific parameters
    // For now, we'll just clear our local caches
  }, []);

  // Effect for main image loading
  useEffect(() => {
    if (!imageUrl) return;

    // Check if already cached
    if (imageCache.has(imageUrl)) {
      setIsLoading(false);
      setHasError(false);
      setLoadProgress(1);
      return;
    }

    handleLoadStart();
  }, [imageUrl, retryCount, handleLoadStart]);

  // Effect for preloading next/previous images
  useEffect(() => {
    const allPreloadUrls = [...preloadNext, ...preloadPrevious];
    if (allPreloadUrls.length > 0) {
      // Delay preloading to not interfere with main image
      const timeoutId = setTimeout(() => {
        preloadImages(allPreloadUrls);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [preloadNext, preloadPrevious, preloadImages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const preload = useCallback((sources: string[]) => {
    Image.prefetch(sources);
  }, []);

  return {
    source,
    isLoading,
    hasError,
    loadProgress,
    retry,
    preloadImages,
    clearCache,
    preload,
  };
}; 