import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  getAssetsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  deleteAssetsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

jest.mock('./src/services/PhotoLibraryService', () => ({
  getInstance: () => ({
    getRecentPhotos: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test-document-directory/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, isDirectory: false })),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-image', () => ({
  Image: () => 'Image',
  prefetch: jest.fn(),
}));

jest.mock('./src/services/SessionStorageService', () => ({
  SessionStorageService: jest.fn().mockImplementation(() => {
    return {
      load: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      isSessionAvailable: jest.fn().mockResolvedValue(false),
    };
  }),
})); 