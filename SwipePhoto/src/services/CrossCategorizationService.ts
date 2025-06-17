import { PhotoAsset } from '../types/photo';
import { MonthCategory, SourceCategory, PhotoReference, PhotoSourceType } from '../types/organization';
import { monthCategorizationService } from './MonthCategorizationService';
import { sourceCategorizationService } from './SourceCategorizationService';

export interface CrossCategorizationOptions {
  includeUndated?: boolean;
  includeUnknownSources?: boolean;
  sortMostRecentFirst?: boolean;
  locale?: string;
}

export interface CrossCategorizationResult {
  monthCategories: MonthCategory[];
  sourceCategories: SourceCategory[];
  photoReferences: PhotoReference[];
  totalPhotos: number;
  categorizedPhotos: number;
  uncategorizedPhotos: number;
  categoriesCreated: number;
  crossReferenceCount: number;
}

export interface PhotoCategoryInfo {
  photoId: string;
  monthCategory: MonthCategory | null;
  sourceCategory: SourceCategory | null;
  organizationScore: number;
}

export interface CategoryIntersection {
  monthCategoryId: string;
  sourceCategoryId: string;
  photoIds: string[];
  count: number;
  displayName: string;
}

class CrossCategorizationService {
  private monthService: typeof monthCategorizationService;
  private sourceService: typeof sourceCategorizationService;

  constructor() {
    this.monthService = monthCategorizationService;
    this.sourceService = sourceCategorizationService;
  }

  /**
   * Organize photos with both month and source categorization
   * @param photos Array of photos to organize
   * @param options Configuration options
   * @returns Complete cross-categorization result
   */
  public organizePhotosWithCrossCategories(
    photos: PhotoAsset[],
    options: CrossCategorizationOptions = {}
  ): CrossCategorizationResult {
    const {
      includeUndated = true,
      includeUnknownSources = true,
      sortMostRecentFirst = true,
      locale = 'en-US'
    } = options;

    // Perform month-based categorization
    const monthResult = this.monthService.organizePhotosByMonth(photos, {
      includeUndated,
      sortMostRecentFirst,
      locale
    });

    // Perform source-based categorization
    const sourceResult = this.sourceService.organizePhotosBySource(photos, {
      includeUnknown: includeUnknownSources,
      locale
    });

    // Create cross-references
    const photoReferences = this.createCrossReferences(
      photos,
      monthResult.categories,
      sourceResult.categories
    );

    const categorizedPhotos = new Set(photoReferences.map(ref => ref.photoId)).size;
    const uncategorizedPhotos = photos.length - categorizedPhotos;

    return {
      monthCategories: monthResult.categories,
      sourceCategories: sourceResult.categories,
      photoReferences,
      totalPhotos: photos.length,
      categorizedPhotos,
      uncategorizedPhotos,
      categoriesCreated: monthResult.categories.length + sourceResult.categories.length,
      crossReferenceCount: photoReferences.length
    };
  }

  /**
   * Create cross-references between month and source categories
   * @param photos Original photos array
   * @param monthCategories Month categories
   * @param sourceCategories Source categories
   * @returns Array of photo references with both month and source category IDs
   */
  public createCrossReferences(
    photos: PhotoAsset[],
    monthCategories: MonthCategory[],
    sourceCategories: SourceCategory[]
  ): PhotoReference[] {
    const references: PhotoReference[] = [];

    // Create lookup maps for performance
    const monthLookup = new Map<string, MonthCategory>();
    monthCategories.forEach(category => {
      category.photoIds.forEach(photoId => {
        monthLookup.set(photoId, category);
      });
    });

    const sourceLookup = new Map<string, SourceCategory>();
    sourceCategories.forEach(category => {
      category.photoIds.forEach(photoId => {
        sourceLookup.set(photoId, category);
      });
    });

    // Create cross-references for each photo
    photos.forEach(photo => {
      const monthCategory = monthLookup.get(photo.id);
      const sourceCategory = sourceLookup.get(photo.id);

      if (monthCategory || sourceCategory) {
        const organizationScore = this.calculateOrganizationScore(
          photo,
          monthCategory,
          sourceCategory
        );

        references.push({
          photoId: photo.id,
          photo: photo,
          monthCategoryId: monthCategory?.id ?? null,
          sourceCategoryId: sourceCategory?.id ?? null,
          organizationScore,
          lastUpdated: Date.now()
        });
      }
    });

    return references;
  }

