/**
 * sessionSlice.ts
 * 
 * Redux slice for session management and state persistence.
 * Handles session loading, saving, and state synchronization.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  SessionState, 
  SessionNavigationState, 
  SessionProgressState, 
  SessionUserPreferences,
  createDefaultSessionState,
} from '../../types/session';
import { SessionStorageService } from '../../services/SessionStorageService';
import { SessionMigrationService } from '../../services/SessionMigrationService';

/**
 * Session slice state interface
 */
interface SessionSliceState {
  // Session data
  sessionData: SessionState | null;
  
  // Loading states
  isLoading: boolean;
  isLoaded: boolean;
  isSaving: boolean;
  
  // Error handling
  error: string | null;
  
  // Session metadata
  sessionExists: boolean;
  lastSyncTime: number | null;
  
  // Migration status
  migrationStatus: 'none' | 'needed' | 'in_progress' | 'completed' | 'failed';
  migrationError: string | null;
}

/**
 * Initial state
 */
const initialState: SessionSliceState = {
  sessionData: null,
  isLoading: false,
  isLoaded: false,
  isSaving: false,
  error: null,
  sessionExists: false,
  lastSyncTime: null,
  migrationStatus: 'none',
  migrationError: null,
};

// Create service instances
const sessionStorage = new SessionStorageService();
const migrationService = new SessionMigrationService();

/**
 * Async thunks for session operations
 */

