// Hooks exports
export { usePhotoPermissions } from './usePhotoPermissions';
export { usePhotoLibrary } from './usePhotoLibrary';
export { usePhotoMetadata } from './usePhotoMetadata';
export { useOptimizedImage } from './useOptimizedImage';
export { useCategoryMemory, useCategoryProgress as useCategoryProgressMemory, useNavigationTracking } from './useCategoryMemory';
export { useSessionManager, useSessionLifecycle, useSessionOperations } from './useSessionManager';
export { useProgressTracker, useProgressTracking, useProgressTrackerEvents } from './useProgressTracker';
export { useSessionRecovery } from './useSessionRecovery';
export { default as usePhotoTransition } from './usePhotoTransition';
export { useCategoryProgress } from './useCategoryProgress';
export { useCategoryProgressData } from './useCategoryProgressData';
export { useInAppPurchases } from './useInAppPurchases';
export { default as usePhotoNavigation } from './usePhotoNavigation';
export { useUndo } from './useUndo';
export { useUndoVisualFeedback } from './useUndoVisualFeedback';
export { useButtonAnimation } from './useButtonAnimation';
export { useDebouncedPress } from './useDebouncedPress';

// Type exports
export type { UsePhotoLibraryResult } from './usePhotoLibrary';
export type { PhotoTransitionOptions, PhotoTransitionReturn } from './usePhotoTransition';
export type { UseCategoryProgressReturn } from './useCategoryProgress';
export type { CategoryProgressData } from './useCategoryProgressData';
export type { UseCategoryMemoryConfig, UseCategoryMemoryReturn } from './useCategoryMemory';
export type { UseSessionManagerState, UseSessionManagerReturn, UseSessionManagerConfig } from './useSessionManager';
export type { UseProgressTrackerConfig, UseProgressTrackerReturn, UseProgressTrackerState } from './useProgressTracker';
export type { PhotoNavigationOptions, PhotoNavigationReturn } from './usePhotoNavigation';

// Re-export all types and hooks from specific modules
export * from './usePhotoPermissions';
export * from './usePhotoTransition';
export * from './useProgressTracker';
export * from './useSessionManager';
export * from './useSessionRecovery';
export * from './useUndo';
export * from './useUndoVisualFeedback';
export * from './useDebouncedPress'; 