/**
 * PhotoPreloadingService.ts
 * 
 * Service for intelligent photo preloading with caching, progressive loading,
 * memory management, and error handling for the photo stack component.
 */

import { Image } from 'react-native';

export interface PhotoItem {
  id: string;
  uri: string;
  thumbnailUri?: string;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    format?: string;
  };
}

export interface PreloadingOptions {
  preloadCount: number; // Number of photos to preload ahead
  maxCacheSize: number; // Maximum number of photos to keep in cache
  enableProgressiveLoading: boolean;
  fallbackImage?: string;
}

interface CachedPhoto {
  id: string;
  uri: string;
  thumbnailLoaded: boolean;
  fullImageLoaded: boolean;
  error: boolean;
  timestamp: number;
}

interface LoadingProgress {
  id: string;
  progress: number; // 0-1
  stage: 'thumbnail' | 'full' | 'complete' | 'error';
}

type ProgressCallback = (progress: LoadingProgress) => void;

class PhotoPreloadingServiceClass {
  private cache = new Map<string, CachedPhoto>();
  private activeLoads = new Set<string>();
  private options: PreloadingOptions = {
    preloadCount: 3,
    maxCacheSize: 10,
    enableProgressiveLoading: true,
    fallbackImage: undefined,
  };

  /**
   * Initialize the service with configuration
   */
  public configure(options: Partial<PreloadingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Preload photos starting from the current index
   */
  public async preloadPhotos(
    photos: PhotoItem[],
    currentIndex: number,
    onProgress?: ProgressCallback
  ): Promise<void> {
    const startIndex = Math.max(0, currentIndex);
    const endIndex = Math.min(
      photos.length,
      currentIndex + this.options.preloadCount + 1
    );

    // Clean up old cache entries to manage memory
    this.cleanupCache();

    // Preload photos in parallel
    const loadPromises: Promise<void>[] = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const photo = photos[i];
      if (photo && !this.activeLoads.has(photo.id)) {
        loadPromises.push(this.loadPhoto(photo, onProgress));
      }
    }

    await Promise.allSettled(loadPromises);
  }

  /**
   * Load a single photo with progressive loading
   */
  private async loadPhoto(
    photo: PhotoItem,
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (this.activeLoads.has(photo.id)) {
      return; // Already loading
    }

    this.activeLoads.add(photo.id);

    try {
      // Initialize cache entry
      this.cache.set(photo.id, {
        id: photo.id,
        uri: photo.uri,
        thumbnailLoaded: false,
        fullImageLoaded: false,
        error: false,
        timestamp: Date.now(),
      });

      if (this.options.enableProgressiveLoading && photo.thumbnailUri) {
        // Stage 1: Load thumbnail first
        onProgress?.({
          id: photo.id,
          progress: 0.1,
          stage: 'thumbnail',
        });

        try {
          await Image.prefetch(photo.thumbnailUri);
          
          const cached = this.cache.get(photo.id);
          if (cached) {
            cached.thumbnailLoaded = true;
            this.cache.set(photo.id, cached);
          }

          onProgress?.({
            id: photo.id,
            progress: 0.3,
            stage: 'thumbnail',
          });
        } catch (thumbnailError) {
          console.warn(`Failed to load thumbnail for ${photo.id}:`, thumbnailError);
        }
      }

      // Stage 2: Load full image
      onProgress?.({
        id: photo.id,
        progress: 0.5,
        stage: 'full',
      });

      await Image.prefetch(photo.uri);
      
      const cached = this.cache.get(photo.id);
      if (cached) {
        cached.fullImageLoaded = true;
        this.cache.set(photo.id, cached);
      }

      onProgress?.({
        id: photo.id,
        progress: 1.0,
        stage: 'complete',
      });

    } catch (error) {
      console.error(`Failed to load photo ${photo.id}:`, error);
      
      const cached = this.cache.get(photo.id);
      if (cached) {
        cached.error = true;
        this.cache.set(photo.id, cached);
      }

      onProgress?.({
        id: photo.id,
        progress: 0,
        stage: 'error',
      });

      // If we have a fallback image, try to load that
      if (this.options.fallbackImage) {
        try {
          await Image.prefetch(this.options.fallbackImage);
        } catch (fallbackError) {
          console.error('Failed to load fallback image:', fallbackError);
        }
      }
    } finally {
      this.activeLoads.delete(photo.id);
    }
  }

  /**
   * Check if a photo is cached and ready
   */
  public isPhotoCached(photoId: string): boolean {
    const cached = this.cache.get(photoId);
    return cached ? cached.fullImageLoaded && !cached.error : false;
  }

  /**
   * Check if thumbnail is available for a photo
   */
  public isThumbnailCached(photoId: string): boolean {
    const cached = this.cache.get(photoId);
    return cached ? cached.thumbnailLoaded && !cached.error : false;
  }

  /**
   * Get the appropriate image source for a photo
   */
  public getImageSource(photo: PhotoItem): { uri: string } | null {
    const cached = this.cache.get(photo.id);
    
    if (!cached) {
      // Not cached, return original or fallback
      return photo.uri ? { uri: photo.uri } : 
             this.options.fallbackImage ? { uri: this.options.fallbackImage } : null;
    }

    if (cached.error) {
      // Error loading, return fallback
      return this.options.fallbackImage ? { uri: this.options.fallbackImage } : null;
    }

    if (cached.fullImageLoaded) {
      // Full image ready
      return { uri: photo.uri };
    }

    if (cached.thumbnailLoaded && photo.thumbnailUri) {
      // Thumbnail ready, full image still loading
      return { uri: photo.thumbnailUri };
    }

    // Nothing ready yet, return original or fallback
    return photo.uri ? { uri: photo.uri } : 
           this.options.fallbackImage ? { uri: this.options.fallbackImage } : null;
  }

  /**
   * Clean up old cache entries to manage memory
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.options.maxCacheSize) {
      return;
    }

    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries
    const toRemove = entries.slice(0, this.cache.size - this.options.maxCacheSize);
    
    for (const [id] of toRemove) {
      this.cache.delete(id);
    }

    console.log(`Cleaned up ${toRemove.length} cached photos to manage memory`);
  }

  /**
   * Clear all cached photos
   */
  public clearCache(): void {
    this.cache.clear();
    this.activeLoads.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): {
    totalCached: number;
    thumbnailsLoaded: number;
    fullImagesLoaded: number;
    errors: number;
    activeLoads: number;
  } {
    const stats = {
      totalCached: this.cache.size,
      thumbnailsLoaded: 0,
      fullImagesLoaded: 0,
      errors: 0,
      activeLoads: this.activeLoads.size,
    };

    for (const cached of this.cache.values()) {
      if (cached.thumbnailLoaded) stats.thumbnailsLoaded++;
      if (cached.fullImageLoaded) stats.fullImagesLoaded++;
      if (cached.error) stats.errors++;
    }

    return stats;
  }

  /**
   * Force reload a specific photo (useful for error recovery)
   */
  public async reloadPhoto(
    photo: PhotoItem,
    onProgress?: ProgressCallback
  ): Promise<void> {
    // Remove from cache and active loads
    this.cache.delete(photo.id);
    this.activeLoads.delete(photo.id);

    // Reload
    await this.loadPhoto(photo, onProgress);
  }
}

// Export singleton instance
export const PhotoPreloadingService = new PhotoPreloadingServiceClass();
export default PhotoPreloadingService; 