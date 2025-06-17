import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Category, CategoryStats, CategorySortOrder } from '../../types';
import { DEFAULT_CATEGORIES } from '../../types';

export interface CategoryState {
  categories: Category[];
  selectedCategoryIds: string[];
  stats: CategoryStats;
  loading: boolean;
  error: string | null;
  sortOrder: CategorySortOrder;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategoryIds: [],
  stats: {
    totalCategories: 0,
    defaultCategories: 0,
    customCategories: 0,
    mostUsedCategory: null,
    leastUsedCategory: null,
  },
  loading: false,
  error: null,
  sortOrder: 'custom',
};

// Async thunks
export const loadCategories = createAsyncThunk(
  'categories/loadCategories',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Load categories from AsyncStorage or initialize with defaults
      const savedCategories: Category[] = []; // Load from storage
      
      if (savedCategories.length === 0) {
        // Initialize with default categories
        const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
          ...cat,
          id: `default-${index}`,
          createdAt: new Date(),
          modifiedAt: new Date(),
          photoCount: 0,
        }));
        return defaultCategories;
      }
      
      return savedCategories;
    } catch (error) {
      return rejectWithValue('Failed to load categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'modifiedAt' | 'photoCount'>,
    { rejectWithValue }
  ) => {
    try {
      const newCategory: Category = {
        ...categoryData,
        id: `custom-${Date.now()}`,
        createdAt: new Date(),
        modifiedAt: new Date(),
        photoCount: 0,
      };
      
      // TODO: Save to AsyncStorage
      return newCategory;
    } catch (error) {
      return rejectWithValue('Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (
    { id, updates }: { id: string; updates: Partial<Category> },
    { rejectWithValue }
  ) => {
    try {
      const updatedCategory = {
        id,
        updates: {
          ...updates,
          modifiedAt: new Date(),
        },
      };
      
      // TODO: Save to AsyncStorage
      return updatedCategory;
    } catch (error) {
      return rejectWithValue('Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      // TODO: Remove from AsyncStorage and update photos
      return categoryId;
    } catch (error) {
      return rejectWithValue('Failed to delete category');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setSelectedCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategoryIds = action.payload;
    },
    toggleCategorySelection: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const index = state.selectedCategoryIds.indexOf(categoryId);
      
      if (index > -1) {
        state.selectedCategoryIds.splice(index, 1);
      } else {
        state.selectedCategoryIds.push(categoryId);
      }
    },
    clearSelectedCategories: (state) => {
      state.selectedCategoryIds = [];
    },
    setSortOrder: (state, action: PayloadAction<CategorySortOrder>) => {
      state.sortOrder = action.payload;
    },
    updateCategoryPhotoCount: (
      state,
      action: PayloadAction<{ categoryId: string; count: number }>
    ) => {
      const { categoryId, count } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        category.photoCount = count;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load categories
      .addCase(loadCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        // Update stats
        state.stats.totalCategories = action.payload.length;
        state.stats.defaultCategories = action.payload.filter(
          (cat: Category) => cat.isDefault
        ).length;
        state.stats.customCategories =
          state.stats.totalCategories - state.stats.defaultCategories;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.stats.totalCategories++;
        if (!action.payload.isDefault) {
          state.stats.customCategories++;
        }
      })
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const categoryIndex = state.categories.findIndex((cat) => cat.id === id);
        if (categoryIndex > -1) {
          state.categories[categoryIndex] = {
            ...state.categories[categoryIndex],
            ...updates,
          };
        }
      })
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const categoryId = action.payload;
        const categoryIndex = state.categories.findIndex((cat) => cat.id === categoryId);
        if (categoryIndex > -1) {
          const deletedCategory = state.categories[categoryIndex];
          state.categories.splice(categoryIndex, 1);
          state.stats.totalCategories--;
          if (!deletedCategory.isDefault) {
            state.stats.customCategories--;
          }
        }
        // Remove from selected categories
        const selectedIndex = state.selectedCategoryIds.indexOf(categoryId);
        if (selectedIndex > -1) {
          state.selectedCategoryIds.splice(selectedIndex, 1);
        }
      });
  },
});

export const {
  setSelectedCategories,
  toggleCategorySelection,
  clearSelectedCategories,
  setSortOrder,
  updateCategoryPhotoCount,
  clearError,
} = categorySlice.actions;

export default categorySlice.reducer; 