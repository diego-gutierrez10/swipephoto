import { PhotoAsset } from '../types/photo';
import { SourceCategory, PhotoSourceType } from '../types/organization';
import {
  detectPhotoSource,
  generateSourceCategoryId,
  getSourceDisplayName,
  getSourceIcon,
  getSourceDescription,
  sortSourcesByPriority
} from '../utils/PhotoSourceUtils';

export interface SourceCategorizationOptions {
  includeUnknown?: boolean;
  sortByCount?: boolean;
  locale?: string;
}

export interface SourceCategorizationResult {
  categories: SourceCategory[];
  photoReferences: Omit<any, 'monthCategoryId'>[];
  totalPhotos: number;
  unknownPhotos: number;
  sourcesWithPhotos: number;
}

class SourceCategorizationService {
  /**
   * Organize photos by source categories
   * @param photos Array of photos to organize
   * @param options Configuration options
   * @returns Categorization result with source categories and references
   */
  public organizePhotosBySource(
    photos: PhotoAsset[],
    options: SourceCategorizationOptions = {}
  ): SourceCategorizationResult {
    const {
      includeUnknown = true,
      sortByCount = true,
      locale = 'en-US'
    } = options;

    // Group photos by source type
    const photosBySource: Record<PhotoSourceType, PhotoAsset[]> = {} as Record<PhotoSourceType, PhotoAsset[]>;
    const photoReferences: any[] = [];
    let unknownCount = 0;

    photos.forEach(photo => {
      const sourceType = detectPhotoSource(photo);
      
      // Handle unknown sources
      if (sourceType === PhotoSourceType.UNKNOWN) {
        unknownCount++;
        if (!includeUnknown) {
          return;
        }
      }

      // Initialize source group if needed
      if (!photosBySource[sourceType]) {
        photosBySource[sourceType] = [];
      }

      photosBySource[sourceType].push(photo);

      // Create photo reference for source categorization
      photoReferences.push({
        photoId: photo.id,
        sourceCategoryId: generateSourceCategoryId(sourceType),
        monthCategoryId: null, // Will be set by month categorization
        organizationScore: sourceType === PhotoSourceType.UNKNOWN ? 0.3 : 0.8,
        lastUpdated: Date.now()
      });
    });

    // Convert to SourceCategory objects
    const sourceCategories: SourceCategory[] = Object.entries(photosBySource).map(([sourceTypeStr, sourcePhotos]) => {
      const sourceType = sourceTypeStr as PhotoSourceType;
      const categoryId = generateSourceCategoryId(sourceType);
      
      return {
        id: categoryId,
        displayName: getSourceDisplayName(sourceType, locale),
        count: sourcePhotos.length,
        photoIds: sourcePhotos.map(p => p.id),
        sourceType,
        icon: getSourceIcon(sourceType),
        description: getSourceDescription(sourceType),
        type: 'source',
        lastUpdated: Date.now()
      };
    });

    // Sort categories
    const sortedCategories = sortByCount 
      ? sourceCategories.sort((a, b) => b.count - a.count)
      : sourceCategories.sort((a, b) => {
          const priorityOrder = sortSourcesByPriority([a.sourceType, b.sourceType]);
          return priorityOrder.indexOf(a.sourceType) - priorityOrder.indexOf(b.sourceType);
        });

    return {
      categories: sortedCategories,
      photoReferences,
      totalPhotos: photos.length,
      unknownPhotos: unknownCount,
      sourcesWithPhotos: Object.keys(photosBySource).length
    };
  }

  /**
   * Generate source categories for specific source types
   * @param sourceTypes Target source types to create categories for
   * @param photos Photos to check for existence in each source
   * @param locale Locale for display names
   * @returns Array of source categories
   */
  public generateSourceCategories(
    sourceTypes: PhotoSourceType[],
    photos: PhotoAsset[],
    locale = 'en-US'
  ): SourceCategory[] {
    const categories: SourceCategory[] = [];

    sourceTypes.forEach(sourceType => {
      const categoryId = generateSourceCategoryId(sourceType);
      const photosInSource = photos.filter(photo => 
        detectPhotoSource(photo) === sourceType
      );

      if (photosInSource.length > 0) {
        categories.push({
          id: categoryId,
          displayName: getSourceDisplayName(sourceType, locale),
          count: photosInSource.length,
          photoIds: photosInSource.map(p => p.id),
          sourceType,
          icon: getSourceIcon(sourceType),
          description: getSourceDescription(sourceType),
          type: 'source',
          lastUpdated: Date.now()
        });
      }
    });

    return categories;
  }

  /**
   * Get photos for a specific source category
   * @param sourceType Source type to filter by
   * @param photos All available photos
   * @returns Photos belonging to the specified source
   */
  public getPhotosForSource(sourceType: PhotoSourceType, photos: PhotoAsset[]): PhotoAsset[] {
    return photos.filter(photo => detectPhotoSource(photo) === sourceType);
  }

  /**
   * Get statistics about source categorization
   * @param photos Photos to analyze
   * @returns Statistics object with counts by source
   */
  public getCategoryStatistics(photos: PhotoAsset[]): Record<PhotoSourceType, number> {
    const stats: Record<PhotoSourceType, number> = {} as Record<PhotoSourceType, number>;

    // Initialize all source types with 0
    Object.values(PhotoSourceType).forEach(sourceType => {
      stats[sourceType] = 0;
    });

    // Count photos by source type
    photos.forEach(photo => {
      const sourceType = detectPhotoSource(photo);
      stats[sourceType]++;
    });

    return stats;
  }

  /**
   * Validate source categorization for consistency
   * @param photos Photos to validate
   * @param categories Existing categories
   * @returns Validation result with any issues found
   */
  public validateCategorization(
    photos: PhotoAsset[], 
    categories: SourceCategory[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for missing photos in categories
    const categorizedPhotoIds = new Set(
      categories.flatMap(cat => cat.photoIds)
    );
    
    const uncategorizedPhotos = photos.filter(photo => 
      !categorizedPhotoIds.has(photo.id)
    );
    
    if (uncategorizedPhotos.length > 0) {
      issues.push(`${uncategorizedPhotos.length} photos are not categorized`);
    }

    // Check for duplicate photo references
    const allPhotoIds = categories.flatMap(cat => cat.photoIds);
    const uniquePhotoIds = new Set(allPhotoIds);
    
    if (allPhotoIds.length !== uniquePhotoIds.size) {
      issues.push('Some photos appear in multiple source categories');
    }

    // Check category counts match actual photo counts
    categories.forEach(category => {
      if (category.count !== category.photoIds.length) {
        issues.push(`Category ${category.displayName} count mismatch`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Merge categories with the same source type
   * @param categories Categories to merge
   * @returns Merged categories
   */
  public mergeCategories(categories: SourceCategory[]): SourceCategory[] {
    const mergedMap = new Map<PhotoSourceType, SourceCategory>();

    categories.forEach(category => {
      const existing = mergedMap.get(category.sourceType);
      
      if (existing) {
        // Merge photo IDs and update count
        const mergedPhotoIds = Array.from(new Set([
          ...existing.photoIds,
          ...category.photoIds
        ]));
        
        existing.photoIds = mergedPhotoIds;
        existing.count = mergedPhotoIds.length;
        existing.lastUpdated = Math.max(existing.lastUpdated, category.lastUpdated);
      } else {
        mergedMap.set(category.sourceType, { ...category });
      }
    });

    return Array.from(mergedMap.values());
  }
}

// Export singleton instance
export const sourceCategorizationService = new SourceCategorizationService();
export default SourceCategorizationService; 