// Load session from storage
export const loadSession = createAsyncThunk(
  'session/loadSession',
  async (_, { rejectWithValue }) => {
    try {
      const sessionData = await sessionStorage.load();
      
      if (!sessionData) {
        // No session exists, create a new one
        const newSession = createDefaultSessionState(`session_${Date.now()}`);
        return { sessionData: newSession, isNew: true };
      }

      return { sessionData, isNew: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      return rejectWithValue(errorMessage);
    }
  }
);

// Save session to storage
export const saveSession = createAsyncThunk(
  'session/saveSession',
  async (sessionData: SessionState, { rejectWithValue }) => {
    try {
      await sessionStorage.save(sessionData);
      return sessionData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save session';
      return rejectWithValue(errorMessage);
    }
  }
);

// Clear session data
export const clearSession = createAsyncThunk(
  'session/clearSession',
  async (_, { rejectWithValue }) => {
    try {
      await sessionStorage.clear();
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear session';
      return rejectWithValue(errorMessage);
    }
  }
);

// Check if session exists
export const checkSessionExists = createAsyncThunk(
  'session/checkSessionExists',
  async (_, { rejectWithValue }) => {
    try {
      const exists = await sessionStorage.isSessionAvailable();
      return exists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check session';
      return rejectWithValue(errorMessage);
    }
  }
);

// Migrate session if needed
export const migrateSession = createAsyncThunk(
  'session/migrateSession',
  async ({ oldSession, targetVersion }: { oldSession: any; targetVersion: string }, { rejectWithValue }) => {
    try {
      const migratedSession = await migrationService.migrate(
        oldSession, 
        oldSession.version || '1.0.0', 
        targetVersion
      );
      
      // Save migrated session
      await sessionStorage.save(migratedSession);
      
      return migratedSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to migrate session';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Session slice
 */
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Update navigation state
    updateNavigationState: (state, action: PayloadAction<Partial<SessionNavigationState>>) => {
      if (state.sessionData) {
        state.sessionData.navigation = {
          ...state.sessionData.navigation,
          ...action.payload,
        };
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update progress state
    updateProgressState: (state, action: PayloadAction<Partial<SessionProgressState>>) => {
      if (state.sessionData) {
        state.sessionData.progress = {
          ...state.sessionData.progress,
          ...action.payload,
          lastActivityTime: Date.now(),
        };
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update user preferences
    updateUserPreferences: (state, action: PayloadAction<Partial<SessionUserPreferences>>) => {
      if (state.sessionData) {
        state.sessionData.userPreferences = {
          ...state.sessionData.userPreferences,
          ...action.payload,
        };
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update current screen
    updateCurrentScreen: (state, action: PayloadAction<string>) => {
      if (state.sessionData) {
        state.sessionData.navigation.currentScreen = action.payload;
        state.sessionData.navigation.previousScreen = state.sessionData.navigation.currentScreen;
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update current photo index
    updateCurrentPhotoIndex: (state, action: PayloadAction<number>) => {
      if (state.sessionData) {
        state.sessionData.navigation.currentPhotoIndex = action.payload;
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update selected category
    updateSelectedCategory: (state, action: PayloadAction<{ id: string | null; type: 'month' | 'source' | null }>) => {
      if (state.sessionData) {
        state.sessionData.navigation.selectedCategoryId = action.payload.id;
        state.sessionData.navigation.selectedCategoryType = action.payload.type;
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Update session metadata
    updateSessionMetadata: (state, action: PayloadAction<Partial<SessionState['metadata']>>) => {
      if (state.sessionData) {
        state.sessionData.metadata = {
          ...state.sessionData.metadata,
          ...action.payload,
        };
        state.sessionData.lastSaved = Date.now();
      }
    },

    // Clear error state
    clearError: (state) => {
      state.error = null;
      state.migrationError = null;
    },

    // Set session data directly (for testing)
    setSessionData: (state, action: PayloadAction<SessionState>) => {
      state.sessionData = action.payload;
      state.isLoaded = true;
    },

    // Reset session state
    resetSession: (state) => {
      state.sessionData = null;
      state.isLoaded = false;
      state.error = null;
      state.sessionExists = false;
      state.lastSyncTime = null;
      state.migrationStatus = 'none';
      state.migrationError = null;
    },
  },

  extraReducers: (builder) => {
    // Load session
    builder
      .addCase(loadSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoaded = true;
        state.sessionData = action.payload.sessionData;
        state.sessionExists = !action.payload.isNew;
        state.lastSyncTime = Date.now();
        state.error = null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoaded = false;
        state.error = action.payload as string || 'Failed to load session';
      });

    // Save session
    builder
      .addCase(saveSession.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveSession.fulfilled, (state, action) => {
        state.isSaving = false;
        state.sessionData = action.payload;
        state.lastSyncTime = Date.now();
        state.error = null;
      })
      .addCase(saveSession.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string || 'Failed to save session';
      });

    // Clear session
    builder
      .addCase(clearSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearSession.fulfilled, (state) => {
        state.isLoading = false;
        state.sessionData = null;
        state.isLoaded = false;
        state.sessionExists = false;
        state.lastSyncTime = null;
        state.error = null;
      })
      .addCase(clearSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to clear session';
      });

    // Check session exists
    builder
      .addCase(checkSessionExists.fulfilled, (state, action) => {
        state.sessionExists = action.payload;
      })
      .addCase(checkSessionExists.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to check session';
      });

    // Migrate session
    builder
      .addCase(migrateSession.pending, (state) => {
        state.migrationStatus = 'in_progress';
        state.migrationError = null;
      })
      .addCase(migrateSession.fulfilled, (state, action) => {
        state.migrationStatus = 'completed';
        state.sessionData = action.payload;
        state.isLoaded = true;
        state.lastSyncTime = Date.now();
        state.migrationError = null;
      })
      .addCase(migrateSession.rejected, (state, action) => {
        state.migrationStatus = 'failed';
        state.migrationError = action.payload as string || 'Failed to migrate session';
      });
  },
});

// Export actions
export const {
  updateNavigationState,
  updateProgressState,
  updateUserPreferences,
  updateCurrentScreen,
  updateCurrentPhotoIndex,
  updateSelectedCategory,
  updateSessionMetadata,
  clearError,
  setSessionData,
  resetSession,
} = sessionSlice.actions;

// Export reducer
export default sessionSlice.reducer;

// Export selectors
export const sessionSelectors = {
  // Basic selectors
  selectSessionData: (state: { session: SessionSliceState }) => state.session.sessionData,
  selectIsLoading: (state: { session: SessionSliceState }) => state.session.isLoading,
  selectIsLoaded: (state: { session: SessionSliceState }) => state.session.isLoaded,
  selectIsSaving: (state: { session: SessionSliceState }) => state.session.isSaving,
  selectError: (state: { session: SessionSliceState }) => state.session.error,
  selectSessionExists: (state: { session: SessionSliceState }) => state.session.sessionExists,
  selectLastSyncTime: (state: { session: SessionSliceState }) => state.session.lastSyncTime,
  
  // Migration selectors
  selectMigrationStatus: (state: { session: SessionSliceState }) => state.session.migrationStatus,
  selectMigrationError: (state: { session: SessionSliceState }) => state.session.migrationError,
  
  // Navigation selectors
  selectCurrentScreen: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.navigation.currentScreen || 'Home',
  selectCurrentPhotoIndex: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.navigation.currentPhotoIndex || 0,
  selectSelectedCategory: (state: { session: SessionSliceState }) => ({
    id: state.session.sessionData?.navigation.selectedCategoryId || null,
    type: state.session.sessionData?.navigation.selectedCategoryType || null,
  }),
  selectScrollPosition: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.navigation.scrollPosition || 0,
  
  // Progress selectors
  selectSessionProgress: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.progress || null,
  selectPhotosProcessed: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.progress.photosProcessed || 0,
  selectCurrentCategoryProgress: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.progress.currentCategoryProgress || null,
  
  // User preferences selectors
  selectUserPreferences: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.userPreferences || null,
  selectTheme: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.userPreferences.theme || 'system',
  selectHapticFeedbackEnabled: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.userPreferences.hapticFeedbackEnabled ?? true,
  selectSoundEnabled: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.userPreferences.soundEnabled ?? true,
  
  // Session metadata selectors
  selectSessionId: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.sessionId || null,
  selectSessionVersion: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.version || null,
  selectSessionMetadata: (state: { session: SessionSliceState }) => 
    state.session.sessionData?.metadata || null,
}; 