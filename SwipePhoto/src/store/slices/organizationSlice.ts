import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  OrganizationState,
  MonthCategory,
  SourceCategory,
  PhotoReference,
  OrganizationMetadata,
  OrganizationProgress,
  OrganizationFilters,
  CategoryIndexes,
  BatchOrganizationRequest,
  OrganizationResult
} from '../../types/organization';

// Initial state
const initialState: OrganizationState = {
  monthCategories: {},
  sourceCategories: {},
  photoReferences: {},
  indexes: {
    photoToCategories: {},
    monthsByYear: {},
    sourcesByType: {
      cameraRoll: [],
      screenshots: [],
      otherApps: [],
    },
  },
  metadata: {
    totalPhotos: 0,
    totalCategories: 0,
    lastOrganized: 0,
    organizationVersion: '1.0.0',
    isOrganizing: false,
    progress: {
      current: 0,
      total: 0,
      currentOperation: 'idle'
    }
  },
  filters: {
    sortBy: 'date',
    sortOrder: 'desc'
  },
  selectedCategoryId: null,
  selectedCategoryType: null,
  error: null,
  lastError: null,
  deletionQueue: {},
  lastFreedSpace: 0,
  accumulatedFreedSpace: 0,
};

// Async thunks for complex operations
export const organizePhotosAsync = createAsyncThunk(
  'organization/organizePhotos',
  async (request: BatchOrganizationRequest, { dispatch, getState }) => {
    dispatch(organizationStarted());
    
    try {
      // Simulate organization process
      const { photos, options } = request;
      const batchSize = options.batchSize || 50;
      let processed = 0;
      
      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        
        // Process batch
        for (const photo of batch) {
          dispatch(addPhotoToOrganization(photo));
          processed++;
          
          // Update progress
          dispatch(updateOrganizationProgress({
            current: processed,
            total: photos.length,
            currentOperation: `Processing photo ${processed} of ${photos.length}`
          }));
          
          // Call progress callback if provided
          if (options.progressCallback) {
            options.progressCallback({
              current: processed,
              total: photos.length,
              currentOperation: `Processing photo ${processed} of ${photos.length}`
            });
          }
        }
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
             const state = getState() as { organization: OrganizationState };
       const result: OrganizationResult = {
         success: true,
         categoriesCreated: Object.keys(state.organization.monthCategories).length +
                          Object.keys(state.organization.sourceCategories).length,
         photosOrganized: processed,
         errors: [],
         processingTime: Date.now()
       };
      
      dispatch(organizationCompleted(result));
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch(organizationFailed(errorMessage));
      throw error;
    }
  }
);

