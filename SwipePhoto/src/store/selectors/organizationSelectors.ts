import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  MonthCategory,
  SourceCategory,
  PhotoReference,
  OrganizationState,
  PhotoSourceType
} from '../../types/organization';
import { PhotoAsset } from '../../types/photo';

// Base selectors
export const selectOrganizationState = (state: RootState): OrganizationState => 
  state.organization;

export const selectMonthCategories = (state: RootState) => 
  state.organization.monthCategories;

export const selectSourceCategories = (state: RootState) => 
  state.organization.sourceCategories;

export const selectPhotoReferences = (state: RootState) => 
  state.organization.photoReferences;

export const selectIndexes = (state: RootState) => 
  state.organization.indexes;

export const selectMetadata = (state: RootState) => 
  state.organization.metadata;

export const selectFilters = (state: RootState) => 
  state.organization.filters;

export const selectSelectedCategory = (state: RootState) => ({
  categoryId: state.organization.selectedCategoryId,
  categoryType: state.organization.selectedCategoryType
});

export const selectOrganizationError = (state: RootState) => 
  state.organization.error;

// Computed selectors
export const selectIsOrganizing = createSelector(
  [selectMetadata],
  (metadata) => metadata.isOrganizing
);

export const selectOrganizationProgress = createSelector(
  [selectMetadata],
  (metadata) => metadata.progress
);

export const selectTotalPhotos = createSelector(
  [selectMetadata],
  (metadata) => metadata.totalPhotos
);

export const selectTotalCategories = createSelector(
  [selectMetadata],
  (metadata) => metadata.totalCategories
);

// Month category selectors
export const selectMonthCategoriesArray = createSelector(
  [selectMonthCategories],
  (monthCategories) => Object.values(monthCategories)
);

export const selectMonthCategoriesSorted = createSelector(
  [selectMonthCategoriesArray],
  (categories) => [...categories].sort((a, b) => {
    // Sort by year first, then by month (most recent first)
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  })
);

export const selectMonthsByYear = createSelector(
  [selectIndexes, selectMonthCategories],
  (indexes, monthCategories) => {
    const result: Record<number, MonthCategory[]> = {};
    
    Object.entries(indexes.monthsByYear).forEach(([year, categoryIds]) => {
      const yearNum = parseInt(year, 10);
      result[yearNum] = categoryIds
        .map(id => monthCategories[id])
        .filter(Boolean)
        .sort((a, b) => b.month - a.month); // Most recent first
    });
    
    return result;
  }
);

export const selectRecentMonthCategories = createSelector(
  [selectMonthCategoriesSorted],
  (categories) => categories.slice(0, 6) // Last 6 months
);

// Source category selectors
export const selectSourceCategoriesArray = createSelector(
  [selectSourceCategories],
  (sourceCategories) => Object.values(sourceCategories)
);

export const selectSourceCategoriesSorted = createSelector(
  [selectSourceCategoriesArray],
  (categories) => [...categories].sort((a, b) => {
    // Sort by count (descending), then by name
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.displayName.localeCompare(b.displayName);
  })
);

export const selectSourcesByType = createSelector(
  [selectIndexes, selectSourceCategories],
  (indexes, sourceCategories) => {
    const result: Record<PhotoSourceType, SourceCategory[]> = {} as any;
    
    Object.entries(indexes.sourcesByType).forEach(([sourceType, categoryIds]) => {
      const type = sourceType as PhotoSourceType;
      result[type] = categoryIds
        .map(id => sourceCategories[id])
        .filter(Boolean)
        .sort((a, b) => b.count - a.count); // Most photos first
    });
    
    return result;
  }
);

// Photo selectors
export const selectPhotosByCategory = createSelector(
  [selectPhotoReferences, (state: RootState, categoryId: string) => categoryId],
  (photoReferences, categoryId) => {
    return Object.values(photoReferences)
      .filter(ref => 
        ref.monthCategoryId === categoryId || 
        ref.sourceCategoryId === categoryId
      )
      .map(ref => ref.photo)
      .sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0)); // Most recent first
  }
);

export const selectPhotosByMonthCategory = createSelector(
  [selectPhotoReferences, (state: RootState, categoryId: string) => categoryId],
  (photoReferences, categoryId) => {
    return Object.values(photoReferences)
      .filter(ref => ref.monthCategoryId === categoryId)
      .map(ref => ref.photo)
      .sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
  }
);

export const selectPhotosBySourceCategory = createSelector(
  [selectPhotoReferences, (state: RootState, categoryId: string) => categoryId],
  (photoReferences, categoryId) => {
    return Object.values(photoReferences)
      .filter(ref => ref.sourceCategoryId === categoryId)
      .map(ref => ref.photo)
      .sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
  }
);

export const selectPhotoCategories = createSelector(
  [selectIndexes, (state: RootState, photoId: string) => photoId],
  (indexes, photoId) => {
    return indexes.photoToCategories[photoId] || null;
  }
);

// Category statistics
export const selectCategoryStats = createSelector(
  [selectMonthCategoriesArray, selectSourceCategoriesArray],
  (monthCategories, sourceCategories) => {
    const monthStats = {
      total: monthCategories.length,
      withPhotos: monthCategories.filter(cat => cat.count > 0).length,
      totalPhotos: monthCategories.reduce((sum, cat) => sum + cat.count, 0),
      averagePhotosPerMonth: monthCategories.length > 0 
        ? monthCategories.reduce((sum, cat) => sum + cat.count, 0) / monthCategories.length 
        : 0
    };
    
    const sourceStats = {
      total: sourceCategories.length,
      withPhotos: sourceCategories.filter(cat => cat.count > 0).length,
      totalPhotos: sourceCategories.reduce((sum, cat) => sum + cat.count, 0),
      averagePhotosPerSource: sourceCategories.length > 0 
        ? sourceCategories.reduce((sum, cat) => sum + cat.count, 0) / sourceCategories.length 
        : 0
    };
    
    return {
      months: monthStats,
      sources: sourceStats
    };
  }
);

