import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Photo, PhotoMetadata, PhotoSortOrder } from '../../types';

export interface PhotoState {
  photos: Photo[];
  currentPhoto: Photo | null;
  metadata: PhotoMetadata;
  loading: boolean;
  error: string | null;
  sortOrder: PhotoSortOrder;
  filters: {
    categoryIds: string[];
    isFavorite?: boolean;
    isHidden?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

const initialState: PhotoState = {
  photos: [],
  currentPhoto: null,
  metadata: {
    totalCount: 0,
    categorizedCount: 0,
    uncategorizedCount: 0,
    favoriteCount: 0,
    totalSize: 0,
  },
  loading: false,
  error: null,
  sortOrder: 'newest',
  filters: {
    categoryIds: [],
  },
};

// Async thunks (to be implemented later with actual photo library access)
export const loadPhotos = createAsyncThunk(
  'photos/loadPhotos',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement actual photo library loading
      // This will use expo-image-picker and device photo library
      const photos: Photo[] = [];
      return photos;
    } catch (error) {
      return rejectWithValue('Failed to load photos');
    }
  }
);

export const categorizePhoto = createAsyncThunk(
  'photos/categorizePhoto',
  async (
    { photoId, categoryIds }: { photoId: string; categoryIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement photo categorization logic
      return { photoId, categoryIds };
    } catch (error) {
      return rejectWithValue('Failed to categorize photo');
    }
  }
);

export const togglePhotoFavorite = createAsyncThunk(
  'photos/toggleFavorite',
  async (photoId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement favorite toggle logic
      return photoId;
    } catch (error) {
      return rejectWithValue('Failed to toggle favorite');
    }
  }
);

const photoSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setCurrentPhoto: (state, action: PayloadAction<Photo | null>) => {
      state.currentPhoto = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<PhotoSortOrder>) => {
      state.sortOrder = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<PhotoState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        categoryIds: [],
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load photos
      .addCase(loadPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
        // Update metadata
        state.metadata.totalCount = action.payload.length;
        state.metadata.categorizedCount = action.payload.filter(
          (photo: Photo) => photo.categoryIds.length > 0
        ).length;
        state.metadata.uncategorizedCount =
          state.metadata.totalCount - state.metadata.categorizedCount;
        state.metadata.favoriteCount = action.payload.filter(
          (photo: Photo) => photo.isFavorite
        ).length;
        state.metadata.totalSize = action.payload.reduce(
          (total: number, photo: Photo) => total + photo.size,
          0
        );
      })
      .addCase(loadPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Categorize photo
      .addCase(categorizePhoto.fulfilled, (state, action) => {
        const { photoId, categoryIds } = action.payload;
        const photo = state.photos.find((p: Photo) => p.id === photoId);
        if (photo) {
          photo.categoryIds = categoryIds;
        }
      })
      // Toggle favorite
      .addCase(togglePhotoFavorite.fulfilled, (state, action) => {
        const photoId = action.payload;
        const photo = state.photos.find((p: Photo) => p.id === photoId);
        if (photo) {
          photo.isFavorite = !photo.isFavorite;
        }
      });
  },
});

export const {
  setCurrentPhoto,
  setSortOrder,
  setFilters,
  clearFilters,
  clearError,
} = photoSlice.actions;

export default photoSlice.reducer; 