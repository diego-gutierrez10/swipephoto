/**
 * LazyLoadingService.ts
 * 
 * Service for lazy loading photo categories with pagination and performance optimization
 * for large photo collections.
 */

import type { PhotoReference } from '../types/organization';

export interface PaginationConfig {
  page: number;
  limit: number;
  offset: number;
}

export interface LazyLoadResult<T> {
  data: T[];
  hasMore: boolean;
  totalCount: number;
  nextPage?: number;
}

export interface CategoryContentPage {
  categoryId: string;
  photos: PhotoReference[];
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastLoadTime: number;
}

/**
 * Manages lazy loading of category contents with caching and performance optimization
 */
class LazyLoadingService {
  private static instance: LazyLoadingService;
  private pageCache = new Map<string, CategoryContentPage>();
  private loadingStates = new Map<string, LoadingState>();
  private readonly DEFAULT_PAGE_SIZE = 25;
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached pages
  
  private constructor() {}
  
  static getInstance(): LazyLoadingService {
    if (!LazyLoadingService.instance) {
      LazyLoadingService.instance = new LazyLoadingService();
    }
    return LazyLoadingService.instance;
  }
  
  /**
   * Load a page of photos for a specific category
   */
  async loadCategoryPage(
    categoryId: string,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<CategoryContentPage> {
    const cacheKey = this.generateCacheKey(categoryId, page, pageSize);
    
    // Return cached result if available and fresh
    const cached = this.pageCache.get(cacheKey);
    if (cached && this.isCacheFresh(cacheKey)) {
      return cached;
    }
    
    // Update loading state
    this.setLoadingState(cacheKey, { isLoading: true, error: null, lastLoadTime: Date.now() });
    
    try {
      const result = await this.fetchCategoryPage(categoryId, page, pageSize);
      
      // Cache the result
      this.pageCache.set(cacheKey, result);
      this.manageCacheSize();
      
      // Update loading state
      this.setLoadingState(cacheKey, { 
        isLoading: false, 
        error: null, 
        lastLoadTime: Date.now() 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setLoadingState(cacheKey, { 
        isLoading: false, 
        error: errorMessage, 
        lastLoadTime: Date.now() 
      });
      throw error;
    }
  }
  
  /**
   * Preload the next page in background for smoother UX
   */
  async preloadNextPage(categoryId: string, currentPage: number, pageSize?: number): Promise<void> {
    const nextPage = currentPage + 1;
    const size = pageSize || this.DEFAULT_PAGE_SIZE;
    
    try {
      await this.loadCategoryPage(categoryId, nextPage, size);
    } catch (error) {
      // Silently fail preloading - not critical for UX
      console.warn(`Failed to preload page ${nextPage} for category ${categoryId}:`, error);
    }
  }
  
  /**
   * Get loading state for a specific category page
   */
  getLoadingState(categoryId: string, page: number, pageSize?: number): LoadingState | null {
    const cacheKey = this.generateCacheKey(categoryId, page, pageSize || this.DEFAULT_PAGE_SIZE);
    return this.loadingStates.get(cacheKey) || null;
  }
  
  /**
   * Clear cache for a specific category (useful when category content changes)
   */
  invalidateCategory(categoryId: string): void {
    const keysToDelete = Array.from(this.pageCache.keys())
      .filter(key => key.startsWith(`${categoryId}:`));
    
    keysToDelete.forEach(key => {
      this.pageCache.delete(key);
      this.loadingStates.delete(key);
    });
  }
  
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.pageCache.clear();
    this.loadingStates.clear();
  }
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.pageCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
  
  private async fetchCategoryPage(
    categoryId: string,
    page: number,
    pageSize: number
  ): Promise<CategoryContentPage> {
    // This would integrate with your Redux store or API
    // For now, implementing a basic pagination logic
    
    // Get all photos for the category (this should come from your existing services)
    const allPhotos = await this.getAllPhotosForCategory(categoryId);
    
    const offset = (page - 1) * pageSize;
    const photos = allPhotos.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(allPhotos.length / pageSize);
    
    return {
      categoryId,
      photos,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }
  
  private async getAllPhotosForCategory(categoryId: string): Promise<PhotoReference[]> {
    // TODO: Integrate with your existing organization services
    // This should use monthCategorizationService or sourceCategorizationService
    // depending on the category type
    
    // For now, return empty array - this will be implemented when integrating
    // with the existing CrossCategorizationService
    return [];
  }
  
  private generateCacheKey(categoryId: string, page: number, pageSize: number): string {
    return `${categoryId}:${page}:${pageSize}`;
  }
  
  private isCacheFresh(cacheKey: string, maxAge: number = 5 * 60 * 1000): boolean {
    const loadingState = this.loadingStates.get(cacheKey);
    if (!loadingState) return false;
    
    return (Date.now() - loadingState.lastLoadTime) < maxAge;
  }
  
  private setLoadingState(cacheKey: string, state: LoadingState): void {
    this.loadingStates.set(cacheKey, state);
  }
  
  private manageCacheSize(): void {
    if (this.pageCache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU)
      const oldestKeys = Array.from(this.pageCache.keys()).slice(0, 10);
      oldestKeys.forEach(key => {
        this.pageCache.delete(key);
        this.loadingStates.delete(key);
      });
    }
  }
}

/**
 * Hook for using lazy loading in React components
 */
export const useLazyLoading = () => {
  const service = LazyLoadingService.getInstance();
  
  return {
    loadPage: service.loadCategoryPage.bind(service),
    preloadNext: service.preloadNextPage.bind(service),
    getLoadingState: service.getLoadingState.bind(service),
    invalidateCategory: service.invalidateCategory.bind(service),
    clearCache: service.clearCache.bind(service),
    getCacheStats: service.getCacheStats.bind(service)
  };
};

// Singleton instance export
export const lazyLoadingService = LazyLoadingService.getInstance(); 