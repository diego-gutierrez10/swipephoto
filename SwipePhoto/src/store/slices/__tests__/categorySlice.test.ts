import categoryReducer, {
  setLoading,
  setError,
  setCategories,
  setCategoryCleanedStatus,
  CategoryState,
} from '../categorySlice';
import { SourceCategory, MonthCategory } from '../../../types';

describe('categorySlice reducer', () => {
  let initialState: CategoryState;

  beforeEach(() => {
    initialState = {
      categories: [],
      categoryCounts: null,
      loadedCategories: [],
      categoryPagination: {},
      loading: false,
      countingLoading: false,
      error: null,
    };
  });

  it('should handle initial state', () => {
    expect(categoryReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setLoading', () => {
    const action = setLoading(true);
    const newState = categoryReducer(initialState, action);
    expect(newState.loading).toBe(true);
  });

  it('should handle setError', () => {
    const error = 'Failed to load';
    const action = setError(error);
    const newState = categoryReducer({ ...initialState, loading: true }, action);
    expect(newState.error).toBe(error);
    expect(newState.loading).toBe(false);
  });

  it('should handle setCategories and map them correctly', () => {
    const sourceCategories: SourceCategory[] = [
      { id: 'source1', displayName: 'Camera Roll', photoIds: ['p1', 'p2'], count: 2, type: 'source', sourceType: 'camera_roll' as any, lastUpdated: Date.now() },
    ];
    const monthCategories: MonthCategory[] = [
      { id: 'month1', displayName: 'June 2024', photoIds: ['p3'], count: 1, type: 'month', year: 2024, month: 5, monthName: 'June', fullDisplayName: 'June 2024', lastUpdated: Date.now() },
    ];

    const action = setCategories({ sourceCategories, monthCategories });
    const newState = categoryReducer(initialState, action);

    expect(newState.categories).toHaveLength(2);
    expect(newState.loading).toBe(false);
    expect(newState.error).toBeNull();
    
    const cameraRoll = newState.categories.find(c => c.id === 'source1');
    expect(cameraRoll).toBeDefined();
    expect(cameraRoll?.name).toBe('Camera Roll');
    expect(cameraRoll?.count).toBe(2);
    expect(cameraRoll?.sourceType).toBe('source');
    expect(cameraRoll?.isCleaned).toBe(false);

    const june = newState.categories.find(c => c.id === 'month1');
    expect(june).toBeDefined();
    expect(june?.name).toBe('June 2024');
    expect(june?.sourceType).toBe('month');
  });

  it('should handle setCategoryCleanedStatus', () => {
    const stateWithCategory: CategoryState = {
      ...initialState,
      categories: [
        { id: 'cat1', name: 'Test', photoIds: [], count: 0, thumbnail: null, isCleaned: false, sourceType: 'source' },
      ],
      categoryPagination: {},
    };
    
    const action = setCategoryCleanedStatus({ categoryId: 'cat1', isCleaned: true });
    const newState = categoryReducer(stateWithCategory, action);

    const updatedCategory = newState.categories.find(c => c.id === 'cat1');
    expect(updatedCategory?.isCleaned).toBe(true);
  });
}); 