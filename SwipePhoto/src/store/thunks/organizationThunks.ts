/**
 * organizationThunks.ts
 * 
 * Async thunk actions for photo organization operations
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import type { PhotoAsset } from '../../types/photo';
import type { BatchOrganizationRequest, OrganizationResult } from '../../types/organization';
import { 
  monthCategorizationService, 
  sourceCategorizationService,
  incrementalOrganizationService 
} from '../../services';
import crossCategorizationService from '../../services/CrossCategorizationService';

/**
 * Organize all photos in the library
 */
export const organizePhotosAsync = createAsyncThunk<
  OrganizationResult,
  { photos: PhotoAsset[]; options?: { skipExisting?: boolean; batchSize?: number } },
  { state: RootState }
>(
  'organization/organizePhotos',
  async ({ photos, options = {} }, { dispatch, getState }) => {
    const startTime = Date.now();
    let categoriesCreated = 0;
    let photosOrganized = 0;
    const errors: string[] = [];

    try {
      // Update progress
      dispatch({ type: 'organization/updateProgress', payload: { current: 0, total: photos.length, currentOperation: 'Starting organization...' } });

      // Check if we should use incremental update
      const state = getState();
      const existingPhotos = Object.values(state.organization.photoReferences);
      const shouldUseIncremental = photos.length > 100 && existingPhotos.length > 0;

      if (shouldUseIncremental) {
        // Use incremental organization for better performance
        const photoReferences = photos.map(photo => ({
          photoId: photo.id,
          photo,
          monthCategoryId: null,
          sourceCategoryId: null,
          organizationScore: 0,
          lastUpdated: Date.now()
        }));

        const changes = await incrementalOrganizationService.detectChanges(photoReferences);
        
        if (incrementalOrganizationService.shouldUseIncrementalUpdate(changes, photos.length)) {
          // Process only changed photos
          const changedPhotos = [...changes.added, ...changes.modified].map(ref => ref.photo);
          return await processPhotosInBatches(changedPhotos, options, dispatch, startTime);
        }
      }

      // Full organization
      return await processPhotosInBatches(photos, options, dispatch, startTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during organization';
      errors.push(errorMessage);
      
      return {
        success: false,
        categoriesCreated,
        photosOrganized,
        errors,
        processingTime: Date.now() - startTime
      };
    }
  }
);

/**
 * Reorganize photos when categories or rules change
 */
export const reorganizePhotosAsync = createAsyncThunk<
  OrganizationResult,
  void,
  { state: RootState }
>(
  'organization/reorganizePhotos',
  async (_, { dispatch, getState }) => {
    const state = getState();
    const allPhotos = Object.values(state.organization.photoReferences).map(ref => ref.photo);
    
    // Clear existing organization first
    dispatch({ type: 'organization/clearAll' });
    
    // Re-organize all photos
    return await dispatch(organizePhotosAsync({ photos: allPhotos })).unwrap();
  }
);

/**
 * Update organization for a specific set of photos (e.g., newly added)
 */
export const updateOrganizationForPhotos = createAsyncThunk<
  OrganizationResult,
  PhotoAsset[],
  { state: RootState }
>(
  'organization/updateForPhotos',
  async (photos, { dispatch }) => {
    return await dispatch(organizePhotosAsync({ 
      photos, 
      options: { skipExisting: true, batchSize: 25 } 
    })).unwrap();
  }
);

/**
 * Recalculate category intersections and cross-references
 */
export const recalculateIntersectionsAsync = createAsyncThunk<
  { intersectionCount: number; processingTime: number },
  void,
  { state: RootState }
>(
  'organization/recalculateIntersections',
  async (_, { getState }) => {
    const startTime = Date.now();
    const state = getState();
    
    // Get all photo references
    const photoReferences = Object.values(state.organization.photoReferences);
    
    // Recalculate intersections using cross-categorization service
    const intersections = await crossCategorizationService.getCategoryIntersections(
      Object.values(state.organization.monthCategories),
      Object.values(state.organization.sourceCategories),
      photoReferences
    );
    
    return {
      intersectionCount: intersections.length,
      processingTime: Date.now() - startTime
    };
  }
);

/**
 * Validate organization integrity
 */
export const validateOrganizationAsync = createAsyncThunk<
  { isValid: boolean; issues: string[]; fixedIssues: number },
  void,
  { state: RootState }
>(
  'organization/validateIntegrity',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const issues: string[] = [];
    let fixedIssues = 0;

    try {
      // Get all photos first
      const allPhotos = Object.values(state.organization.photoReferences).map(ref => ref.photo);
      
      // Validate using cross-categorization service
      const validation = crossCategorizationService.validateCrossCategorization(
        allPhotos,
        Object.values(state.organization.monthCategories),
        Object.values(state.organization.sourceCategories),
        Object.values(state.organization.photoReferences)
      );

      if (!validation.isValid) {
        issues.push(...validation.errors);
        
        // Attempt to fix issues automatically
        if (validation.errors.includes('orphaned_photos')) {
          // Re-organize orphaned photos
          const orphanedPhotos = Object.values(state.organization.photoReferences)
            .filter(ref => !ref.monthCategoryId && !ref.sourceCategoryId)
            .map(ref => ref.photo);
          
          if (orphanedPhotos.length > 0) {
            await dispatch(updateOrganizationForPhotos(orphanedPhotos));
            fixedIssues += orphanedPhotos.length;
          }
        }
      }

      return {
        isValid: validation.isValid,
        issues,
        fixedIssues
      };
    } catch (error) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        issues,
        fixedIssues
      };
    }
  }
);

/**
 * Helper function to process photos in batches
 */
async function processPhotosInBatches(
  photos: PhotoAsset[], 
  options: { skipExisting?: boolean; batchSize?: number },
  dispatch: any,
  startTime: number
): Promise<OrganizationResult> {
  const batchSize = options.batchSize || 50;
  let categoriesCreated = 0;
  let photosOrganized = 0;
  const errors: string[] = [];

  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    
    try {
      // Update progress
      dispatch({ 
        type: 'organization/updateProgress', 
        payload: { 
          current: i, 
          total: photos.length, 
          currentOperation: `Processing batch ${Math.floor(i / batchSize) + 1}...` 
        } 
      });

      // Process each photo in the batch
      for (const photo of batch) {
        try {
          // Generate month category ID
          const date = new Date(photo.creationTime || Date.now());
          const monthId = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          // Generate source category
          const sourceType = photo.fileName?.includes('whatsapp') ? 'WHATSAPP' : 'CAMERA_ROLL';
          const sourceCategoryId = `source_${sourceType.toLowerCase()}`;

          // Create photo reference
          const photoReference = {
            photoId: photo.id,
            photo,
            monthCategoryId: monthId,
            sourceCategoryId: sourceCategoryId,
            organizationScore: 0.8, // Default score
            lastUpdated: Date.now()
          };

          // Dispatch actions to update Redux state
          dispatch({ type: 'organization/addPhotoReference', payload: photoReference });
          
          photosOrganized++;
        } catch (photoError) {
          errors.push(`Error processing photo ${photo.id}: ${photoError instanceof Error ? photoError.message : 'Unknown error'}`);
        }
      }

      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (batchError) {
      errors.push(`Error processing batch: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
    }
  }

  // Final progress update
  dispatch({ 
    type: 'organization/updateProgress', 
    payload: { 
      current: photos.length, 
      total: photos.length, 
      currentOperation: 'Organization complete' 
    } 
  });

  return {
    success: errors.length === 0,
    categoriesCreated,
    photosOrganized,
    errors,
    processingTime: Date.now() - startTime
  };
} 