// Search and filter selectors
export const selectFilteredMonthCategories = createSelector(
  [selectMonthCategoriesSorted, selectFilters],
  (categories, filters) => {
    let filtered = [...categories];
    
    // Apply date range filter
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      filtered = filtered.filter(category => {
        const categoryDate = new Date(category.year, category.month);
        return categoryDate >= startDate && categoryDate <= endDate;
      });
    }
    
    // Apply minimum photos filter
    if (filters.minPhotos !== undefined) {
      filtered = filtered.filter(category => category.count >= filters.minPhotos!);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          if (a.year !== b.year) {
            comparison = a.year - b.year;
          } else {
            comparison = a.month - b.month;
          }
          break;
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }
);

export const selectFilteredSourceCategories = createSelector(
  [selectSourceCategoriesSorted, selectFilters],
  (categories, filters) => {
    let filtered = [...categories];
    
    // Apply source type filter
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(category => 
        filters.sources!.includes(category.sourceType)
      );
    }
    
    // Apply minimum photos filter
    if (filters.minPhotos !== undefined) {
      filtered = filtered.filter(category => category.count >= filters.minPhotos!);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'date':
          comparison = a.lastUpdated - b.lastUpdated;
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }
);

// Utility selectors
export const selectHasPhotos = createSelector(
  [selectTotalPhotos],
  (totalPhotos) => totalPhotos > 0
);

export const selectHasCategories = createSelector(
  [selectTotalCategories],
  (totalCategories) => totalCategories > 0
);

export const selectOrganizationStatus = createSelector(
  [selectMetadata, selectOrganizationError],
  (metadata, error) => ({
    isOrganizing: metadata.isOrganizing,
    progress: metadata.progress,
    lastOrganized: metadata.lastOrganized,
    error,
    hasData: metadata.totalPhotos > 0
  })
);

// Cross-categorization selectors
export const selectCrossCategorizationStats = createSelector(
  [selectMonthCategoriesArray, selectSourceCategoriesArray, selectPhotoReferences],
  (monthCategories, sourceCategories, photoReferences) => {
    const photoReferencesList = Object.values(photoReferences);
    const totalPhotos = new Set(photoReferencesList.map(ref => ref.photoId)).size;
    const crossReferences = photoReferencesList.filter(ref => 
      ref.monthCategoryId && ref.sourceCategoryId
    ).length;
    
    return {
      totalPhotos,
      crossReferences,
      crossReferencePercentage: totalPhotos > 0 ? (crossReferences / totalPhotos) * 100 : 0,
      monthCategories: monthCategories.length,
      sourceCategories: sourceCategories.length,
      totalCategories: monthCategories.length + sourceCategories.length
    };
  }
);

export const selectPhotosInIntersection = createSelector(
  [selectPhotoReferences, (state: RootState, monthCategoryId: string, sourceCategoryId: string) => ({ monthCategoryId, sourceCategoryId })],
  (photoReferences, { monthCategoryId, sourceCategoryId }) => {
    return Object.values(photoReferences)
      .filter(ref => 
        ref.monthCategoryId === monthCategoryId && 
        ref.sourceCategoryId === sourceCategoryId
      )
      .map(ref => ref.photoId);
  }
);

export const selectCategoryIntersections = createSelector(
  [selectMonthCategoriesArray, selectSourceCategoriesArray, selectPhotoReferences],
  (monthCategories, sourceCategories, photoReferences) => {
    const photoReferencesList = Object.values(photoReferences);
    const intersections: Array<{
      monthCategoryId: string;
      sourceCategoryId: string;
      monthDisplayName: string;
      sourceDisplayName: string;
      photoIds: string[];
      count: number;
      percentage: number;
    }> = [];

    monthCategories.forEach(monthCat => {
      sourceCategories.forEach(sourceCat => {
        const photoIds = photoReferencesList
          .filter(ref => 
            ref.monthCategoryId === monthCat.id && 
            ref.sourceCategoryId === sourceCat.id
          )
          .map(ref => ref.photoId);

        if (photoIds.length > 0) {
          const percentage = monthCat.count > 0 ? (photoIds.length / monthCat.count) * 100 : 0;
          
          intersections.push({
            monthCategoryId: monthCat.id,
            sourceCategoryId: sourceCat.id,
            monthDisplayName: monthCat.displayName,
            sourceDisplayName: sourceCat.displayName,
            photoIds,
            count: photoIds.length,
            percentage
          });
        }
      });
    });

    return intersections.sort((a, b) => b.count - a.count);
  }
);

export const selectTopCategoryIntersections = createSelector(
  [selectCategoryIntersections],
  (intersections) => intersections.slice(0, 10)
);

export const selectPhotoCategoryInfo = createSelector(
  [selectMonthCategoriesArray, selectSourceCategoriesArray, (state: RootState, photoId: string) => photoId],
  (monthCategories, sourceCategories, photoId) => {
    const monthCategory = monthCategories.find(cat => 
      cat.photoIds.includes(photoId)
    ) || null;

    const sourceCategory = sourceCategories.find(cat => 
      cat.photoIds.includes(photoId)
    ) || null;

    return {
      photoId,
      monthCategory,
      sourceCategory,
      hasMultipleCategories: !!(monthCategory && sourceCategory),
      isUncategorized: !monthCategory && !sourceCategory
    };
  }
); 