  /**
   * Calculate organization score based on categorization quality
   * @param photo Original photo
   * @param monthCategory Month category (if any)
   * @param sourceCategory Source category (if any)
   * @returns Organization score (0.0 - 1.0)
   */
  private calculateOrganizationScore(
    photo: PhotoAsset,
    monthCategory: MonthCategory | null,
    sourceCategory: SourceCategory | null
  ): number {
    let score = 0;

    // Base score for having any categorization
    if (monthCategory || sourceCategory) {
      score += 0.3;
    }

    // Month categorization score
    if (monthCategory) {
      if (monthCategory.id === 'undated') {
        score += 0.2; // Lower score for undated photos
      } else {
        score += 0.4; // Good score for dated photos
      }
    }

    // Source categorization score
    if (sourceCategory) {
      switch (sourceCategory.sourceType) {
        case PhotoSourceType.CAMERA_ROLL:
          score += 0.3;
          break;
        case PhotoSourceType.WHATSAPP:
        case PhotoSourceType.INSTAGRAM:
        case PhotoSourceType.TELEGRAM:
          score += 0.25;
          break;
        case PhotoSourceType.SCREENSHOTS:
          score += 0.2;
          break;
        case PhotoSourceType.OTHER_APPS:
          score += 0.15;
          break;
        case PhotoSourceType.UNKNOWN:
          score += 0.1;
          break;
      }
    }

    // Bonus for having both categorizations
    if (monthCategory && sourceCategory) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Find all categories that contain a specific photo
   * @param photoId Photo ID to search for
   * @param monthCategories Month categories
   * @param sourceCategories Source categories
   * @returns Category information for the photo
   */
  public findPhotoInCategories(
    photoId: string,
    monthCategories: MonthCategory[],
    sourceCategories: SourceCategory[]
  ): PhotoCategoryInfo {
    const monthCategory = monthCategories.find(cat => 
      cat.photoIds.includes(photoId)
    ) ?? null;

    const sourceCategory = sourceCategories.find(cat => 
      cat.photoIds.includes(photoId)
    ) ?? null;

    const organizationScore = monthCategory || sourceCategory ? 
      this.calculateOrganizationScore(
        { id: photoId } as PhotoAsset,
        monthCategory ?? null,
        sourceCategory ?? null
      ) : 0;

    return {
      photoId,
      monthCategory,
      sourceCategory,
      organizationScore
    };
  }

  /**
   * Get photos that appear in both specific month and source categories
   * @param monthCategoryId Month category ID
   * @param sourceCategoryId Source category ID
   * @param photoReferences All photo references
   * @returns Array of photo IDs in the intersection
   */
  public getPhotosIntersection(
    monthCategoryId: string,
    sourceCategoryId: string,
    photoReferences: PhotoReference[]
  ): string[] {
    return photoReferences
      .filter(ref => 
        ref.monthCategoryId === monthCategoryId && 
        ref.sourceCategoryId === sourceCategoryId
      )
      .map(ref => ref.photoId);
  }

  /**
   * Get all category intersections with photo counts
   * @param monthCategories Month categories
   * @param sourceCategories Source categories
   * @param photoReferences All photo references
   * @returns Array of category intersections
   */
  public getCategoryIntersections(
    monthCategories: MonthCategory[],
    sourceCategories: SourceCategory[],
    photoReferences: PhotoReference[]
  ): CategoryIntersection[] {
    const intersections: CategoryIntersection[] = [];

    monthCategories.forEach(monthCat => {
      sourceCategories.forEach(sourceCat => {
        const photoIds = this.getPhotosIntersection(
          monthCat.id,
          sourceCat.id,
          photoReferences
        );

        if (photoIds.length > 0) {
          intersections.push({
            monthCategoryId: monthCat.id,
            sourceCategoryId: sourceCat.id,
            photoIds,
            count: photoIds.length,
            displayName: `${monthCat.displayName} • ${sourceCat.displayName}`
          });
        }
      });
    });

    return intersections.sort((a, b) => b.count - a.count);
  }

  /**
   * Validate cross-categorization integrity
   * @param photos Original photos
   * @param monthCategories Month categories
   * @param sourceCategories Source categories
   * @param photoReferences Photo references
   * @returns Validation results
   */
  public validateCrossCategorization(
    photos: PhotoAsset[],
    monthCategories: MonthCategory[],
    sourceCategories: SourceCategory[],
    photoReferences: PhotoReference[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
      totalPhotos: number;
      referencedPhotos: number;
      orphanedReferences: number;
      duplicateReferences: number;
      monthCategoriesWithPhotos: number;
      sourceCategoriesWithPhotos: number;
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create photo ID set for validation
    const photoIds = new Set(photos.map(p => p.id));
    const referencedPhotoIds = new Set(photoReferences.map(ref => ref.photoId));

    // Check for orphaned references
    const orphanedReferences = photoReferences.filter(ref => 
      !photoIds.has(ref.photoId)
    );

    if (orphanedReferences.length > 0) {
      errors.push(`Found ${orphanedReferences.length} orphaned photo references`);
    }

    // Check for duplicate references
    const uniqueRefs = new Set(photoReferences.map(ref => ref.photoId));
    const duplicateReferences = photoReferences.length - uniqueRefs.size;

    if (duplicateReferences > 0) {
      errors.push(`Found ${duplicateReferences} duplicate photo references`);
    }

    // Check category reference integrity
    const monthCategoryIds = new Set(monthCategories.map(cat => cat.id));
    const sourceCategoryIds = new Set(sourceCategories.map(cat => cat.id));

    photoReferences.forEach(ref => {
      if (ref.monthCategoryId && !monthCategoryIds.has(ref.monthCategoryId)) {
        errors.push(`Reference to non-existent month category: ${ref.monthCategoryId}`);
      }
      if (ref.sourceCategoryId && !sourceCategoryIds.has(ref.sourceCategoryId)) {
        errors.push(`Reference to non-existent source category: ${ref.sourceCategoryId}`);
      }
    });

    // Count active categories
    const monthCategoriesWithPhotos = monthCategories.filter(cat => cat.count > 0).length;
    const sourceCategoriesWithPhotos = sourceCategories.filter(cat => cat.count > 0).length;

    // Performance warnings
    if (photoReferences.length > 10000) {
      warnings.push('Large number of photo references may impact performance');
    }

    if (monthCategories.length > 100) {
      warnings.push('Large number of month categories may impact UI performance');
    }

    const statistics = {
      totalPhotos: photos.length,
      referencedPhotos: referencedPhotoIds.size,
      orphanedReferences: orphanedReferences.length,
      duplicateReferences,
      monthCategoriesWithPhotos,
      sourceCategoriesWithPhotos
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics
    };
  }
}

export default new CrossCategorizationService(); 