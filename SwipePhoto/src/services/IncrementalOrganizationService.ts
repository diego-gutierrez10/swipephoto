/**
 * IncrementalOrganizationService.ts
 * 
 * Service for incremental photo organization updates to avoid reorganizing
 * the entire library when new photos are added.
 */

import type { PhotoReference, MonthCategory, SourceCategory } from '../types/organization';

export interface PhotoChangeSet {
  added: PhotoReference[];
  modified: PhotoReference[];
  removed: string[]; // Photo IDs
}

export interface OrganizationDelta {
  monthCategories: {
    added: MonthCategory[];
    modified: MonthCategory[];
    removed: string[];
  };
  sourceCategories: {
    added: SourceCategory[];
    modified: SourceCategory[];
    removed: string[];
  };
  photoReferences: PhotoChangeSet;
}

export interface PhotoFingerprint {
  id: string;
  uri: string;
  checksum: string;
  lastModified: number;
  approximateSize: number;
}

/**
 * Manages incremental updates to photo organization to avoid full reorganization
 */
class IncrementalOrganizationService {
  private static instance: IncrementalOrganizationService;
  private fingerprintCache = new Map<string, PhotoFingerprint>();
  private lastOrganizationTime = 0;
  
  private constructor() {}
  
  static getInstance(): IncrementalOrganizationService {
    if (!IncrementalOrganizationService.instance) {
      IncrementalOrganizationService.instance = new IncrementalOrganizationService();
    }
    return IncrementalOrganizationService.instance;
  }
  
  /**
   * Detect changes in photo library since last organization
   */
  async detectChanges(currentPhotos: PhotoReference[]): Promise<PhotoChangeSet> {
    const changes: PhotoChangeSet = {
      added: [],
      modified: [],
      removed: []
    };
    
    // Create map of current photos for efficient lookup
    const currentPhotoMap = new Map(currentPhotos.map(photo => [photo.photoId, photo]));
    
    // Check for removed photos
    for (const cachedId of this.fingerprintCache.keys()) {
      if (!currentPhotoMap.has(cachedId)) {
        changes.removed.push(cachedId);
      }
    }
    
    // Check for added and modified photos
    for (const photo of currentPhotos) {
      const fingerprint = await this.generateFingerprint(photo);
      const cached = this.fingerprintCache.get(photo.photoId);
      
      if (!cached) {
        // New photo
        changes.added.push(photo);
      } else if (this.hasPhotoChanged(cached, fingerprint)) {
        // Modified photo
        changes.modified.push(photo);
      }
      
      // Update cache
      this.fingerprintCache.set(photo.photoId, fingerprint);
    }
    
    // Clean up removed photos from cache
    changes.removed.forEach(id => this.fingerprintCache.delete(id));
    
    return changes;
  }
  
  /**
   * Check if incremental update is beneficial over full reorganization
   */
  shouldUseIncrementalUpdate(changes: PhotoChangeSet, totalPhotoCount: number): boolean {
    const changedCount = changes.added.length + changes.modified.length + changes.removed.length;
    const changeRatio = changedCount / totalPhotoCount;
    
    // Use incremental update if less than 20% of photos have changed
    return changeRatio < 0.2 && totalPhotoCount > 100;
  }
  
  /**
   * Get optimization metrics for monitoring performance
   */
  getOptimizationMetrics(): {
    cacheSize: number;
    lastUpdateTime: number;
    estimatedTimeSaving: number;
  } {
    return {
      cacheSize: this.fingerprintCache.size,
      lastUpdateTime: this.lastOrganizationTime,
      estimatedTimeSaving: 0 // TODO: Implement time tracking
    };
  }
  
  /**
   * Clear all cached fingerprints (force full reorganization next time)
   */
  clearCache(): void {
    this.fingerprintCache.clear();
    this.lastOrganizationTime = 0;
  }
  
  /**
   * Update the last organization timestamp
   */
  markOrganizationComplete(): void {
    this.lastOrganizationTime = Date.now();
  }
  
  /**
   * Calculate performance improvement score based on cache hit rate
   */
  calculatePerformanceScore(): number {
    if (this.fingerprintCache.size === 0) return 0;
    
    // Simple performance metric based on cache utilization
    const maxCacheSize = 10000; // Assumed max for calculation
    const utilizationRatio = Math.min(this.fingerprintCache.size / maxCacheSize, 1);
    return utilizationRatio * 100; // Return as percentage
  }
  
  /**
   * Estimate time saved by using incremental updates
   */
  estimateTimeSaved(totalPhotoCount: number, changedPhotoCount: number): number {
    if (totalPhotoCount === 0) return 0;
    
    // Rough estimation: full reorganization takes ~1ms per photo
    const fullOrganizationTime = totalPhotoCount * 1;
    const incrementalTime = changedPhotoCount * 1.2; // Slightly more overhead per changed photo
    
    return Math.max(0, fullOrganizationTime - incrementalTime);
  }
  
  private async generateFingerprint(photo: PhotoReference): Promise<PhotoFingerprint> {
    // Generate a simple checksum based on photo metadata
    const photoAsset = photo.photo;
    const metadata = `${photoAsset.uri}:${photoAsset.creationTime}:${photoAsset.width}x${photoAsset.height}`;
    const checksum = await this.simpleHash(metadata);
    
    return {
      id: photo.photoId,
      uri: photoAsset.uri,
      checksum,
      lastModified: photoAsset.creationTime || Date.now(),
      approximateSize: (photoAsset.width || 0) * (photoAsset.height || 0)
    };
  }
  
  private hasPhotoChanged(cached: PhotoFingerprint, current: PhotoFingerprint): boolean {
    return cached.checksum !== current.checksum ||
           cached.lastModified !== current.lastModified ||
           cached.approximateSize !== current.approximateSize;
  }
  
  private async simpleHash(input: string): Promise<string> {
    // Simple hash function for fingerprinting
    // In a real implementation, you might use crypto.subtle.digest for better hashing
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * React hook for using incremental organization
 */
export const useIncrementalOrganization = () => {
  const service = IncrementalOrganizationService.getInstance();
  
  return {
    detectChanges: service.detectChanges.bind(service),
    shouldUseIncremental: service.shouldUseIncrementalUpdate.bind(service),
    getMetrics: service.getOptimizationMetrics.bind(service),
    clearCache: service.clearCache.bind(service),
    markComplete: service.markOrganizationComplete.bind(service),
    calculateScore: service.calculatePerformanceScore.bind(service),
    estimateTimeSaved: service.estimateTimeSaved.bind(service)
  };
};

// Singleton instance export
export const incrementalOrganizationService = IncrementalOrganizationService.getInstance(); 