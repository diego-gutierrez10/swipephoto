import { PhotoAsset } from '../types/photo';
import { MonthCategory, PhotoReference } from '../types/organization';
import {
  extractMonthYear,
  generateMonthCategoryId,
  getMonthDisplayName,
  sortMonthCategoriesChronologically
} from '../utils/PhotoDateUtils';

export interface MonthCategorizationOptions {
  includeUndated?: boolean;
  sortMostRecentFirst?: boolean;
  locale?: string;
}

export interface MonthCategorizationResult {
  categories: MonthCategory[];
  photoReferences: Omit<PhotoReference, 'photo' | 'sourceCategoryId' | 'lastUpdated'>[];
  totalPhotos: number;
  undatedPhotos: number;
  monthsWithPhotos: number;
}

class MonthCategorizationService {
  /**
   * Organize photos by month categories
   * @param photos Array of photos to organize
   * @param options Configuration options
   * @returns Categorization result with month categories and references
   */
  public organizePhotosByMonth(
    photos: PhotoAsset[],
    options: MonthCategorizationOptions = {}
  ): MonthCategorizationResult {
    const {
      includeUndated = true,
      sortMostRecentFirst = true,
      locale = 'en-US'
    } = options;

    // Group photos by month
    const photosByMonth: Record<string, PhotoAsset[]> = {};
    const photoReferences: Omit<PhotoReference, 'photo' | 'sourceCategoryId' | 'lastUpdated'>[] = [];
    let undatedCount = 0;

    photos.forEach(photo => {
      if (!photo.creationTime) {
        // Handle photos without timestamps
        if (includeUndated) {
          const undatedKey = 'undated';
          photosByMonth[undatedKey] = photosByMonth[undatedKey] || [];
          photosByMonth[undatedKey].push(photo);
          undatedCount++;

          // Create photo reference for undated photos
          photoReferences.push({
            photoId: photo.id,
            monthCategoryId: undatedKey,
            organizationScore: 0.5 // Lower score for undated photos
          });
        }
        return;
      }

      // Use creation time
      const timestamp = photo.creationTime;
      const { month, year } = extractMonthYear(timestamp);
      const monthId = generateMonthCategoryId(year, month);

      photosByMonth[monthId] = photosByMonth[monthId] || [];
      photosByMonth[monthId].push(photo);

      // Create photo reference
      photoReferences.push({
        photoId: photo.id,
        monthCategoryId: monthId,
        organizationScore: 1.0 // Full score for properly dated photos
      });
    });

    // Convert to MonthCategory objects
    const now = Date.now();
    const monthCategories: MonthCategory[] = Object.entries(photosByMonth).map(([monthId, monthPhotos]) => {
      if (monthId === 'undated') {
        return {
          id: monthId,
          type: 'month' as const,
          displayName: 'Undated Photos',
          count: monthPhotos.length,
          lastUpdated: now,
          photoIds: monthPhotos.map(p => p.id),
          year: 0, // Special value for undated
          month: 0,
          monthName: 'Undated',
          fullDisplayName: 'Undated Photos'
        };
      }

      // Parse month ID to get year and month
      const [yearStr, monthStr] = monthId.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Convert to 0-11

      const displayName = getMonthDisplayName(year, month, locale);
      const monthName = new Date(year, month).toLocaleDateString(locale, { month: 'long' });

      return {
        id: monthId,
        type: 'month' as const,
        displayName,
        count: monthPhotos.length,
        lastUpdated: now,
        photoIds: monthPhotos.map(p => p.id),
        year,
        month,
        monthName,
        fullDisplayName: displayName
      };
    });

    // Sort categories if requested
    const sortedCategories = sortMostRecentFirst 
      ? sortMonthCategoriesChronologically(monthCategories)
      : monthCategories;

    return {
      categories: sortedCategories,
      photoReferences,
      totalPhotos: photos.length,
      undatedPhotos: undatedCount,
      monthsWithPhotos: monthCategories.filter(cat => cat.id !== 'undated').length
    };
  }

