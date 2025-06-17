/**
 * usePhotoLibrary - React hook for photo library access and processing
 * Provides a simple interface for components to interact with photo services
 */

import { useState, useCallback } from 'react';
import { PhotoLibraryService } from '../services/PhotoLibraryService';
import { ImageProcessingService } from '../services/ImageProcessingService';
import {
  PhotoPickerOptions,
  PhotoAsset,
  ProcessingOptions,
  ProcessedImage,
  RecentPhotosOptions,
  PhotoLibraryResult,
  PhotoLibraryError,
} from '../types/photo';

export interface UsePhotoLibraryResult {
  // State
  loading: boolean;
  error: string | null;
  lastResult: PhotoLibraryResult<any> | null;

  // Photo picker methods
  pickPhotos: (options?: PhotoPickerOptions) => Promise<PhotoAsset[] | null>;
  pickSinglePhoto: (options?: Omit<PhotoPickerOptions, 'allowsMultipleSelection'>) => Promise<PhotoAsset | null>;

  // Library access methods
  getRecentPhotos: (options?: RecentPhotosOptions) => Promise<PhotoAsset[] | null>;
  getPhotoById: (id: string) => Promise<PhotoAsset | null>;
  getPhotosByIds: (ids: string[]) => Promise<PhotoAsset[] | null>;

  // Image processing methods
  processImage: (uri: string, options?: ProcessingOptions) => Promise<ProcessedImage | null>;
  processImages: (assets: PhotoAsset[], options?: ProcessingOptions) => Promise<ProcessedImage[] | null>;
  createThumbnail: (uri: string, size?: number, quality?: number) => Promise<ProcessedImage | null>;
  getBase64: (uri: string) => Promise<string | null>;
  getImageInfo: (uri: string) => Promise<{ width: number; height: number; size: number; format: string } | null>;

  // Utility methods
  resizeImage: (uri: string, maxWidth: number, maxHeight: number, quality?: number) => Promise<ProcessedImage | null>;
  compressImage: (uri: string, quality: number) => Promise<ProcessedImage | null>;
  
  // Combined operations
  pickAndProcessPhotos: (
    pickerOptions?: PhotoPickerOptions,
    processingOptions?: ProcessingOptions
  ) => Promise<ProcessedImage[] | null>;

  // State management
  clearError: () => void;
  isAvailable: () => Promise<boolean>;
}

