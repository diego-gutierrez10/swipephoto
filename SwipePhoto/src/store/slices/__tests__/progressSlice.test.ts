import progressReducer, {
  startSession,
  updateProgress,
  incrementProgress,
  updateCategoryProgress,
  ProgressState,
} from '../progressSlice';

describe('progressSlice reducer', () => {
  let initialState: ProgressState;

  beforeEach(() => {
    initialState = {
      current: 0,
      total: 0,
      sessionId: '',
      startTime: 0,
      categories: {},
    };
  });

  it('should handle initial state', () => {
    expect(progressReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle startSession', () => {
    const action = startSession({ sessionId: 'session1', total: 100 });
    const newState = progressReducer(initialState, action);
    expect(newState.sessionId).toBe('session1');
    expect(newState.total).toBe(100);
    expect(newState.current).toBe(0);
    expect(newState.startTime).toBeGreaterThan(0);
  });

  it('should handle updateProgress', () => {
    const stateWithSession = { ...initialState, total: 100 };
    const action = updateProgress({ current: 50 });
    const newState = progressReducer(stateWithSession, action);
    expect(newState.current).toBe(50);
  });
  
  it('should not allow progress to exceed total', () => {
    const stateWithSession = { ...initialState, total: 100, current: 90 };
    const action = updateProgress({ current: 110 });
    const newState = progressReducer(stateWithSession, action);
    expect(newState.current).toBe(100);
  });

  it('should handle incrementProgress', () => {
    const stateWithSession = { ...initialState, total: 10, current: 5 };
    const action = incrementProgress();
    const newState = progressReducer(stateWithSession, action);
    expect(newState.current).toBe(6);
  });

  it('should not increment progress beyond total', () => {
    const stateWithSession = { ...initialState, total: 10, current: 10 };
    const action = incrementProgress();
    const newState = progressReducer(stateWithSession, action);
    expect(newState.current).toBe(10);
  });
  
  it('should handle updateCategoryProgress', () => {
    const action = updateCategoryProgress({ categoryId: 'cat1', completed: 5, total: 10 });
    const newState = progressReducer(initialState, action);
    expect(newState.categories['cat1']).toBeDefined();
    expect(newState.categories['cat1'].completed).toBe(5);
    expect(newState.categories['cat1'].total).toBe(10);
  });
}); 