/**
 * ImageProcessingService - Image manipulation and processing functionality
 * Uses expo-image-manipulator and expo-file-system for local image processing
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  ProcessingOptions,
  ProcessedImage,
  PhotoAsset,
  IImageProcessingService,
  PhotoLibraryError,
  PhotoLibraryException,
} from '../types/photo';

export class ImageProcessingService implements IImageProcessingService {
  private static instance: ImageProcessingService;

  /**
   * Get singleton instance
   */
  public static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  /**
   * Process/manipulate an image with various options
   */
  public async processImage(uri: string, options: ProcessingOptions = {}): Promise<ProcessedImage> {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        format = 'jpeg',
        includeBase64 = false,
        rotate = 0,
        flipHorizontal = false,
        flipVertical = false,
      } = options;

      // Build manipulation actions
      const actions: ImageManipulator.Action[] = [];

      // Add resize action if dimensions are specified
      if (maxWidth && maxHeight) {
        actions.push({
          resize: { width: maxWidth, height: maxHeight },
        });
      }

      // Add rotation if specified
      if (rotate !== 0) {
        actions.push({
          rotate: rotate,
        });
      }

      // Add flip actions if specified
      if (flipHorizontal) {
        actions.push({
          flip: ImageManipulator.FlipType.Horizontal,
        });
      }

      if (flipVertical) {
        actions.push({
          flip: ImageManipulator.FlipType.Vertical,
        });
      }

      // Configure output format
      const saveOptions: ImageManipulator.SaveOptions = {
        compress: quality,
        format: this.mapImageFormat(format),
        base64: includeBase64,
      };

      // Process the image
      const result = await ImageManipulator.manipulateAsync(uri, actions, saveOptions);

      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(result.uri, { size: true });

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        format: format,
        base64: result.base64,
      };
    } catch (error) {
      console.error('ImageProcessingService: Error processing image:', error);
      throw new PhotoLibraryException(
        PhotoLibraryError.PROCESSING_FAILED,
        'Failed to process image',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get base64 representation of image
   */
  public async getBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('ImageProcessingService: Error getting base64:', error);
      throw new PhotoLibraryException(
        PhotoLibraryError.PROCESSING_FAILED,
        'Failed to get base64 representation',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get image metadata
   */
  public async getImageInfo(uri: string): Promise<{ width: number; height: number; size: number; format: string }> {
    try {
      // Use ImageManipulator to get dimensions without processing
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 1, // No compression for info only
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });

      // Determine format from URI
      const format = this.getFormatFromUri(uri);

      return {
        width: result.width,
        height: result.height,
        size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        format: format,
      };
    } catch (error) {
      console.error('ImageProcessingService: Error getting image info:', error);
      throw new PhotoLibraryException(
        PhotoLibraryError.PROCESSING_FAILED,
        'Failed to get image information',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Resize image to fit within specified dimensions while maintaining aspect ratio
   */
  public async resizeImage(
    uri: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<ProcessedImage> {
    return this.processImage(uri, {
      maxWidth,
      maxHeight,
      quality,
      format: 'jpeg',
    });
  }

  /**
   * Compress image with specified quality
   */
  public async compressImage(uri: string, quality: number): Promise<ProcessedImage> {
    return this.processImage(uri, {
      quality,
      format: 'jpeg',
    });
  }

  /**
   * Process multiple images in parallel
   */
  public async processImages(
    assets: PhotoAsset[],
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    try {
      const results = await Promise.allSettled(
        assets.map(asset => this.processImage(asset.uri, options))
      );

      const processedImages: ProcessedImage[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processedImages.push({
            ...result.value,
            originalAsset: assets[index],
          });
        } else {
          errors.push(`Failed to process image ${index + 1}: ${result.reason.message}`);
        }
      });

      if (errors.length > 0) {
        console.warn('ImageProcessingService: Some images failed to process:', errors);
      }

      return processedImages;
    } catch (error) {
      console.error('ImageProcessingService: Error processing multiple images:', error);
      throw new PhotoLibraryException(
        PhotoLibraryError.PROCESSING_FAILED,
        'Failed to process multiple images',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create thumbnail from image
   */
  public async createThumbnail(
    uri: string,
    size: number = 200,
    quality: number = 0.7
  ): Promise<ProcessedImage> {
    return this.processImage(uri, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'jpeg',
    });
  }

  // Private helper methods

  /**
   * Map our format string to ImageManipulator format
   */
  private mapImageFormat(format: string): ImageManipulator.SaveFormat {
    switch (format.toLowerCase()) {
      case 'png':
        return ImageManipulator.SaveFormat.PNG;
      case 'webp':
        return ImageManipulator.SaveFormat.WEBP;
      case 'jpeg':
      case 'jpg':
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }

  /**
   * Determine image format from URI
   */
  private getFormatFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
      case 'jpg':
      case 'jpeg':
      default:
        return 'jpeg';
    }
  }

  /**
   * Validate image URI
   */
  public async validateImageUri(uri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch (error) {
      console.error('ImageProcessingService: Error validating URI:', error);
      return false;
    }
  }

  /**
   * Clean up temporary files
   */
  public async cleanupTempFiles(uris: string[]): Promise<void> {
    try {
      await Promise.all(
        uris
          .filter(uri => uri.includes('ImageManipulator') || uri.includes('temp'))
          .map(uri => FileSystem.deleteAsync(uri, { idempotent: true }))
      );
    } catch (error) {
      console.warn('ImageProcessingService: Error cleaning up temp files:', error);
    }
  }
}

// Export singleton instance for convenience
export default ImageProcessingService.getInstance(); 