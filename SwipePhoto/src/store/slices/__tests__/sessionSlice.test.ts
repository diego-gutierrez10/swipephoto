import sessionReducer, {
  updateNavigationState,
  updateProgressState,
  updateUserPreferences,
  resetSession,
  setSessionData,
} from '../sessionSlice';
import { SessionState, createDefaultSessionState } from '../../../types/session';

type SessionSliceState = {
  sessionData: SessionState | null;
  isLoading: boolean;
  isLoaded: boolean;
  isSaving: boolean;
  error: string | null;
  sessionExists: boolean;
  lastSyncTime: number | null;
  migrationStatus: 'none' | 'needed' | 'in_progress' | 'completed' | 'failed';
  migrationError: string | null;
};

describe('sessionSlice reducers', () => {
  let initialState: SessionSliceState;
  let loadedState: SessionSliceState;
  
  beforeEach(() => {
    initialState = {
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
    
    const defaultSession = createDefaultSessionState('test-session');
    loadedState = {
      ...initialState,
      sessionData: defaultSession,
      isLoaded: true,
    };
  });

  it('should handle setSessionData', () => {
    const session = createDefaultSessionState('new-session');
    const action = setSessionData(session);
    const newState = sessionReducer(initialState, action);
    expect(newState.sessionData?.sessionId).toBe('new-session');
    expect(newState.isLoaded).toBe(true);
  });

  it('should handle updateNavigationState', () => {
    const navigationUpdate = { currentScreen: 'Settings', currentPhotoIndex: 50 };
    const action = updateNavigationState(navigationUpdate);
    const newState = sessionReducer(loadedState, action);
    expect(newState.sessionData?.navigation.currentScreen).toBe('Settings');
    expect(newState.sessionData?.navigation.currentPhotoIndex).toBe(50);
  });

  it('should handle updateProgressState', () => {
    const progressUpdate = { photosProcessed: 100, categoriesCompleted: ['cat1'] };
    const action = updateProgressState(progressUpdate);
    const newState = sessionReducer(loadedState, action);
    expect(newState.sessionData?.progress.photosProcessed).toBe(100);
    expect(newState.sessionData?.progress.categoriesCompleted).toEqual(['cat1']);
  });

  it('should handle updateUserPreferences', () => {
    const prefsUpdate = { theme: 'dark' as const, hapticFeedbackEnabled: false };
    const action = updateUserPreferences(prefsUpdate);
    const newState = sessionReducer(loadedState, action);
    expect(newState.sessionData?.userPreferences.theme).toBe('dark');
    expect(newState.sessionData?.userPreferences.hapticFeedbackEnabled).toBe(false);
  });
  
  it('should handle resetSession', () => {
    const action = resetSession();
    const newState = sessionReducer(loadedState, action);
    expect(newState).toEqual(initialState);
  });
}); 