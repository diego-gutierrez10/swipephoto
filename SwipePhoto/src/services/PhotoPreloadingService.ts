/**
 * @file PhotoPreloadingService.ts
 * @description A service to intelligently preload images to improve performance.
 */
import { Image } from 'expo-image';
import { Photo } from '../types/models';

const PRELOAD_WINDOW = 5; // Number of photos to preload ahead

class PhotoPreloadingService {
  private static instance: PhotoPreloadingService;
  private currentlyPreloading: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): PhotoPreloadingService {
    if (!PhotoPreloadingService.instance) {
      PhotoPreloadingService.instance = new PhotoPreloadingService();
    }
    return PhotoPreloadingService.instance;
  }

  /**
   * Updates the preloading queue based on the current photo index.
   * It preloads the next `PRELOAD_WINDOW` photos.
   * @param photos - The full list of photos in the current category.
   * @param currentIndex - The index of the photo currently being viewed.
   */
  public async updatePreloadQueue(photos: Photo[], currentIndex: number): Promise<void> {
    if (!photos || photos.length === 0) {
      return;
    }

    const urisToPreload: string[] = [];

    const start = currentIndex + 1;
    const end = Math.min(photos.length, start + PRELOAD_WINDOW);

    for (let i = start; i < end; i++) {
      const photo = photos[i];
      if (photo?.uri && !this.currentlyPreloading.has(photo.uri)) {
        urisToPreload.push(photo.uri);
      }
    }

    if (urisToPreload.length > 0) {
      // Add to the set to prevent re-preloading
      urisToPreload.forEach(uri => this.currentlyPreloading.add(uri));
      
      // console.log(`[PhotoPreloadingService] Preloading ${urisToPreload.length} images:`, urisToPreload);
      
      try {
        await Image.prefetch(urisToPreload);
        // console.log(`[PhotoPreloadingService] Successfully preloaded images.`);
      } catch (error) {
        // console.error('[PhotoPreloadingService] Image preloading failed:', error);
      } finally {
        // Remove from the set after preloading is attempted
        urisToPreload.forEach(uri => this.currentlyPreloading.delete(uri));
      }
    }
  }

  /**
   * Clears all preloading tasks. Useful when changing categories or on unmount.
   */
  public clearQueue(): void {
    // While Image.prefetch isn't directly cancellable, we can clear our internal tracking.
    // This will prevent new preloads until the queue is updated again.
    this.currentlyPreloading.clear();
    // console.log('[PhotoPreloadingService] Preloading queue cleared.');
  }
}

export default PhotoPreloadingService.getInstance(); 