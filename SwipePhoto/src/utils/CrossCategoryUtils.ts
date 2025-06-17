import { PhotoAsset } from '../types/photo';
import { MonthCategory, SourceCategory, PhotoReference, PhotoSourceType } from '../types/organization';

/**
 * Get all categories that contain a specific photo
 * @param photoId Photo ID to search for
 * @param monthCategories Month categories to search in
 * @param sourceCategories Source categories to search in
 * @returns Object containing the categories and scores
 */
export const getCategoriesForPhoto = (
  photoId: string,
  monthCategories: MonthCategory[],
  sourceCategories: SourceCategory[]
): {
  monthCategory: MonthCategory | null;
  sourceCategory: SourceCategory | null;
  hasMultipleCategories: boolean;
} => {
  const monthCategory = monthCategories.find(cat => 
    cat.photoIds.includes(photoId)
  ) || null;

  const sourceCategory = sourceCategories.find(cat => 
    cat.photoIds.includes(photoId)
  ) || null;

  return {
    monthCategory,
    sourceCategory,
    hasMultipleCategories: !!(monthCategory && sourceCategory)
  };
};

/**
 * Find photos that appear in both specified categories
 * @param monthCategoryId Month category ID
 * @param sourceCategoryId Source category ID
 * @param photoReferences All photo references
 * @returns Array of photo IDs in the intersection
 */
export const getPhotosInIntersection = (
  monthCategoryId: string,
  sourceCategoryId: string,
  photoReferences: PhotoReference[]
): string[] => {
  return photoReferences
    .filter(ref => 
      ref.monthCategoryId === monthCategoryId && 
      ref.sourceCategoryId === sourceCategoryId
    )
    .map(ref => ref.photoId);
};

/**
 * Get photos that match any of the specified criteria
 * @param criteria Search criteria
 * @param photos All photos
 * @param monthCategories Month categories
 * @param sourceCategories Source categories
 * @returns Filtered photos
 */
