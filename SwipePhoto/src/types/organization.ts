import { PhotoAsset } from './photo';

/**
 * Base interface for photo categories
 */
export interface PhotoCategory {
  id: string;
  displayName: string;
  count: number;
  lastUpdated: number;
  photoIds: string[];
}

/**
 * Month-based photo category
 */
export interface MonthCategory extends PhotoCategory {
  type: 'month';
  year: number;
  month: number; // 0-11 (JavaScript Date format)
  monthName: string; // "January", "February", etc.
  fullDisplayName: string; // "January 2024"
}

/**
 * Source-based photo category
 */
export interface SourceCategory extends PhotoCategory {
  type: 'source';
  sourceType: string;
  icon?: string;
  description?: string;
}

/**
 * Photo source types - this is now defined and simplified in PhotoCountingService.ts
 * The robust logic there will handle categorization into 'cameraRoll', 'screenshots', and 'otherApps'.
 */
// export enum PhotoSourceType {
//   CAMERA_ROLL = 'camera_roll',
//   WHATSAPP = 'whatsapp',
//   SCREENSHOTS = 'screenshots',
//   INSTAGRAM = 'instagram',
//   TELEGRAM = 'telegram',
//   SAFARI = 'safari',
//   OTHER_APPS = 'other_apps',
//   UNKNOWN = 'unknown'
// }

/**
 * Photo reference with category information
 */
export interface PhotoReference {
  photoId: string;
  photo: PhotoAsset;
  monthCategoryId: string | null;
  sourceCategoryId: string | null;
  organizationScore: number; // Confidence in categorization (0-1)
  lastUpdated: number;
}

/**
 * Organization metadata
 */
export interface OrganizationMetadata {
  totalPhotos: number;
  totalCategories: number;
  lastOrganized: number;
  organizationVersion: string;
  isOrganizing: boolean;
  progress: OrganizationProgress;
}

/**
 * Organization progress tracking
 */
export interface OrganizationProgress {
  current: number;
  total: number;
  currentOperation: string;
  estimatedTimeRemaining?: number;
}

/**
 * Category lookup indexes for performance
 */
export interface CategoryIndexes {
  photoToCategories: Record<string, {
    monthCategoryId: string | null;
    sourceCategoryId: string | null;
  }>;
  monthsByYear: Record<number, string[]>; // year -> month category IDs
  sourcesByType: Record<string, string[]>; // source type -> source category IDs
}

/**
 * Organization filters
 */
export interface OrganizationFilters {
  dateRange?: {
    start: number;
    end: number;
  };
  sources?: string[]; // Changed from PhotoSourceType[]
  minPhotos?: number;
  sortBy: 'date' | 'count' | 'name';
  sortOrder: 'asc' | 'desc';
}

/**
 * Main Redux state for photo organization
 */
export interface OrganizationState {
  // Categories
  monthCategories: Record<string, MonthCategory>;
  sourceCategories: Record<string, SourceCategory>;
  
  // Photo references
  photoReferences: Record<string, PhotoReference>;
  
  // Indexes for performance
  indexes: CategoryIndexes;
  
  // Metadata and status
  metadata: OrganizationMetadata;
  
  // UI state
  filters: OrganizationFilters;
  selectedCategoryId: string | null;
  selectedCategoryType: 'month' | 'source' | null;
  deletionQueue: Record<string, string[]>; // categoryId -> photoId[]
  
  // Error handling
  error: string | null;
  lastError: number | null;

  // Usage stats
  lastFreedSpace: number;
  accumulatedFreedSpace: number;
}

/**
 * Organization operation results
 */
export interface OrganizationResult {
  success: boolean;
  categoriesCreated: number;
  photosOrganized: number;
  errors: string[];
  processingTime: number;
}

/**
 * Batch organization request
 */
export interface BatchOrganizationRequest {
  photos: PhotoAsset[];
  options: {
    skipExisting?: boolean;
    updateMetadata?: boolean;
    batchSize?: number;
    progressCallback?: (progress: OrganizationProgress) => void;
  };
}

/**
 * Category creation options
 */
export interface CategoryCreationOptions {
  autoCreate: boolean;
  mergeExisting: boolean;
  updateCounts: boolean;
  validateReferences: boolean;
}

/**
 * Organization service interface
 */
export interface IOrganizationService {
  organizePhotos(request: BatchOrganizationRequest): Promise<OrganizationResult>;
  createMonthCategory(year: number, month: number): MonthCategory;
  createSourceCategory(sourceType: string): SourceCategory; // Changed from PhotoSourceType
  detectPhotoSource(photo: PhotoAsset): string; // Changed from PhotoSourceType
  getPhotosByCategory(categoryId: string, categoryType: 'month' | 'source'): PhotoAsset[];
  updateCategoryCounts(): void;
  rebuildIndexes(): void;
} 