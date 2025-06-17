/**
 * Photo Library Types for SwipePhoto
 * Provides TypeScript definitions for photo library access and manipulation
 */

/**
 * Options for configuring the photo picker
 */
export interface PhotoPickerOptions {
  /** Allow multiple photo selection */
  allowsMultipleSelection?: boolean;
  /** Maximum number of photos to select (when multiple selection enabled) */
  maxSelection?: number;
  /** Image quality (0-1, where 1 is highest quality) */
  quality?: number;
  /** Types of media to show in picker */
  mediaTypes?: 'photo' | 'video' | 'all';
  /** Allow basic editing before selection */
  allowsEditing?: boolean;
  /** Aspect ratio for editing (only when allowsEditing is true) */
  aspect?: [number, number];
  /** Include EXIF data in result */
  includeExif?: boolean;
}

/**
 * Represents a photo asset from the device library
 */
export interface PhotoAsset {
  /** Unique identifier for the photo */
  id: string;
  /** Local URI to access the photo */
  uri: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File size in bytes */
  fileSize?: number;
  /** Original filename */
  fileName?: string;
  /** Creation timestamp (milliseconds since epoch) */
  creationTime?: number;
  /** File type/extension */
  type?: string;
  /** Duration (for videos) */
  duration?: number;
  /** EXIF data if requested */
  exif?: Record<string, any>;
}

/**
 * Options for image processing and manipulation
 */
export interface ProcessingOptions {
  /** Maximum width for resizing */
  maxWidth?: number;
  /** Maximum height for resizing */
  maxHeight?: number;
  /** Compression quality (0-1) */
  quality?: number;
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp';
  /** Whether to include base64 data in result */
  includeBase64?: boolean;
  /** Rotation angle in degrees */
  rotate?: number;
  /** Flip horizontally */
  flipHorizontal?: boolean;
  /** Flip vertically */
  flipVertical?: boolean;
}

/**
 * Result of image processing operation
 */
export interface ProcessedImage {
  /** URI of the processed image */
  uri: string;
  /** Processed image width */
  width: number;
  /** Processed image height */
  height: number;
  /** File size in bytes */
  size: number;
  /** Image format */
  format: string;
  /** Base64 encoded image data (if requested) */
  base64?: string;
  /** Original asset info (if available) */
  originalAsset?: PhotoAsset;
}

/**
 * Photo library service operation result
 */
export interface PhotoLibraryResult<T = PhotoAsset[]> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if operation failed */
  error?: string;
  /** Whether user cancelled the operation */
  cancelled?: boolean;
}

/**
 * Options for fetching recent photos from library
 */
export interface RecentPhotosOptions {
  /** Number of photos to fetch */
  limit?: number;
  /** Media type to fetch */
  mediaType?: 'photo' | 'video' | 'all';
  /** Sort order */
  sortBy?: 'creationTime' | 'modificationTime' | 'mediaType';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Include location data if available */
  includeLocation?: boolean;
}

/**
 * Photo library service interface
 */
export interface IPhotoLibraryService {
  /** Open system photo picker */
  openPhotoPicker(options?: PhotoPickerOptions): Promise<PhotoLibraryResult<PhotoAsset[]>>;
  
  /** Get recent photos from library */
  getRecentPhotos(options?: RecentPhotosOptions): Promise<PhotoLibraryResult<PhotoAsset[]>>;
  
  /** Get specific photo by ID */
  getPhotoById(id: string): Promise<PhotoLibraryResult<PhotoAsset>>;
  
  /** Get multiple photos by IDs */
  getPhotosByIds(ids: string[]): Promise<PhotoLibraryResult<PhotoAsset[]>>;
  
  /** Check if photo library access is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Image processing service interface
 */
export interface IImageProcessingService {
  /** Process/manipulate an image */
  processImage(uri: string, options?: ProcessingOptions): Promise<ProcessedImage>;
  