export const getPhotosMatchingCriteria = (
  criteria: {
    monthCategoryIds?: string[];
    sourceCategoryIds?: string[];
    sourceTypes?: PhotoSourceType[];
    dateRange?: { start: number; end: number };
    hasLocation?: boolean;
  },
  photos: PhotoAsset[],
  monthCategories: MonthCategory[],
  sourceCategories: SourceCategory[]
): PhotoAsset[] => {
  return photos.filter(photo => {
    // Check month criteria
    if (criteria.monthCategoryIds && criteria.monthCategoryIds.length > 0) {
      const monthCategory = monthCategories.find(cat => cat.photoIds.includes(photo.id));
      if (!monthCategory || !criteria.monthCategoryIds.includes(monthCategory.id)) {
        return false;
      }
    }

    // Check source criteria
    if (criteria.sourceCategoryIds && criteria.sourceCategoryIds.length > 0) {
      const sourceCategory = sourceCategories.find(cat => cat.photoIds.includes(photo.id));
      if (!sourceCategory || !criteria.sourceCategoryIds.includes(sourceCategory.id)) {
        return false;
      }
    }

    // Check source type criteria
    if (criteria.sourceTypes && criteria.sourceTypes.length > 0) {
      const sourceCategory = sourceCategories.find(cat => cat.photoIds.includes(photo.id));
      if (!sourceCategory || !criteria.sourceTypes.includes(sourceCategory.sourceType)) {
        return false;
      }
    }

    // Check date range criteria
    if (criteria.dateRange && photo.creationTime) {
      if (photo.creationTime < criteria.dateRange.start || photo.creationTime > criteria.dateRange.end) {
        return false;
      }
    }

    // Check location criteria (location data not available in current PhotoAsset type)
    // TODO: Add location support when PhotoAsset type includes location data
    if (criteria.hasLocation !== undefined) {
      // For now, assume no photos have location data
      if (criteria.hasLocation) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Validate reference integrity between photos and categories
 * @param photos Original photos array
 * @param photoReferences Photo references
 * @param monthCategories Month categories
 * @param sourceCategories Source categories
 * @returns Validation result with detailed information
 */
export const validateReferenceIntegrity = (
  photos: PhotoAsset[],
  photoReferences: PhotoReference[],
  monthCategories: MonthCategory[],
  sourceCategories: SourceCategory[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    totalPhotos: number;
    referencedPhotos: number;
    monthCategories: number;
    sourceCategories: number;
    crossReferences: number;
    orphanedReferences: number;
  };
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create sets for efficient lookup
  const photoIds = new Set(photos.map(p => p.id));
  const monthCategoryIds = new Set(monthCategories.map(c => c.id));
  const sourceCategoryIds = new Set(sourceCategories.map(c => c.id));

  // Check for orphaned references
  let orphanedCount = 0;
  photoReferences.forEach(ref => {
    if (!photoIds.has(ref.photoId)) {
      errors.push(`Reference to non-existent photo: ${ref.photoId}`);
      orphanedCount++;
    }

    if (ref.monthCategoryId && !monthCategoryIds.has(ref.monthCategoryId)) {
      errors.push(`Reference to non-existent month category: ${ref.monthCategoryId}`);
    }

    if (ref.sourceCategoryId && !sourceCategoryIds.has(ref.sourceCategoryId)) {
      errors.push(`Reference to non-existent source category: ${ref.sourceCategoryId}`);
    }
  });

  // Check for duplicate references
  const refKeys = photoReferences.map(ref => ref.photoId);
  const uniqueRefKeys = new Set(refKeys);
  if (refKeys.length !== uniqueRefKeys.size) {
    warnings.push('Duplicate photo references found');
  }

  // Count cross-references (photos with both month and source categories)
  const crossReferences = photoReferences.filter(ref => 
    ref.monthCategoryId && ref.sourceCategoryId
  ).length;

  // Check for missing references
  const referencedPhotoIds = new Set(photoReferences.map(ref => ref.photoId));
  const unreferencedPhotos = photos.filter(photo => !referencedPhotoIds.has(photo.id));
  
  if (unreferencedPhotos.length > 0) {
    warnings.push(`${unreferencedPhotos.length} photos are not referenced in any category`);
  }

  const statistics = {
    totalPhotos: photos.length,
    referencedPhotos: referencedPhotoIds.size,
    monthCategories: monthCategories.length,
    sourceCategories: sourceCategories.length,
    crossReferences,
    orphanedReferences: orphanedCount
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics
  };
};

/**
 * Calculate intersection statistics between categories
 * @param monthCategories Month categories
 * @param sourceCategories Source categories
 * @param photoReferences Photo references
 * @returns Intersection statistics
 */
export const calculateIntersectionStatistics = (
  monthCategories: MonthCategory[],
  sourceCategories: SourceCategory[],
  photoReferences: PhotoReference[]
): {
  totalIntersections: number;
  largestIntersection: { monthId: string; sourceId: string; count: number } | null;
  averageIntersectionSize: number;
  emptyIntersections: number;
  intersectionMatrix: Array<{
    monthId: string;
    sourceId: string;
    count: number;
    percentage: number;
  }>;
} => {
  const intersections: Array<{
    monthId: string;
    sourceId: string;
    count: number;
    percentage: number;
  }> = [];

  let totalIntersectionPhotos = 0;
  let maxIntersection = { monthId: '', sourceId: '', count: 0 };

  monthCategories.forEach(monthCat => {
    sourceCategories.forEach(sourceCat => {
      const photosInIntersection = getPhotosInIntersection(
        monthCat.id,
        sourceCat.id,
        photoReferences
      );

      const count = photosInIntersection.length;
      const percentage = monthCat.count > 0 ? (count / monthCat.count) * 100 : 0;

      intersections.push({
        monthId: monthCat.id,
        sourceId: sourceCat.id,
        count,
        percentage
      });

      totalIntersectionPhotos += count;

      if (count > maxIntersection.count) {
        maxIntersection = { monthId: monthCat.id, sourceId: sourceCat.id, count };
      }
    });
  });

  const totalPossibleIntersections = monthCategories.length * sourceCategories.length;
  const emptyIntersections = intersections.filter(i => i.count === 0).length;
  const averageIntersectionSize = intersections.length > 0 
    ? totalIntersectionPhotos / intersections.filter(i => i.count > 0).length
    : 0;

  return {
    totalIntersections: intersections.filter(i => i.count > 0).length,
    largestIntersection: maxIntersection.count > 0 ? maxIntersection : null,
    averageIntersectionSize,
    emptyIntersections,
    intersectionMatrix: intersections.sort((a, b) => b.count - a.count)
  };
};

/**
 * Generate search suggestions based on existing categories
 * @param monthCategories Month categories
 * @param sourceCategories Source categories
 * @param photoReferences Photo references
 * @returns Suggested search combinations
 */
export const generateSearchSuggestions = (
  monthCategories: MonthCategory[],
  sourceCategories: SourceCategory[],
  photoReferences: PhotoReference[]
): Array<{
  type: 'month' | 'source' | 'intersection';
  displayName: string;
  categoryIds: string[];
  photoCount: number;
  confidence: number;
}> => {
  const suggestions: Array<{
    type: 'month' | 'source' | 'intersection';
    displayName: string;
    categoryIds: string[];
    photoCount: number;
    confidence: number;
  }> = [];

  // Top month categories by photo count
  const topMonthCategories = monthCategories
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  topMonthCategories.forEach(cat => {
    suggestions.push({
      type: 'month',
      displayName: cat.displayName,
      categoryIds: [cat.id],
      photoCount: cat.count,
      confidence: 0.9
    });
  });

  // Top source categories by photo count
  const topSourceCategories = sourceCategories
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  topSourceCategories.forEach(cat => {
    suggestions.push({
      type: 'source',
      displayName: cat.displayName,
      categoryIds: [cat.id],
      photoCount: cat.count,
      confidence: 0.8
    });
  });

  // Top intersections
  const intersectionStats = calculateIntersectionStatistics(
    monthCategories,
    sourceCategories,
    photoReferences
  );

  intersectionStats.intersectionMatrix
    .filter(intersection => intersection.count > 0)
    .slice(0, 3)
    .forEach(intersection => {
      const monthCat = monthCategories.find(c => c.id === intersection.monthId);
      const sourceCat = sourceCategories.find(c => c.id === intersection.sourceId);
      
      if (monthCat && sourceCat) {
        suggestions.push({
          type: 'intersection',
          displayName: `${monthCat.displayName} • ${sourceCat.displayName}`,
          categoryIds: [monthCat.id, sourceCat.id],
          photoCount: intersection.count,
          confidence: 0.7
        });
      }
    });

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}; 