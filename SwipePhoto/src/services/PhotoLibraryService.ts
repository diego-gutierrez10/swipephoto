/**
 * PhotoLibraryService - Core photo library access functionality
 * Uses expo-image-picker and expo-media-library for Expo Go compatibility
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import {
  PhotoPickerOptions,
  PhotoAsset,
  RecentPhotosOptions,
  PhotoLibraryResult,
  IPhotoLibraryService,
  PhotoLibraryError,
  PhotoLibraryException,
} from '../types/photo';

export class PhotoLibraryService implements IPhotoLibraryService {
  private static instance: PhotoLibraryService;

  /**
   * Get singleton instance
   */
  public static getInstance(): PhotoLibraryService {
    if (!PhotoLibraryService.instance) {
      PhotoLibraryService.instance = new PhotoLibraryService();
    }
    return PhotoLibraryService.instance;
  }

  /**
   * Open system photo picker
   */
  public async openPhotoPicker(options: PhotoPickerOptions = {}): Promise<PhotoLibraryResult<PhotoAsset[]>> {
    try {
      // Check if image picker is available
      const available = await this.isAvailable();
      if (!available) {
        throw new PhotoLibraryException(
          PhotoLibraryError.UNAVAILABLE,
          'Photo library is not available on this device'
        );
      }

      // Configure picker options
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: this.mapMediaType(options.mediaTypes || 'photo'),
        allowsMultipleSelection: options.allowsMultipleSelection || false,
        quality: options.quality || 0.8,
        allowsEditing: options.allowsEditing || false,
        aspect: options.aspect,
        exif: options.includeExif || false,
        base64: false, // We'll handle base64 separately if needed
      };

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      // Handle user cancellation
      if (result.canceled) {
        return {
          success: false,
          cancelled: true,
        };
      }

      // Convert picker result to our PhotoAsset format
      const assets: PhotoAsset[] = result.assets.map((asset, index) => ({
        id: this.generateAssetId(asset, index),
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName || `photo_${Date.now()}_${index}`,
        type: asset.type || 'image',
        duration: asset.duration || undefined,
        exif: asset.exif || undefined,
      }));

      return {
        success: true,
        data: assets,
      };
    } catch (error) {
      console.error('PhotoLibraryService: Error in openPhotoPicker:', error);

      if (error instanceof PhotoLibraryException) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Failed to open photo picker',
      };
    }
  }

  /**
   * Get recent photos from device library
   */
  public async getRecentPhotos(options: RecentPhotosOptions = {}): Promise<PhotoLibraryResult<PhotoAsset[]>> {
    try {
      // Check permissions first
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        throw new PhotoLibraryException(
          PhotoLibraryError.PERMISSION_DENIED,
          'Photo library permission not granted. Use PhotoPermissionsService to request permissions.'
        );
      }

      // Configure fetch options
      const fetchOptions: MediaLibrary.AssetsOptions = {
        first: options.limit || 20,
        mediaType: this.mapMediaLibraryMediaType(options.mediaType || 'photo'),
        sortBy: this.mapSortBy(options.sortBy || 'creationTime'),
      };

      // Fetch assets from media library
      const { assets } = await MediaLibrary.getAssetsAsync(fetchOptions);

      // Convert to our PhotoAsset format
      const photoAssets: PhotoAsset[] = assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.filename,
        creationTime: asset.creationTime,
        duration: asset.duration,
        type: asset.mediaType,
      }));

      return {
        success: true,
        data: photoAssets,
      };
    } catch (error) {
      console.error('PhotoLibraryService: Error in getRecentPhotos:', error);

      if (error instanceof PhotoLibraryException) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Failed to get recent photos',
      };
    }
  }

  /**
   * Get specific photo by ID
   */
  public async getPhotoById(id: string): Promise<PhotoLibraryResult<PhotoAsset>> {
    try {
      // Check permissions
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        throw new PhotoLibraryException(
          PhotoLibraryError.PERMISSION_DENIED,
          'Photo library permission not granted'
        );
      }

      // Get asset info
      const asset = await MediaLibrary.getAssetInfoAsync(id);

      const photoAsset: PhotoAsset = {
        id: asset.id,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.filename,
        creationTime: asset.creationTime,
        duration: asset.duration,
        type: asset.mediaType,
      };

      return {
        success: true,
        data: photoAsset,
      };
    } catch (error) {
      console.error(`PhotoLibraryService: Error getting photo with ID ${id}:`, error);

      return {
        success: false,
        error: `Failed to get photo with ID ${id}`,
      };
    }
  }

  /**
   * Get multiple photos by IDs
   */
  public async getPhotosByIds(ids: string[]): Promise<PhotoLibraryResult<PhotoAsset[]>> {
    try {
      const results = await Promise.allSettled(
        ids.map(id => this.getPhotoById(id))
      );

      const successfulAssets: PhotoAsset[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          successfulAssets.push(result.value.data);
        } else {
          errors.push(`Failed to get photo with ID ${ids[index]}`);
        }
      });

      return {
        success: errors.length === 0,
        data: successfulAssets,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      };
    } catch (error) {
      console.error('PhotoLibraryService: Error in getPhotosByIds:', error);

      return {
        success: false,
        error: 'Failed to get photos by IDs',
      };
    }
  }

  /**
   * Check if photo library access is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      // Check if ImagePicker is available (should always be true in Expo)
      return true;
    } catch (error) {
      console.error('PhotoLibraryService: Error checking availability:', error);
      return false;
    }
  }

  // Private helper methods

  /**
   * Generate a unique asset ID for image picker results
   */
  private generateAssetId(asset: ImagePicker.ImagePickerAsset, index: number): string {
    // Use assetId if available (iOS), otherwise generate one
    if (Platform.OS === 'ios' && asset.assetId) {
      return asset.assetId;
    }
    
    // Generate a unique ID based on URI and timestamp
    const timestamp = Date.now();
    return `picker_${timestamp}_${index}`;
  }

  /**
   * Map our media type to ImagePicker media type
   */
  private mapMediaType(mediaType: 'photo' | 'video' | 'all'): ImagePicker.MediaTypeOptions {
    switch (mediaType) {
      case 'photo':
        return ImagePicker.MediaTypeOptions.Images;
      case 'video':
        return ImagePicker.MediaTypeOptions.Videos;
      case 'all':
        return ImagePicker.MediaTypeOptions.All;
      default:
        return ImagePicker.MediaTypeOptions.Images;
    }
  }

  /**
   * Map our media type to MediaLibrary media type
   */
  private mapMediaLibraryMediaType(mediaType: 'photo' | 'video' | 'all'): ('photo' | 'video')[] {
    switch (mediaType) {
      case 'photo':
        return ['photo'];
      case 'video':
        return ['video'];
      case 'all':
        return ['photo', 'video'];
      default:
        return ['photo'];
    }
  }

  /**
   * Map our sort option to MediaLibrary sort option
   */
  private mapSortBy(sortBy: 'creationTime' | 'modificationTime' | 'mediaType'): (typeof MediaLibrary.SortBy)[keyof typeof MediaLibrary.SortBy][] {
    switch (sortBy) {
      case 'creationTime':
        return [MediaLibrary.SortBy.creationTime];
      case 'modificationTime':
        return [MediaLibrary.SortBy.modificationTime];
      case 'mediaType':
        return [MediaLibrary.SortBy.mediaType];
      default:
        return [MediaLibrary.SortBy.creationTime];
    }
  }
}

// Export singleton instance for convenience
export default PhotoLibraryService.getInstance(); 