  /**
   * Generate month categories for a specific year
   * @param year Target year
   * @param photos Photos to check for existence in each month
   * @param locale Locale for display names
   * @returns Array of month categories for the year
   */
  public generateYearMonthCategories(
    year: number,
    photos: PhotoAsset[],
    locale = 'en-US'
  ): MonthCategory[] {
    const categories: MonthCategory[] = [];
    const now = Date.now();

    for (let month = 0; month < 12; month++) {
      const monthId = generateMonthCategoryId(year, month);
      const photosInMonth = photos.filter(photo => {
        if (!photo.creationTime) return false;
        const timestamp = photo.creationTime;
        const { month: photoMonth, year: photoYear } = extractMonthYear(timestamp);
        return photoYear === year && photoMonth === month;
      });

      if (photosInMonth.length > 0) {
        const displayName = getMonthDisplayName(year, month, locale);
        const monthName = new Date(year, month).toLocaleDateString(locale, { month: 'long' });

        categories.push({
          id: monthId,
          type: 'month' as const,
          displayName,
          count: photosInMonth.length,
          lastUpdated: now,
          photoIds: photosInMonth.map(p => p.id),
          year,
          month,
          monthName,
          fullDisplayName: displayName
        });
      }
    }

    return sortMonthCategoriesChronologically(categories);
  }

  /**
   * Get photos for a specific month category
   * @param monthId Month category ID
   * @param photos All available photos
   * @returns Photos belonging to the specified month
   */
  public getPhotosForMonth(monthId: string, photos: PhotoAsset[]): PhotoAsset[] {
    if (monthId === 'undated') {
      return photos.filter(photo => !photo.creationTime);
    }

    const [yearStr, monthStr] = monthId.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // Convert to 0-11

    return photos.filter(photo => {
      if (!photo.creationTime) return false;
      const timestamp = photo.creationTime;
      const { month: photoMonth, year: photoYear } = extractMonthYear(timestamp);
      return photoYear === year && photoMonth === month;
    });
  }

  /**
   * Get statistics about month categorization
   * @param categories Month categories
   * @returns Statistics object
   */
  public getCategoryStatistics(categories: MonthCategory[]) {
    const totalPhotos = categories.reduce((sum, cat) => sum + cat.count, 0);
    const undatedCategory = categories.find(cat => cat.id === 'undated');
    const undatedPhotos = undatedCategory ? undatedCategory.count : 0;
    const datedPhotos = totalPhotos - undatedPhotos;
    
    const years = [...new Set(
      categories
        .filter(cat => cat.id !== 'undated')
        .map(cat => cat.year)
    )].sort((a, b) => b - a);

    const monthsWithPhotos = categories.filter(cat => cat.id !== 'undated').length;
    const averagePhotosPerMonth = monthsWithPhotos > 0 ? Math.round(datedPhotos / monthsWithPhotos) : 0;

    return {
      totalPhotos,
      datedPhotos,
      undatedPhotos,
      monthsWithPhotos,
      yearsSpanned: years.length,
      years,
      averagePhotosPerMonth,
      oldestYear: years.length > 0 ? Math.min(...years) : null,
      newestYear: years.length > 0 ? Math.max(...years) : null
    };
  }

  /**
   * Validate month categorization integrity
   * @param categories Month categories
   * @param totalPhotos Expected total number of photos
   * @returns Validation result
   */
  public validateCategorization(categories: MonthCategory[], totalPhotos: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let totalCategorizedPhotos = 0;

    categories.forEach(category => {
      totalCategorizedPhotos += category.count;

      // Check if photo count matches photo IDs length
      if (category.count !== category.photoIds.length) {
        errors.push(`Category ${category.id}: count mismatch (${category.count} vs ${category.photoIds.length})`);
      }

      // Check for duplicate photo IDs within category
      const uniqueIds = new Set(category.photoIds);
      if (uniqueIds.size !== category.photoIds.length) {
        errors.push(`Category ${category.id}: contains duplicate photo IDs`);
      }
    });

    // Check total photo count
    if (totalCategorizedPhotos !== totalPhotos) {
      errors.push(`Total photo count mismatch: ${totalCategorizedPhotos} categorized vs ${totalPhotos} expected`);
    }

    // Check for duplicate category IDs
    const categoryIds = categories.map(cat => cat.id);
    const uniqueCategoryIds = new Set(categoryIds);
    if (uniqueCategoryIds.size !== categoryIds.length) {
      errors.push('Duplicate category IDs found');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const monthCategorizationService = new MonthCategorizationService();
export default monthCategorizationService; 