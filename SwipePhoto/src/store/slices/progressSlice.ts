import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProgressState {
  current: number;
  total: number;
  sessionId: string;
  startTime: number;
  categories: {
    [categoryId: string]: {
      completed: number;
      total: number;
    };
  };
}

const initialState: ProgressState = {
  current: 0,
  total: 0,
  sessionId: '',
  startTime: 0,
  categories: {},
};

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    updateProgress: (state, action: PayloadAction<{ current: number }>) => {
      state.current = Math.max(0, Math.min(action.payload.current, state.total));
    },
    
    setTotal: (state, action: PayloadAction<{ total: number }>) => {
      state.total = Math.max(0, action.payload.total);
      // Reset current if it exceeds new total
      if (state.current > state.total) {
        state.current = state.total;
      }
    },
    
    incrementProgress: (state) => {
      if (state.current < state.total) {
        state.current += 1;
      }
    },
    
    decrementProgress: (state) => {
      if (state.current > 0) {
        state.current -= 1;
      }
    },
    
    resetProgress: (state) => {
      state.current = 0;
    },
    
    startSession: (state, action: PayloadAction<{ sessionId: string; total: number }>) => {
      state.sessionId = action.payload.sessionId;
      state.total = action.payload.total;
      state.current = 0;
      state.startTime = Date.now();
      state.categories = {};
    },
    
    endSession: (state) => {
      state.sessionId = '';
      state.current = 0;
      state.total = 0;
      state.startTime = 0;
      state.categories = {};
    },
    
    updateCategoryProgress: (
      state,
      action: PayloadAction<{
        categoryId: string;
        completed: number;
        total: number;
      }>
    ) => {
      const { categoryId, completed, total } = action.payload;
      state.categories[categoryId] = {
        completed: Math.max(0, Math.min(completed, total)),
        total: Math.max(0, total),
      };
    },
    
    resetCategoryProgress: (state, action: PayloadAction<{ categoryId: string }>) => {
      delete state.categories[action.payload.categoryId];
    },
  },
});

// Action creators
export const {
  updateProgress,
  setTotal,
  incrementProgress,
  decrementProgress,
  resetProgress,
  startSession,
  endSession,
  updateCategoryProgress,
  resetCategoryProgress,
} = progressSlice.actions;

// Selectors
export const selectProgress = (state: { progress: ProgressState }) => state.progress;

export const selectProgressPercentage = (state: { progress: ProgressState }): number => {
  const { current, total } = state.progress;
  return total > 0 ? Math.min((current / total) * 100, 100) : 0;
};

export const selectProgressText = (state: { progress: ProgressState }): string => {
  const { current, total } = state.progress;
  return `${current} of ${total}`;
};

export const selectIsSessionActive = (state: { progress: ProgressState }): boolean => {
  return Boolean(state.progress.sessionId);
};

export const selectSessionDuration = (state: { progress: ProgressState }): number => {
  return state.progress.startTime > 0 ? Date.now() - state.progress.startTime : 0;
};

export const selectCategoryProgress = (
  state: { progress: ProgressState },
  categoryId: string
) => {
  return state.progress.categories[categoryId] || { completed: 0, total: 0 };
};

export const selectOverallCategoryProgress = (state: { progress: ProgressState }) => {
  const categories = Object.values(state.progress.categories);
  const totalCompleted = categories.reduce((sum, cat) => sum + cat.completed, 0);
  const totalItems = categories.reduce((sum, cat) => sum + cat.total, 0);
  
  return {
    completed: totalCompleted,
    total: totalItems,
    percentage: totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0,
  };
};

export default progressSlice.reducer; 