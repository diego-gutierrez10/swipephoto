import photoReducer, { setPhotos, removePhotosByIds, PhotoState } from '../photoSlice';
import { Photo } from '../../../types/models/Photo';

describe('photoSlice reducer', () => {
  let initialState: PhotoState;

  beforeEach(() => {
    initialState = {
      photos: {
        byId: {},
        allIds: [],
      },
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
  });

  it('should handle initial state', () => {
    expect(photoReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setPhotos and normalize the state correctly', () => {
    const photosPayload: Photo[] = [
      { id: 'photo1', uri: 'uri1', size: 100, categoryIds: [], isFavorite: false, width: 100, height: 100, filename: 'photo1.jpg', createdAt: Date.now(), mimeType: 'image/jpeg', isHidden: false },
      { id: 'photo2', uri: 'uri2', size: 200, categoryIds: [], isFavorite: false, width: 100, height: 100, filename: 'photo2.jpg', createdAt: Date.now(), mimeType: 'image/jpeg', isHidden: false },
    ];

    const action = setPhotos(photosPayload);
    const newState = photoReducer(initialState, action);

    expect(newState.photos.allIds).toHaveLength(2);
    expect(newState.photos.allIds).toEqual(['photo1', 'photo2']);
    expect(newState.photos.byId['photo1']).toBeDefined();
    expect(newState.photos.byId['photo2']).toBeDefined();
    expect(newState.photos.byId['photo1'].size).toBe(100);
  });

  it('should handle removePhotosByIds correctly', () => {
    const populatedState: PhotoState = {
      ...initialState,
      photos: {
        byId: {
          'photo1': { id: 'photo1', uri: 'uri1', size: 100, categoryIds: [], isFavorite: false, width: 100, height: 100, filename: 'photo1.jpg', createdAt: Date.now(), mimeType: 'image/jpeg', isHidden: false },
          'photo2': { id: 'photo2', uri: 'uri2', size: 200, categoryIds: [], isFavorite: false, width: 100, height: 100, filename: 'photo2.jpg', createdAt: Date.now(), mimeType: 'image/jpeg', isHidden: false },
          'photo3': { id: 'photo3', uri: 'uri3', size: 300, categoryIds: [], isFavorite: false, width: 100, height: 100, filename: 'photo3.jpg', createdAt: Date.now(), mimeType: 'image/jpeg', isHidden: false },
        },
        allIds: ['photo1', 'photo2', 'photo3'],
      },
    };
    
    const action = removePhotosByIds(['photo1', 'photo3']);
    const newState = photoReducer(populatedState, action);

    expect(newState.photos.allIds).toHaveLength(1);
    expect(newState.photos.allIds).toEqual(['photo2']);
    expect(newState.photos.byId['photo1']).toBeUndefined();
    expect(newState.photos.byId['photo3']).toBeUndefined();
    expect(newState.photos.byId['photo2']).toBeDefined();
  });
}); 