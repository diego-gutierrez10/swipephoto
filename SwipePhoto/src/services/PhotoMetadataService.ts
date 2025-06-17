import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import {
  PhotoMetadata,
  PhotoMetadataOptions,
  SanitizedMetadata,
  MetadataResult,
  MetadataCacheEntry,
  BatchMetadataRequest,
  BatchMetadataResult,
  PhotoLibraryErrorType,
  PhotoLibraryException
} from '../types/photo';

export interface IPhotoMetadataService {
  extractMetadata(photoId: string, options?: PhotoMetadataOptions): Promise<MetadataResult<PhotoMetadata>>;
  getPhotoDetails(photoId: string): Promise<MetadataResult<PhotoMetadata>>;
  sanitizeMetadata(metadata: PhotoMetadata, options?: PhotoMetadataOptions): SanitizedMetadata;
  batchExtractMetadata(request: BatchMetadataRequest): Promise<BatchMetadataResult>;
  clearCache(): void;
  getCacheSize(): number;
}

export class PhotoMetadataService implements IPhotoMetadataService {
  private static instance: PhotoMetadataService;
  private metadataCache = new Map<string, MetadataCacheEntry>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): PhotoMetadataService {
    if (!PhotoMetadataService.instance) {
      PhotoMetadataService.instance = new PhotoMetadataService();
    }
    return PhotoMetadataService.instance;
  }

  /**
   * Extract comprehensive metadata from a photo
   */
  async extractMetadata(
    photoId: string, 
    options: PhotoMetadataOptions = {}
  ): Promise<MetadataResult<PhotoMetadata>> {
    try {
      // Set default options
      const opts = {
        includeLocation: true,
        includeExif: true,
        includeDeviceInfo: true,
        stripSensitiveData: false,
        cacheResults: true,
        ...options
      };

      // Check cache first
      if (opts.cacheResults) {
        const cached = this.getCachedMetadata(photoId);
        if (cached) {
          return {
            success: true,
            data: this.applyPrivacyOptions(cached, opts),
            cached: true
          };
        }
      }

      // Get basic asset info from MediaLibrary
      const assetInfo = await MediaLibrary.getAssetInfoAsync(photoId);
      
      // Extract comprehensive metadata
      const metadata = await this.buildMetadata(assetInfo, opts);

      // Cache the result
      if (opts.cacheResults) {
        this.cacheMetadata(photoId, metadata);
      }

      return {
        success: true,
        data: this.applyPrivacyOptions(metadata, opts)
      };

    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        success: false,
        error: {
          type: PhotoLibraryErrorType.PROCESSING_FAILED,
          message: error instanceof Error ? error.message : 'Failed to extract metadata'
        }
      };
    }
  }

  /**
   * Get detailed photo information including metadata
   */
  async getPhotoDetails(photoId: string): Promise<MetadataResult<PhotoMetadata>> {
    return this.extractMetadata(photoId, {
      includeLocation: true,
      includeExif: true,
      includeDeviceInfo: true,
      stripSensitiveData: false,
      cacheResults: true
    });
  }

  /**
   * Sanitize metadata by removing sensitive information
   */
  sanitizeMetadata(metadata: PhotoMetadata, options: PhotoMetadataOptions = {}): SanitizedMetadata {
    const sanitized: SanitizedMetadata = {
      // Basic file information (always safe)
      creationDate: metadata.creationDate,
      modificationDate: metadata.modificationDate,
      fileSize: metadata.fileSize,
      fileName: this.sanitizeFileName(metadata.fileName),
      fileFormat: metadata.fileFormat,
      width: metadata.width,
      height: metadata.height,
      
      // Flags indicating what was removed
      hasLocation: !!metadata.location,
      hasExif: !!metadata.exif,
      hasDeviceInfo: !!metadata.deviceInfo,
      
      // Optional safe metadata
      tags: metadata.tags,
      description: metadata.description
    };

    // Include orientation if available (generally safe)
    if (metadata.orientation !== undefined) {
      sanitized.orientation = metadata.orientation;
    }

    return sanitized;
  }

  /**
   * Process multiple photos in batch with progress tracking
   */
  async batchExtractMetadata(request: BatchMetadataRequest): Promise<BatchMetadataResult> {
    const { photoIds, options = {}, onProgress } = request;
    const successful: MetadataResult<PhotoMetadata>[] = [];
    const failed: { photoId: string; error: string }[] = [];

    for (let i = 0; i < photoIds.length; i++) {
      const photoId = photoIds[i];
      
      try {
        const result = await this.extractMetadata(photoId, options);
        successful.push(result);
        
        if (!result.success && result.error) {
          failed.push({
            photoId,
            error: result.error.message
          });
        }
      } catch (error) {
        failed.push({
          photoId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, photoIds.length);
      }
    }

    return {
      successful,
      failed,
      totalProcessed: photoIds.length
    };
  }

  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.metadataCache.clear();
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.metadataCache.size;
  }

  // Private helper methods

  private async buildMetadata(
    assetInfo: MediaLibrary.AssetInfo, 
    options: PhotoMetadataOptions
  ): Promise<PhotoMetadata> {
    const metadata: PhotoMetadata = {
      // Basic file information
      creationDate: assetInfo.creationTime,
      modificationDate: assetInfo.modificationTime,
      fileSize: assetInfo.duration || 0, // Note: MediaLibrary doesn't provide file size directly
      fileName: assetInfo.filename,
      fileFormat: this.getFileFormat(assetInfo.filename),
      width: assetInfo.width,
      height: assetInfo.height,
    };

    // Add file size from file system if possible
    try {
      const fileInfo = await FileSystem.getInfoAsync(assetInfo.uri, { size: true });
      if (fileInfo.exists && fileInfo.size) {
        metadata.fileSize = fileInfo.size;
      }
    } catch (error) {
      console.warn('Could not get file size:', error);
    }

    // Add EXIF data if requested
    if (options.includeExif) {
      metadata.exif = await this.extractExifData(assetInfo);
    }

    // Add location data if requested and available
    if (options.includeLocation && assetInfo.location) {
      metadata.location = {
        latitude: assetInfo.location.latitude,
        longitude: assetInfo.location.longitude,
        altitude: (assetInfo.location as any).altitude,
        timestamp: assetInfo.creationTime
      };
    }

    // Add device info if requested
    if (options.includeDeviceInfo) {
      metadata.deviceInfo = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
      };
    }

    // Add source application info
    metadata.sourceApplication = this.detectSourceApplication(assetInfo.filename, assetInfo.uri);

    return metadata;
  }

  private async extractExifData(assetInfo: MediaLibrary.AssetInfo): Promise<PhotoMetadata['exif']> {
    // Note: Expo MediaLibrary has limited EXIF support
    // For comprehensive EXIF data, you might need additional libraries
    try {
      // Basic EXIF data that we can extract or infer
      const exif: PhotoMetadata['exif'] = {
        pixelXDimension: assetInfo.width,
        pixelYDimension: assetInfo.height,
        dateTimeOriginal: new Date(assetInfo.creationTime).toISOString(),
        dateTime: new Date(assetInfo.creationTime).toISOString(),
      };

      // Try to extract additional EXIF data if available
      // This would require additional libraries like expo-image-picker with exif option
      // or react-native-exif for more comprehensive EXIF reading

      return exif;
    } catch (error) {
      console.warn('Could not extract EXIF data:', error);
      return undefined;
    }
  }

  private getFileFormat(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private detectSourceApplication(filename: string, uri: string): string {
    // Heuristics to detect source application based on filename patterns
    const name = filename.toLowerCase();
    
    if (name.includes('whatsapp') || name.includes('wa_')) {
      return 'WhatsApp';
    }
    if (name.includes('screenshot') || name.startsWith('screenshot')) {
      return 'Screenshot';
    }
    if (name.includes('img_') || name.includes('dsc_')) {
      return 'Camera';
    }
    if (name.includes('instagram') || name.includes('ig_')) {
      return 'Instagram';
    }
    if (name.includes('snapchat')) {
      return 'Snapchat';
    }
    if (name.includes('telegram')) {
      return 'Telegram';
    }
    
    return 'Unknown';
  }

  private sanitizeFileName(filename: string): string {
    // Remove potentially sensitive information from filename
    // Keep only the basic structure
    const parts = filename.split('.');
    const extension = parts.pop();
    const baseName = parts.join('.');
    
    // Remove timestamps, coordinates, or other sensitive patterns
    const sanitized = baseName.replace(/\d{4}-\d{2}-\d{2}/, 'YYYY-MM-DD')
                              .replace(/\d{2}:\d{2}:\d{2}/, 'HH:MM:SS')
                              .replace(/IMG_\d+/, 'IMG_XXXX')
                              .replace(/DSC\d+/, 'DSCXXXX');
    
    return `${sanitized}.${extension}`;
  }

  private getCachedMetadata(photoId: string): PhotoMetadata | null {
    const entry = this.metadataCache.get(photoId);
    if (!entry) return null;

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.metadataCache.delete(photoId);
      return null;
    }

    return entry.metadata;
  }

  private cacheMetadata(photoId: string, metadata: PhotoMetadata): void {
    // Implement LRU cache behavior
    if (this.metadataCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.metadataCache.keys().next().value;
      if (firstKey) {
        this.metadataCache.delete(firstKey);
      }
    }

    this.metadataCache.set(photoId, {
      metadata,
      timestamp: Date.now(),
      ttl: this.DEFAULT_CACHE_TTL
    });
  }

  private applyPrivacyOptions(metadata: PhotoMetadata, options: PhotoMetadataOptions): PhotoMetadata {
    if (options.stripSensitiveData) {
      const sanitized = this.sanitizeMetadata(metadata, options);
      // Convert back to PhotoMetadata format but without sensitive data
      return {
        ...metadata,
        location: undefined,
        exif: undefined,
        deviceInfo: undefined,
        fileName: sanitized.fileName
      };
    }

    const result = { ...metadata };

    if (!options.includeLocation) {
      delete result.location;
    }
    if (!options.includeExif) {
      delete result.exif;
    }
    if (!options.includeDeviceInfo) {
      delete result.deviceInfo;
    }

    return result;
  }
} 