// Main slice
const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    // Category management
    addMonthCategory: (state, action: PayloadAction<MonthCategory>) => {
      const category = action.payload;
      state.monthCategories[category.id] = category;
      
      // Update year index
      if (!state.indexes.monthsByYear[category.year]) {
        state.indexes.monthsByYear[category.year] = [];
      }
      if (!state.indexes.monthsByYear[category.year].includes(category.id)) {
        state.indexes.monthsByYear[category.year].push(category.id);
        // Sort by month (most recent first)
        state.indexes.monthsByYear[category.year].sort((a, b) => {
          const catA = state.monthCategories[a];
          const catB = state.monthCategories[b];
          return catB.month - catA.month;
        });
      }
      
      state.metadata.totalCategories = Object.keys(state.monthCategories).length + 
                                      Object.keys(state.sourceCategories).length;
    },

    addSourceCategory: (state, action: PayloadAction<SourceCategory>) => {
      const category = action.payload;
      state.sourceCategories[category.id] = category;
      
      // Update source type index
      if (!state.indexes.sourcesByType[category.sourceType]) {
        state.indexes.sourcesByType[category.sourceType] = [];
      }
      if (!state.indexes.sourcesByType[category.sourceType].includes(category.id)) {
        state.indexes.sourcesByType[category.sourceType].push(category.id);
      }
      
      state.metadata.totalCategories = Object.keys(state.monthCategories).length + 
                                      Object.keys(state.sourceCategories).length;
    },

    // Photo reference management
    addPhotoReference: (state, action: PayloadAction<PhotoReference>) => {
      const reference = action.payload;
      state.photoReferences[reference.photoId] = reference;
      
      // Update photo-to-categories index
      state.indexes.photoToCategories[reference.photoId] = {
        monthCategoryId: reference.monthCategoryId,
        sourceCategoryId: reference.sourceCategoryId
      };
      
      // Update category photo counts
      if (reference.monthCategoryId && state.monthCategories[reference.monthCategoryId]) {
        if (!state.monthCategories[reference.monthCategoryId].photoIds.includes(reference.photoId)) {
          state.monthCategories[reference.monthCategoryId].photoIds.push(reference.photoId);
          state.monthCategories[reference.monthCategoryId].count++;
          state.monthCategories[reference.monthCategoryId].lastUpdated = Date.now();
        }
      }
      
      if (reference.sourceCategoryId && state.sourceCategories[reference.sourceCategoryId]) {
        if (!state.sourceCategories[reference.sourceCategoryId].photoIds.includes(reference.photoId)) {
          state.sourceCategories[reference.sourceCategoryId].photoIds.push(reference.photoId);
          state.sourceCategories[reference.sourceCategoryId].count++;
          state.sourceCategories[reference.sourceCategoryId].lastUpdated = Date.now();
        }
      }
      
      state.metadata.totalPhotos = Object.keys(state.photoReferences).length;
    },

    // Organization process management
    organizationStarted: (state) => {
      state.metadata.isOrganizing = true;
      state.metadata.progress = {
        current: 0,
        total: 0,
        currentOperation: 'Starting organization...'
      };
      state.error = null;
    },

    updateOrganizationProgress: (state, action: PayloadAction<OrganizationProgress>) => {
      state.metadata.progress = action.payload;
    },

    organizationCompleted: (state, action: PayloadAction<OrganizationResult>) => {
      state.metadata.isOrganizing = false;
      state.metadata.lastOrganized = Date.now();
      state.metadata.progress = {
        current: action.payload.photosOrganized,
        total: action.payload.photosOrganized,
        currentOperation: 'Completed'
      };
    },

    organizationFailed: (state, action: PayloadAction<string>) => {
      state.metadata.isOrganizing = false;
      state.error = action.payload;
      state.lastError = Date.now();
      state.metadata.progress = {
        current: 0,
        total: 0,
        currentOperation: 'Failed'
      };
    },

    // UI state management
    setFilters: (state, action: PayloadAction<Partial<OrganizationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    selectCategory: (state, action: PayloadAction<{
      categoryId: string;
      categoryType: 'month' | 'source';
    }>) => {
      state.selectedCategoryId = action.payload.categoryId;
      state.selectedCategoryType = action.payload.categoryType;
    },

    clearSelection: (state) => {
      state.selectedCategoryId = null;
      state.selectedCategoryType = null;
    },

    // Deletion queue management
    addToDeletionQueue: (state, action: PayloadAction<{ photoId: string; categoryId: string }>) => {
      const { photoId, categoryId } = action.payload;
      if (!state.deletionQueue[categoryId]) {
        state.deletionQueue[categoryId] = [];
      }
      if (!state.deletionQueue[categoryId].includes(photoId)) {
        state.deletionQueue[categoryId].push(photoId);
      }
    },

    removeFromDeletionQueue: (state, action: PayloadAction<{ photoId: string; categoryId: string }>) => {
      const { photoId, categoryId } = action.payload;
      if (state.deletionQueue[categoryId]) {
        state.deletionQueue[categoryId] = state.deletionQueue[categoryId].filter(
          (id) => id !== photoId
        );
      }
    },

    // NEW: Add photo to deletion queue for all categories it belongs to
    addToDeletionQueueForAllCategories: (state, action: PayloadAction<{ photoId: string }>) => {
      const { photoId } = action.payload;
      
      // Get all categories this photo belongs to
      const photoCategories = state.indexes.photoToCategories[photoId];
      
      if (photoCategories) {
        const { monthCategoryId, sourceCategoryId } = photoCategories;
        
        // Add to month category's deletion queue if exists
        if (monthCategoryId && state.monthCategories[monthCategoryId]) {
          if (!state.deletionQueue[monthCategoryId]) {
            state.deletionQueue[monthCategoryId] = [];
          }
          if (!state.deletionQueue[monthCategoryId].includes(photoId)) {
            state.deletionQueue[monthCategoryId].push(photoId);
          }
        }
        
        // Add to source category's deletion queue if exists
        if (sourceCategoryId && state.sourceCategories[sourceCategoryId]) {
          if (!state.deletionQueue[sourceCategoryId]) {
            state.deletionQueue[sourceCategoryId] = [];
          }
          if (!state.deletionQueue[sourceCategoryId].includes(photoId)) {
            state.deletionQueue[sourceCategoryId].push(photoId);
          }
        }
      }
    },

    // NEW: Remove photo from deletion queue for all categories it belongs to
    removeFromDeletionQueueForAllCategories: (state, action: PayloadAction<{ photoId: string }>) => {
      const { photoId } = action.payload;
      
      // Get all categories this photo belongs to
      const photoCategories = state.indexes.photoToCategories[photoId];
      
      if (photoCategories) {
        const { monthCategoryId, sourceCategoryId } = photoCategories;
        
        // Remove from month category's deletion queue if exists
        if (monthCategoryId && state.deletionQueue[monthCategoryId]) {
          state.deletionQueue[monthCategoryId] = state.deletionQueue[monthCategoryId].filter(
            (id) => id !== photoId
          );
          // Remove empty deletion queue
          if (state.deletionQueue[monthCategoryId].length === 0) {
            delete state.deletionQueue[monthCategoryId];
          }
        }
        
        // Remove from source category's deletion queue if exists
        if (sourceCategoryId && state.deletionQueue[sourceCategoryId]) {
          state.deletionQueue[sourceCategoryId] = state.deletionQueue[sourceCategoryId].filter(
            (id) => id !== photoId
          );
          // Remove empty deletion queue
          if (state.deletionQueue[sourceCategoryId].length === 0) {
            delete state.deletionQueue[sourceCategoryId];
          }
        }
      }
    },

    clearDeletionQueue: (state, action: PayloadAction<{ categoryId: string }>) => {
      const { categoryId } = action.payload;
      if (state.deletionQueue[categoryId]) {
        delete state.deletionQueue[categoryId];
      }
    },

    // NEW: Remove photos from all categories they belong to and sync deletion queues
    removePhotosFromAllCategories: (state, action: PayloadAction<{ photoIds: string[] }>) => {
      const { photoIds } = action.payload;
      
      photoIds.forEach(photoId => {
        // Get all categories this photo belongs to
        const photoCategories = state.indexes.photoToCategories[photoId];
        
        if (photoCategories) {
          const { monthCategoryId, sourceCategoryId } = photoCategories;
          
          // Remove from month category if exists
          if (monthCategoryId && state.monthCategories[monthCategoryId]) {
            const monthCategory = state.monthCategories[monthCategoryId];
            monthCategory.photoIds = monthCategory.photoIds.filter(id => id !== photoId);
            monthCategory.count = monthCategory.photoIds.length;
            monthCategory.lastUpdated = Date.now();
            
            // Remove from month category's deletion queue if present
            if (state.deletionQueue[monthCategoryId]) {
              state.deletionQueue[monthCategoryId] = state.deletionQueue[monthCategoryId].filter(
                id => id !== photoId
              );
              // Remove empty deletion queue
              if (state.deletionQueue[monthCategoryId].length === 0) {
                delete state.deletionQueue[monthCategoryId];
              }
            }
          }
          
          // Remove from source category if exists
          if (sourceCategoryId && state.sourceCategories[sourceCategoryId]) {
            const sourceCategory = state.sourceCategories[sourceCategoryId];
            sourceCategory.photoIds = sourceCategory.photoIds.filter(id => id !== photoId);
            sourceCategory.count = sourceCategory.photoIds.length;
            sourceCategory.lastUpdated = Date.now();
            
            // Remove from source category's deletion queue if present
            if (state.deletionQueue[sourceCategoryId]) {
              state.deletionQueue[sourceCategoryId] = state.deletionQueue[sourceCategoryId].filter(
                id => id !== photoId
              );
              // Remove empty deletion queue
              if (state.deletionQueue[sourceCategoryId].length === 0) {
                delete state.deletionQueue[sourceCategoryId];
              }
            }
          }
          
          // Remove photo reference and index entry
          delete state.photoReferences[photoId];
          delete state.indexes.photoToCategories[photoId];
        }
      });
      
      // Update total photos count
      state.metadata.totalPhotos = Object.keys(state.photoReferences).length;
    },

    setLastFreedSpace: (state, action: PayloadAction<number>) => {
      state.lastFreedSpace = action.payload;
    },

    addAccumulatedFreedSpace: (state, action: PayloadAction<number>) => {
      state.accumulatedFreedSpace += action.payload;
    },

    clearLastFreedSpace: (state) => {
      state.lastFreedSpace = 0;
    },

    // Full state reset for logout or debugging
    resetOrganizationState: () => initialState,

    // Utility actions
         rebuildIndexes: (state) => {
       // Rebuild all indexes from current data
       state.indexes.photoToCategories = {};
       state.indexes.monthsByYear = {};
       state.indexes.sourcesByType = {
         cameraRoll: [],
         screenshots: [],
         otherApps: [],
       };
      
      // Rebuild photo-to-categories index
      Object.values(state.photoReferences).forEach(ref => {
        state.indexes.photoToCategories[ref.photoId] = {
          monthCategoryId: ref.monthCategoryId,
          sourceCategoryId: ref.sourceCategoryId
        };
      });
      
      // Rebuild month index
      Object.values(state.monthCategories).forEach(category => {
        if (!state.indexes.monthsByYear[category.year]) {
          state.indexes.monthsByYear[category.year] = [];
        }
        state.indexes.monthsByYear[category.year].push(category.id);
      });
      
      // Sort months by most recent first
      Object.values(state.indexes.monthsByYear).forEach(monthIds => {
        monthIds.sort((a, b) => {
          const catA = state.monthCategories[a];
          const catB = state.monthCategories[b];
          return catB.month - catA.month;
        });
      });
      
      // Rebuild source index
      Object.values(state.sourceCategories).forEach(category => {
        if (!state.indexes.sourcesByType[category.sourceType]) {
          state.indexes.sourcesByType[category.sourceType] = [];
        }
        state.indexes.sourcesByType[category.sourceType].push(category.id);
      });
    },

    updateCategoryCounts: (state) => {
      // Recalculate all category counts
      Object.values(state.monthCategories).forEach(category => {
        category.count = category.photoIds.length;
      });
      
      Object.values(state.sourceCategories).forEach(category => {
        category.count = category.photoIds.length;
      });
    },

    clearOrganization: (state) => {
      return initialState;
    },

    // Helper action for adding photos (used by async thunk)
    addPhotoToOrganization: (state, action: PayloadAction<any>) => {
      // This will be implemented by the organization service
      // For now, it's a placeholder
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(organizePhotosAsync.pending, (state) => {
        state.metadata.isOrganizing = true;
        state.error = null;
      })
      .addCase(organizePhotosAsync.fulfilled, (state, action) => {
        state.metadata.isOrganizing = false;
        state.metadata.lastOrganized = Date.now();
      })
      .addCase(organizePhotosAsync.rejected, (state, action) => {
        state.metadata.isOrganizing = false;
        state.error = action.error.message || 'Organization failed';
        state.lastError = Date.now();
      });
  }
});

// Export actions
export const {
  addMonthCategory,
  addSourceCategory,
  addPhotoReference,
  organizationStarted,
  updateOrganizationProgress,
  organizationCompleted,
  organizationFailed,
  setFilters,
  selectCategory,
  clearSelection,
  rebuildIndexes,
  updateCategoryCounts,
  clearOrganization,
  addPhotoToOrganization,
  addToDeletionQueue,
  removeFromDeletionQueue,
  addToDeletionQueueForAllCategories,
  removeFromDeletionQueueForAllCategories,
  clearDeletionQueue,
  removePhotosFromAllCategories,
  setLastFreedSpace,
  addAccumulatedFreedSpace,
  clearLastFreedSpace,
  resetOrganizationState
} = organizationSlice.actions;

export const selectOrganizationState = (state: { organization: OrganizationState }) => state.organization;

// Export reducer
export default organizationSlice.reducer; 