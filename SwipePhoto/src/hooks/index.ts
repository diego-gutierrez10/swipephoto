// Hooks exports
export { usePhotoPermissions } from './usePhotoPermissions';
export { usePhotoLibrary } from './usePhotoLibrary';
export { usePhotoMetadata } from './usePhotoMetadata';
export { useOptimizedImage } from './useOptimizedImage';
export { default as usePhotoTransition } from './usePhotoTransition';
export { useCategoryProgress } from './useCategoryProgress';

// Type exports
export type { UsePhotoLibraryResult } from './usePhotoLibrary';
export type { OptimizedImageSource, UseOptimizedImageOptions, UseOptimizedImageResult } from './useOptimizedImage';
export type { PhotoTransitionOptions, PhotoTransitionReturn } from './usePhotoTransition';
export type { UseCategoryProgressReturn } from './useCategoryProgress';

export { default as usePhotoNavigation } from './usePhotoNavigation';
export type { PhotoNavigationOptions, PhotoNavigationReturn } from './usePhotoNavigation';

// Undo functionality
export { useUndo } from './useUndo';
export { useButtonAnimation } from './useButtonAnimation'; 