  /** Get base64 representation of image */
  getBase64(uri: string): Promise<string>;
  
  /** Get image metadata */
  getImageInfo(uri: string): Promise<{ width: number; height: number; size: number; format: string }>;
  
  /** Resize image to fit within specified dimensions */
  resizeImage(uri: string, maxWidth: number, maxHeight: number, quality?: number): Promise<ProcessedImage>;
  
  /** Compress image */
  compressImage(uri: string, quality: number): Promise<ProcessedImage>;
}

/**
 * Photo library error types
 */
export enum PhotoLibraryError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAVAILABLE = 'UNAVAILABLE',
  USER_CANCELLED = 'USER_CANCELLED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for photo library operations
 */
export class PhotoLibraryException extends Error {
  constructor(
    public code: PhotoLibraryError,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PhotoLibraryException';
  }
}

// Re-export for compatibility
export const PhotoLibraryErrorType = PhotoLibraryError;

/**
 * Comprehensive photo metadata extracted from EXIF and other sources
 */
export interface PhotoMetadata {
  // Basic file information
  creationDate: number;
  modificationDate: number;
  fileSize: number;
  fileName: string;
  fileFormat: string;
  width: number;
  height: number;
  orientation?: number;
  
  // Location data (GPS)
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp: number;
  };
  
  // EXIF technical data
  exif?: {
    // Camera settings
    fNumber?: number;
    exposureTime?: number;
    iso?: number;
    focalLength?: number;
    flash?: boolean;
    whiteBalance?: string;
    
    // Image technical details
    pixelXDimension?: number;
    pixelYDimension?: number;
    colorSpace?: string;
    
    // Date/time information
    dateTime?: string;
    dateTimeOriginal?: string;
    dateTimeDigitized?: string;
    
    // Camera/device information
    make?: string;
    model?: string;
    software?: string;
    
    // Additional metadata
    artist?: string;
    copyright?: string;
    userComment?: string;
  };
  
  // Device and app information
  deviceInfo?: {
    platform: string;
    osVersion: string;
    deviceModel?: string;
  };
  
  // Application source detection
  sourceApplication?: string;
  
  // Optional user-defined metadata
  tags?: string[];
  description?: string;
}

/**
 * Options for metadata extraction and processing
 */
export interface PhotoMetadataOptions {
  /** Include GPS location data */
  includeLocation?: boolean;
  /** Include EXIF technical data */
  includeExif?: boolean;
  /** Include device information */
  includeDeviceInfo?: boolean;
  /** Strip potentially sensitive data */
  stripSensitiveData?: boolean;
  /** Cache results for performance */
  cacheResults?: boolean;
}

/**
 * Sanitized metadata with sensitive information removed
 */
export interface SanitizedMetadata {
  // Safe file information
  creationDate: number;
  modificationDate: number;
  fileSize: number;
  fileName: string; // Sanitized filename
  fileFormat: string;
  width: number;
  height: number;
  orientation?: number;
  
  // Flags indicating what was removed
  hasLocation: boolean;
  hasExif: boolean;
  hasDeviceInfo: boolean;
  
  // Optional safe metadata
  tags?: string[];
  description?: string;
}

/**
 * Result wrapper for metadata operations
 */
export interface MetadataResult<T> {
  success: boolean;
  data?: T;
  error?: {
    type: PhotoLibraryError;
    message: string;
  };
  cached?: boolean;
}

/**
 * Cache entry for metadata
 */
export interface MetadataCacheEntry {
  metadata: PhotoMetadata;
  timestamp: number;
  ttl: number;
}

/**
 * Batch metadata extraction request
 */
export interface BatchMetadataRequest {
  photoIds: string[];
  options?: PhotoMetadataOptions;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Batch metadata extraction result
 */
export interface BatchMetadataResult {
  successful: MetadataResult<PhotoMetadata>[];
  failed: { photoId: string; error: string }[];
  totalProcessed: number;
} 