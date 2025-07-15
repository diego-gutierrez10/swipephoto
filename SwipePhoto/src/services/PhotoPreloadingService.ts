/**
 * @file PhotoPreloadingService.ts
 * @description A service to intelligently preload images to improve performance.
 */
import { Image } from 'expo-image';
import { Photo } from '../types/models';

// Adaptive preloading based on device performance and user behavior
const PRELOAD_WINDOW = {
  BASE: 15,        // Standard preload count
  AGGRESSIVE: 50,  // High-performance devices or fast swipers
  CONSERVATIVE: 7, // Low memory or slow devices
};

class PhotoPreloadingService {
  private static instance: PhotoPreloadingService;
  private currentlyPreloading: Set<string> = new Set();
  private currentPreloadWindow: number = PRELOAD_WINDOW.AGGRESSIVE; // Start with aggressive preloading
  private swipeHistory: number[] = []; // Track swipe speeds
  private lastSwipeTime: number = 0;

  private constructor() {
    // Private constructor for singleton pattern
    this.adaptPreloadingBehavior();
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
    const preloadCandidates: Photo[] = [];

    // 1. Add previous photo for instant undo
    if (currentIndex > 0) {
      preloadCandidates.push(photos[currentIndex - 1]);
    }

    // 2. Add next photos for forward swiping
    const forwardStart = currentIndex + 1;
    const forwardEnd = Math.min(photos.length, forwardStart + this.currentPreloadWindow);
    for (let i = forwardStart; i < forwardEnd; i++) {
      preloadCandidates.push(photos[i]);
    }

    for (const photo of preloadCandidates) {
      if (photo?.uri && !this.currentlyPreloading.has(photo.uri)) {
        urisToPreload.push(photo.uri);
      }
    }

    if (urisToPreload.length > 0) {
      // Add to the set to prevent re-preloading
      urisToPreload.forEach(uri => this.currentlyPreloading.add(uri));
      
      // console.log(`[PhotoPreloadingService] Preloading ${urisToPreload.length} images:`, urisToPreload);
      
      try {
        await Image.prefetch(urisToPreload, 'memory');
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
   * Tracks swipe behavior to adapt preloading strategy
   */
  public trackSwipe(): void {
    const now = Date.now();
    if (this.lastSwipeTime > 0) {
      const swipeInterval = now - this.lastSwipeTime;
      this.swipeHistory.push(swipeInterval);
      
      // Keep only last 10 swipes for analysis
      if (this.swipeHistory.length > 10) {
        this.swipeHistory.shift();
      }
      
      this.adaptPreloadingBehavior();
    }
    this.lastSwipeTime = now;
  }

  /**
   * Adapts preloading behavior based on device performance and user patterns
   */
  private adaptPreloadingBehavior(): void {
    // Get average swipe speed (lower interval = faster swiping)
    const avgSwipeInterval = this.swipeHistory.length > 0 
      ? this.swipeHistory.reduce((sum, interval) => sum + interval, 0) / this.swipeHistory.length
      : 2000; // Default to 2 seconds

    // Adapt preload window based on swipe speed
    if (avgSwipeInterval < 800) {
      // Fast swiping (< 800ms between swipes) - Use aggressive preloading
      this.currentPreloadWindow = PRELOAD_WINDOW.AGGRESSIVE;
    } else if (avgSwipeInterval > 3000) {
      // Slow browsing (> 3s between swipes) - Use conservative preloading
      this.currentPreloadWindow = PRELOAD_WINDOW.CONSERVATIVE;
    } else {
      // Normal pace - Use base preloading
      this.currentPreloadWindow = PRELOAD_WINDOW.BASE;
    }

    console.log(`📸 PhotoPreloadingService: Adapted preload window to ${this.currentPreloadWindow} photos (avg interval: ${avgSwipeInterval}ms)`);
  }

  /**
   * Manually set preload window (for testing or specific scenarios)
   */
  public setPreloadWindow(window: number): void {
    this.currentPreloadWindow = Math.max(5, Math.min(100, window)); // Clamp between 5-100
    console.log(`📸 PhotoPreloadingService: Manually set preload window to ${this.currentPreloadWindow} photos`);
  }

  /**
   * Get current preload window size
   */
  public getCurrentPreloadWindow(): number {
    return this.currentPreloadWindow;
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