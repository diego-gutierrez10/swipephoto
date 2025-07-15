import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { Category } from '../../types';
import type { Photo } from '../../types/models/Photo';
import { PhotoAsset } from '../../types/photo';
import { SourceCategory, MonthCategory } from '../../types/organization';
import { PhotoLibraryService } from '../../services/PhotoLibraryService';
import PhotoPermissionsService from '../../services/PhotoPermissionsService';
import crossCategorizationService from '../../services/CrossCategorizationService';
import PhotoCountingService, { CategoryCount } from '../../services/PhotoCountingService';
import { setPhotos, addPhotos } from './photoSlice';

// Fast loading of category counts without loading photos
export const loadCategoryCounts = createAsyncThunk(
  'categories/loadCategoryCounts',
  async (_, { rejectWithValue }) => {
    try {
      const permissionService = PhotoPermissionsService.getInstance();
      const permissionStatus = await permissionService.checkPermissionStatus();
      if (permissionStatus !== 'granted') {
        const result = await permissionService.requestPermissions();
        if (result.status !== 'granted') {
          return rejectWithValue('Photo library permission not granted');
        }
      }

      const countingService = PhotoCountingService;
      const result = await countingService.getCategoryCounts();

      if (result.success && result.data) {
        return {
          monthCounts: result.data.monthCounts,
          sourceCounts: result.data.sourceCounts,
          totalPhotos: result.data.totalPhotos,
        };
      } else {
        throw new Error(result.error || 'Failed to load category counts');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Load photos for a specific category
export const loadCategoryPhotos = createAsyncThunk(
  'categories/loadCategoryPhotos',
  async (
    { categoryId, sourceType, limit = 50, after }: 
    { categoryId: string; sourceType: 'source' | 'month'; limit?: number; after?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const countingService = PhotoCountingService;
      const result = await countingService.loadCategoryPhotos(categoryId, sourceType, { limit, after });

      if (result.success && result.data) {
        // Convert PhotoAsset to Photo format for the store
        const photosForStore: Photo[] = result.data.photos.map((asset: PhotoAsset) => ({
          id: asset.id,
          uri: asset.uri,
          filename: asset.fileName || `photo_${asset.id}`,
          width: asset.width || 0,
          height: asset.height || 0,
          createdAt: asset.creationTime || Date.now(),
          modifiedAt: asset.creationTime || Date.now(),
          size: asset.fileSize || 0,
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          categoryIds: [categoryId],
          isFavorite: false,
          isHidden: false,
        }));

        // Add photos to the store incrementally 
        dispatch(addPhotos(photosForStore));

        return {
          categoryId,
          photos: photosForStore,
          hasMore: result.data.hasMore,
          endCursor: result.data.endCursor,
        };
      } else {
        throw new Error(result.error || 'Failed to load category photos');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Load more photos for a category (pagination)
export const loadMoreCategoryPhotos = createAsyncThunk(
  'categories/loadMoreCategoryPhotos',
  async (
    { categoryId, sourceType, forceLoad }: 
    { categoryId: string; sourceType: 'source' | 'month'; forceLoad?: boolean },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as any;
    const paginationInfo = state.categories.categoryPagination[categoryId];

    // CRITICAL FIX: If forceLoad is true, bypass the loading check
    if (paginationInfo?.isLoading && !forceLoad) {
      // Silently ignore if already loading to prevent race conditions
      return rejectWithValue({
        name: 'AlreadyLoadingError',
        message: 'Already loading more photos for this category.',
        categoryId,
      });
    }
    
    if (!paginationInfo || !paginationInfo.hasMore) {
      // This case is not an error, it just means we are at the end.
      // Return a standard fulfilled payload to avoid triggering 'rejected'.
      return {
        categoryId,
        photos: [],
        hasMore: false,
        endCursor: paginationInfo?.endCursor || null,
      };
    }

    try {
      console.log('🔄 LoadMoreCategoryPhotos: Adding photos to global store', {
        categoryId,
        forceLoad,
        wasLoading: paginationInfo?.isLoading
      });

      const countingService = PhotoCountingService;
      const result = await countingService.loadCategoryPhotos(
        categoryId, 
        sourceType, 
        { limit: 7, after: paginationInfo.endCursor }
      );

      if (result.success && result.data) {
        // Convert PhotoAsset to Photo format for the store
        const photosForStore: Photo[] = result.data.photos.map((asset: PhotoAsset) => ({
          id: asset.id,
          uri: asset.uri,
          filename: asset.fileName || `photo_${asset.id}`,
          width: asset.width || 0,
          height: asset.height || 0,
          createdAt: asset.creationTime || Date.now(),
          modifiedAt: asset.creationTime || Date.now(),
          size: asset.fileSize || 0,
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          categoryIds: [categoryId],
          isFavorite: false,
          isHidden: false,
        }));

        // Add photos to the store incrementally 
        console.log('🔄 LoadMoreCategoryPhotos: Adding photos to global store', {
          categoryId,
          photosToAdd: photosForStore.length,
          photoIds: photosForStore.map(p => p.id)
        });
        dispatch(addPhotos(photosForStore));
        console.log('✅ LoadMoreCategoryPhotos: Photos added to global store');

        console.log('✅ LoadMoreCategoryPhotos: Successfully loaded more photos:', {
          categoryId,
          newPhotosCount: photosForStore.length,
          hasMore: result.data.hasMore,
          endCursor: result.data.endCursor
        });

        return {
          categoryId,
          photos: photosForStore,
          hasMore: result.data.hasMore,
          endCursor: result.data.endCursor,
        };
      } else {
        throw new Error(result.error || 'Failed to load more category photos');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Legacy function - kept for backward compatibility but will use fast counting
export const loadAndCategorizePhotos = createAsyncThunk(
  'categories/loadAndCategorizePhotos',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Use the new fast counting method instead
      const result = await dispatch(loadCategoryCounts());
      if (loadCategoryCounts.fulfilled.match(result)) {
        return result.payload;
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

export interface CategoryState {
  categories: Category[];
  categoryCounts: {
    monthCounts: CategoryCount[];
    sourceCounts: CategoryCount[];
    totalPhotos: number;
  } | null;
  loadedCategories: string[]; // Track which categories have photos loaded
  categoryPagination: { // NEW: Track pagination state for each category
    [categoryId: string]: {
      hasMore: boolean;
      endCursor?: string;
      isLoading: boolean;
    };
  };
  loading: boolean;
  countingLoading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  categoryCounts: null,
  loadedCategories: [],
  categoryPagination: {}, // NEW: Initialize pagination tracking
  loading: false,
  countingLoading: false,
  error: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCategories: (
      state,
      action: PayloadAction<{
        monthCategories: MonthCategory[];
        sourceCategories: SourceCategory[];
      }>
    ) => {
      const { monthCategories, sourceCategories } = action.payload;
      
      const mappedSourceCategories: Category[] = sourceCategories.map(sourceCat => ({
        id: sourceCat.id,
        name: sourceCat.displayName,
        photoIds: sourceCat.photoIds,
        count: sourceCat.count,
        thumbnail: sourceCat.photoIds[0] || null, // Use first photo as thumbnail
        isCleaned: false,
        sourceType: 'source',
      }));

      const mappedMonthCategories: Category[] = monthCategories.map(monthCat => ({
        id: monthCat.id,
        name: monthCat.displayName,
        photoIds: monthCat.photoIds,
        count: monthCat.count,
        thumbnail: monthCat.photoIds[0] || null,
        isCleaned: false,
        sourceType: 'month',
      }));

      state.categories = [...mappedSourceCategories, ...mappedMonthCategories];
      state.loading = false;
      state.error = null;
    },
    setCategoryCleanedStatus: (state, action: PayloadAction<{ categoryId: string; isCleaned: boolean }>) => {
      const { categoryId, isCleaned } = action.payload;
      const category = state.categories.find(c => c.id === categoryId);
      if (category) {
        category.isCleaned = isCleaned;
      }
    },

    // NEW: Update category count for real-time synchronization
    updateCategoryCount: (state, action: PayloadAction<{ categoryId: string; count: number }>) => {
      const { categoryId, count } = action.payload;
      const category = state.categories.find(c => c.id === categoryId);
      if (category) {
        category.count = count;
      }
    },

    // NEW: Reset pagination state for a category (useful for debugging/refreshing)
    resetCategoryPagination: (state, action: PayloadAction<{ categoryId: string }>) => {
      const { categoryId } = action.payload;
      // Completely reset pagination state to allow fresh loading
      state.categoryPagination[categoryId] = {
        hasMore: true, // Reset to true
        isLoading: false,
        endCursor: undefined, // Clear cursor to start fresh
      };
      console.log('🔄 CategorySlice: Reset pagination for', categoryId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fast category counting
      .addCase(loadCategoryCounts.pending, (state) => {
        state.countingLoading = true;
        state.error = null;
      })
      .addCase(loadCategoryCounts.fulfilled, (state, action) => {
        const { monthCounts, sourceCounts, totalPhotos } = action.payload;
        
        state.categoryCounts = { monthCounts, sourceCounts, totalPhotos };
        
        // Convert counts to categories for display
        const mappedSourceCategories: Category[] = sourceCounts.map((sourceCount: CategoryCount) => ({
          id: sourceCount.id,
          name: sourceCount.name,
          photoIds: [], // Photos will be loaded on demand
          count: sourceCount.count,
          thumbnail: sourceCount.firstPhotoId || null,
          isCleaned: false,
          sourceType: 'source',
        }));
  
        const mappedMonthCategories: Category[] = monthCounts.map((monthCount: CategoryCount) => ({
          id: monthCount.id,
          name: monthCount.name,
          photoIds: [], // Photos will be loaded on demand
          count: monthCount.count,
          thumbnail: monthCount.firstPhotoId || null,
          isCleaned: false,
          sourceType: 'month',
        }));
  
        state.categories = [...mappedSourceCategories, ...mappedMonthCategories];
        state.countingLoading = false;
      })
      .addCase(loadCategoryCounts.rejected, (state, action) => {
        state.countingLoading = false;
        state.error = action.payload as string;
      })
      // Category photo loading
      .addCase(loadCategoryPhotos.pending, (state, action) => {
        const { categoryId } = action.meta.arg;
        state.loading = true;
        state.error = null;
        
        // Update pagination state to show loading
        if (!state.categoryPagination[categoryId]) {
          state.categoryPagination[categoryId] = {
            hasMore: true,
            isLoading: true,
          };
        } else {
          state.categoryPagination[categoryId].isLoading = true;
        }
      })
      .addCase(loadCategoryPhotos.fulfilled, (state, action) => {
        const { categoryId, photos, hasMore, endCursor } = action.payload;

        // Mark category as loaded
        if (!state.loadedCategories.includes(categoryId)) {
          state.loadedCategories.push(categoryId);
        }

        // Update pagination state
        state.categoryPagination[categoryId] = {
          hasMore,
          endCursor,
          isLoading: false,
        };

        // Update the category with loaded photo IDs
        const category = state.categories.find((c) => c.id === categoryId);
        if (category) {
          // Use a Set to avoid duplicates if this action is ever dispatched multiple times
          const existingPhotoIds = new Set(category.photoIds);
          photos.forEach((p) => existingPhotoIds.add(p.id));
          category.photoIds = Array.from(existingPhotoIds);
        }

        state.loading = false;
      })
      .addCase(loadCategoryPhotos.rejected, (state, action) => {
        const { categoryId } = action.meta.arg;
        state.loading = false;
        state.error = action.payload as string;
        
        // Update pagination state to show error/stop loading
        if (state.categoryPagination[categoryId]) {
          state.categoryPagination[categoryId].isLoading = false;
        }
      })
      // Load more photos for category (pagination)
      .addCase(loadMoreCategoryPhotos.pending, (state, action) => {
        const { categoryId } = action.meta.arg;
        
        // Update pagination state to show loading
        if (state.categoryPagination[categoryId]) {
          state.categoryPagination[categoryId].isLoading = true;
        }
      })
      .addCase(loadMoreCategoryPhotos.fulfilled, (state, action) => {
        const { categoryId, photos, hasMore, endCursor } = action.payload;
        
        console.log('🔄 CategorySlice: loadMoreCategoryPhotos.fulfilled', {
          categoryId,
          newPhotosCount: photos.length,
          hasMore,
          endCursor
        });

        // Update pagination state
        if (state.categoryPagination[categoryId]) {
          state.categoryPagination[categoryId] = {
            hasMore,
            endCursor,
            isLoading: false,
          };
        }

        // Update the category with additional photo IDs
        const category = state.categories.find((c) => c.id === categoryId);
        if (category) {
          const previousCount = category.photoIds.length;
          // Use a Set to avoid duplicates
          const existingPhotoIds = new Set(category.photoIds);
          photos.forEach((p) => existingPhotoIds.add(p.id));
          category.photoIds = Array.from(existingPhotoIds);
          
          console.log('✅ CategorySlice: Updated category photoIds', {
            categoryId,
            previousCount,
            newCount: category.photoIds.length,
            addedPhotos: category.photoIds.length - previousCount
          });
        }
      })
      .addCase(loadMoreCategoryPhotos.rejected, (state, action) => {
        const { categoryId } = action.meta.arg;
        const payload = action.payload as any;

        // If the rejection was due to already loading, just ignore it silently.
        // The original in-flight request will handle resetting the loading state.
        if (payload?.name === 'AlreadyLoadingError') {
          return;
        }
        
        // For actual errors, update pagination state to show error/stop loading
        if (state.categoryPagination[categoryId]) {
          state.categoryPagination[categoryId].isLoading = false;
        }
      })
      // Legacy support for loadAndCategorizePhotos
      .addCase(loadAndCategorizePhotos.pending, (state) => {
        state.countingLoading = true;
        state.error = null;
      })
      .addCase(loadAndCategorizePhotos.fulfilled, (state, action) => {
        // This now uses the same logic as loadCategoryCounts
        const { monthCounts, sourceCounts, totalPhotos } = action.payload;

        state.categoryCounts = { monthCounts, sourceCounts, totalPhotos };

        const mappedSourceCategories: Category[] = sourceCounts.map((sourceCount: CategoryCount) => ({
          id: sourceCount.id,
          name: sourceCount.name,
          photoIds: [],
          count: sourceCount.count,
          thumbnail: sourceCount.firstPhotoId || null,
          isCleaned: false,
          sourceType: 'source',
        }));
  
        const mappedMonthCategories: Category[] = monthCounts.map((monthCount: CategoryCount) => ({
          id: monthCount.id,
          name: monthCount.name,
          photoIds: [],
          count: monthCount.count,
          thumbnail: monthCount.firstPhotoId || null,
          isCleaned: false,
          sourceType: 'month',
        }));
  
        state.categories = [...mappedSourceCategories, ...mappedMonthCategories];
        state.countingLoading = false;
      })
      .addCase(loadAndCategorizePhotos.rejected, (state, action) => {
        state.countingLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setLoading,
  setError,
  setCategories,
  setCategoryCleanedStatus,
  updateCategoryCount,
  resetCategoryPagination,
} = categorySlice.actions;

// Selectors for pagination info
export const selectCategoryPagination = (state: any, categoryId: string) => 
  state.categories.categoryPagination[categoryId];

export const selectCategoryHasMore = (state: any, categoryId: string) => 
  state.categories.categoryPagination[categoryId]?.hasMore ?? true; // Default to true until proven otherwise

export const selectCategoryIsLoadingMore = (state: any, categoryId: string) => 
  state.categories.categoryPagination[categoryId]?.isLoading ?? false;

export default categorySlice.reducer; 