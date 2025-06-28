import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { Category } from '../../types';
import type { Photo } from '../../types/models/Photo';
import { PhotoAsset } from '../../types/photo';
import { SourceCategory, MonthCategory } from '../../types/organization';
import { PhotoLibraryService } from '../../services/PhotoLibraryService';
import PhotoPermissionsService from '../../services/PhotoPermissionsService';
import crossCategorizationService from '../../services/CrossCategorizationService';
import { setPhotos } from './photoSlice';

export const loadAndCategorizePhotos = createAsyncThunk(
  'categories/loadAndCategorizePhotos',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const permissionService = PhotoPermissionsService.getInstance();
      const permissionStatus = await permissionService.checkPermissionStatus();
      if (permissionStatus !== 'granted') {
        const result = await permissionService.requestPermissions();
        if (result.status !== 'granted') {
          return rejectWithValue('Photo library permission not granted');
        }
      }

      const photoLibraryService = PhotoLibraryService.getInstance();
      const result = await photoLibraryService.getRecentPhotos({ limit: 1000 });

      if (result.success && result.data) {
        const photosForStore: Photo[] = result.data.map((asset: PhotoAsset) => ({
          id: asset.id,
          uri: asset.uri,
          filename: asset.fileName || `photo_${asset.id}`,
          width: asset.width || 0,
          height: asset.height || 0,
          createdAt: asset.creationTime || Date.now(),
          modifiedAt: asset.creationTime || Date.now(),
          size: asset.fileSize || 0,
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          categoryIds: [],
          isFavorite: false,
          isHidden: false,
        }));

        dispatch(setPhotos(photosForStore));

        const categorizationResult = crossCategorizationService.organizePhotosWithCrossCategories(
          result.data
        );
        
        return {
          sourceCategories: categorizationResult.sourceCategories,
          monthCategories: categorizationResult.monthCategories,
        };
      } else {
        throw new Error(result.error || 'Failed to load photos');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAndCategorizePhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAndCategorizePhotos.fulfilled, (state, action) => {
        const { monthCategories, sourceCategories } = action.payload;
      
        const mappedSourceCategories: Category[] = sourceCategories.map(sourceCat => ({
          id: sourceCat.id,
          name: sourceCat.displayName,
          photoIds: sourceCat.photoIds,
          count: sourceCat.count,
          thumbnail: sourceCat.photoIds[0] || null,
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
      })
      .addCase(loadAndCategorizePhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setLoading,
  setError,
  setCategories,
  setCategoryCleanedStatus,
} = categorySlice.actions;

export default categorySlice.reducer; 