export function usePhotoLibrary(): UsePhotoLibraryResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PhotoLibraryResult<any> | null>(null);

  // Get service instances
  const photoService = PhotoLibraryService.getInstance();
  const imageProcessor = ImageProcessingService.getInstance();

  // Helper function to handle errors consistently
  const handleError = useCallback((err: unknown, defaultMessage: string): void => {
    console.error('usePhotoLibrary error:', err);
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(errorMessage);
  }, []);

  // Helper function to handle service results
  const handleServiceResult = useCallback(<T>(result: PhotoLibraryResult<T>): T | null => {
    setLastResult(result);
    if (!result.success) {
      setError(result.error || 'Operation failed');
      return null;
    }
    setError(null);
    return result.data || null;
  }, []);

  // Pick multiple photos
  const pickPhotos = useCallback(async (options?: PhotoPickerOptions): Promise<PhotoAsset[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await photoService.openPhotoPicker(options);
      return handleServiceResult(result);
    } catch (err) {
      handleError(err, 'Failed to pick photos');
      return null;
    } finally {
      setLoading(false);
    }
  }, [photoService, handleServiceResult, handleError]);

  // Pick single photo
  const pickSinglePhoto = useCallback(async (
    options?: Omit<PhotoPickerOptions, 'allowsMultipleSelection'>
  ): Promise<PhotoAsset | null> => {
    const result = await pickPhotos({ ...options, allowsMultipleSelection: false });
    return result && result.length > 0 ? result[0] : null;
  }, [pickPhotos]);

  // Get recent photos
  const getRecentPhotos = useCallback(async (options?: RecentPhotosOptions): Promise<PhotoAsset[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await photoService.getRecentPhotos(options);
      return handleServiceResult(result);
    } catch (err) {
      handleError(err, 'Failed to get recent photos');
      return null;
    } finally {
      setLoading(false);
    }
  }, [photoService, handleServiceResult, handleError]);

  // Get photo by ID
  const getPhotoById = useCallback(async (id: string): Promise<PhotoAsset | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await photoService.getPhotoById(id);
      return handleServiceResult(result);
    } catch (err) {
      handleError(err, 'Failed to get photo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [photoService, handleServiceResult, handleError]);

  // Get photos by IDs
  const getPhotosByIds = useCallback(async (ids: string[]): Promise<PhotoAsset[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await photoService.getPhotosByIds(ids);
      return handleServiceResult(result);
    } catch (err) {
      handleError(err, 'Failed to get photos');
      return null;
    } finally {
      setLoading(false);
    }
  }, [photoService, handleServiceResult, handleError]);

  // Process single image
  const processImage = useCallback(async (
    uri: string,
    options?: ProcessingOptions
  ): Promise<ProcessedImage | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageProcessor.processImage(uri, options);
      setError(null);
      return result;
    } catch (err) {
      handleError(err, 'Failed to process image');
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageProcessor, handleError]);

  // Process multiple images
  const processImages = useCallback(async (
    assets: PhotoAsset[],
    options?: ProcessingOptions
  ): Promise<ProcessedImage[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageProcessor.processImages(assets, options);
      setError(null);
      return result;
    } catch (err) {
      handleError(err, 'Failed to process images');
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageProcessor, handleError]);

  // Create thumbnail
  const createThumbnail = useCallback(async (
    uri: string,
    size: number = 200,
    quality: number = 0.7
  ): Promise<ProcessedImage | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageProcessor.createThumbnail(uri, size, quality);
      setError(null);
      return result;
    } catch (err) {
      handleError(err, 'Failed to create thumbnail');
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageProcessor, handleError]);

  // Get base64
  const getBase64 = useCallback(async (uri: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageProcessor.getBase64(uri);
      setError(null);
      return result;
    } catch (err) {
      handleError(err, 'Failed to get base64');
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageProcessor, handleError]);

  // Get image info
  const getImageInfo = useCallback(async (
    uri: string
  ): Promise<{ width: number; height: number; size: number; format: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageProcessor.getImageInfo(uri);
      setError(null);
      return result;
    } catch (err) {
      handleError(err, 'Failed to get image info');
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageProcessor, handleError]);

  // Resize image
  const resizeImage = useCallback(async (
    uri: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<ProcessedImage | null> => {
    return processImage(uri, { maxWidth, maxHeight, quality, format: 'jpeg' });
  }, [processImage]);

  // Compress image
  const compressImage = useCallback(async (
    uri: string,
    quality: number
  ): Promise<ProcessedImage | null> => {
    return processImage(uri, { quality, format: 'jpeg' });
  }, [processImage]);

  // Combined operation: pick and process photos
  const pickAndProcessPhotos = useCallback(async (
    pickerOptions?: PhotoPickerOptions,
    processingOptions?: ProcessingOptions
  ): Promise<ProcessedImage[] | null> => {
    const photos = await pickPhotos(pickerOptions);
    if (!photos || photos.length === 0) {
      return null;
    }

    return processImages(photos, processingOptions);
  }, [pickPhotos, processImages]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if photo library is available
  const isAvailable = useCallback(async (): Promise<boolean> => {
    try {
      return await photoService.isAvailable();
    } catch (err) {
      console.error('Error checking photo library availability:', err);
      return false;
    }
  }, [photoService]);

  return {
    // State
    loading,
    error,
    lastResult,

    // Photo picker methods
    pickPhotos,
    pickSinglePhoto,

    // Library access methods
    getRecentPhotos,
    getPhotoById,
    getPhotosByIds,

    // Image processing methods
    processImage,
    processImages,
    createThumbnail,
    getBase64,
    getImageInfo,

    // Utility methods
    resizeImage,
    compressImage,

    // Combined operations
    pickAndProcessPhotos,

    // State management
    clearError,
    isAvailable,
  };
} 