/**
 * PhotoCountingService - Fast photo counting without loading full photo data
 * Optimized for performance with large photo libraries
 */

import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { PhotoAsset } from '../types/photo';
import { MonthCategory, SourceCategory } from '../types/organization';
import { Dimensions } from 'react-native';

// Simplified source types for robust categorization
export type PhotoSourceType = 'cameraRoll' | 'screenshots' | 'otherApps';

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
  sourceType: 'source' | 'month';
  firstPhotoId?: string;
  lastPhotoId?: string;
}

export interface PhotoCountResult {
  success: boolean;
  data?: {
    monthCounts: CategoryCount[];
    sourceCounts: CategoryCount[];
    totalPhotos: number;
  };
  error?: string;
}

export interface CategoryPhotosResult {
  success: boolean;
  data?: {
    photos: PhotoAsset[];
    hasMore: boolean;
    endCursor?: string;
  };
  error?: string;
}

class PhotoCountingService {
  private static instance: PhotoCountingService;
  private currentlyPreloading: Set<string> = new Set();
  private photoCache: Map<string, MediaLibrary.Asset> = new Map();

  public static getInstance(): PhotoCountingService {
    if (!PhotoCountingService.instance) {
      PhotoCountingService.instance = new PhotoCountingService();
    }
    return PhotoCountingService.instance;
  }

  /**
   * Get fast category counts without loading full photo data
   */
  public async getCategoryCounts(): Promise<PhotoCountResult> {
    try {
      // Check permissions
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Photo library permission not granted');
      }

      // Get asset count first for total
      const { totalCount } = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: ['photo'],
      });

      // If we have too many photos, use chunked processing
      const useChunkedProcessing = totalCount > 5000;
      
      if (useChunkedProcessing) {
        return await this.getChunkedCategoryCounts(totalCount);
      } else {
        return await this.getDirectCategoryCounts(totalCount);
      }
    } catch (error) {
      console.error('PhotoCountingService: Error getting category counts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Direct counting for smaller photo libraries (< 5000 photos)
   */
  private async getDirectCategoryCounts(totalPhotos: number): Promise<PhotoCountResult> {
    // Get basic asset info only (id, filename, creationTime, albumId)
    const { assets } = await MediaLibrary.getAssetsAsync({
      first: totalPhotos,
      mediaType: ['photo'],
      sortBy: ['creationTime'],
    });

    const monthCounts = new Map<string, { count: number; firstId?: string; lastId?: string }>();
    const sourceCounts = new Map<string, { count: number; firstId?: string; lastId?: string }>();

    for (const asset of assets) {
      // Month categorization
      const monthKey = this.getMonthKey(asset.creationTime);
      const currentMonth = monthCounts.get(monthKey) || { count: 0 };
      monthCounts.set(monthKey, {
        count: currentMonth.count + 1,
        firstId: currentMonth.firstId || asset.id,
        lastId: asset.id,
      });

      // Source categorization (basic, based on filename and albumId)
      const sourceKey = this.getSourceCategoryName(asset);
      const currentSource = sourceCounts.get(sourceKey) || { count: 0 };
      sourceCounts.set(sourceKey, {
        count: currentSource.count + 1,
        firstId: currentSource.firstId || asset.id,
        lastId: asset.id,
      });
    }

    return {
      success: true,
      data: {
        monthCounts: this.convertMonthCountsToCategories(monthCounts),
        sourceCounts: this.convertSourceCountsToCategories(sourceCounts),
        totalPhotos,
      },
    };
  }

  /**
   * Chunked counting for large photo libraries (>= 5000 photos)
   */
  private async getChunkedCategoryCounts(totalPhotos: number): Promise<PhotoCountResult> {
    const chunkSize = 1000;
    const monthCounts = new Map<string, { count: number; firstId?: string; lastId?: string }>();
    const sourceCounts = new Map<string, { count: number; firstId?: string; lastId?: string }>();

    let processedCount = 0;
    let after: string | undefined = undefined;

    while (processedCount < totalPhotos) {
      const { assets, hasNextPage, endCursor } = await MediaLibrary.getAssetsAsync({
        first: Math.min(chunkSize, totalPhotos - processedCount),
        mediaType: ['photo'],
        sortBy: ['creationTime'],
        after,
      });

      for (const asset of assets) {
        // Month categorization
        const monthKey = this.getMonthKey(asset.creationTime);
        const currentMonth = monthCounts.get(monthKey) || { count: 0 };
        monthCounts.set(monthKey, {
          count: currentMonth.count + 1,
          firstId: currentMonth.firstId || asset.id,
          lastId: asset.id,
        });

        // Source categorization
        const sourceKey = this.getSourceCategoryName(asset);
        const currentSource = sourceCounts.get(sourceKey) || { count: 0 };
        sourceCounts.set(sourceKey, {
          count: currentSource.count + 1,
          firstId: currentSource.firstId || asset.id,
          lastId: asset.id,
        });
      }

      processedCount += assets.length;
      after = hasNextPage ? endCursor : undefined;

      if (!hasNextPage) break;
    }

    return {
      success: true,
      data: {
        monthCounts: this.convertMonthCountsToCategories(monthCounts),
        sourceCounts: this.convertSourceCountsToCategories(sourceCounts),
        totalPhotos,
      },
    };
  }

  /**
   * Get month key from creation time
   */
  private getMonthKey(creationTime?: number): string {
    if (!creationTime) {
      return 'undated';
    }

    const date = new Date(creationTime);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  /**
   * Get source key from asset info (basic categorization)
   */
  private getSourceCategoryName(photo: MediaLibrary.Asset): PhotoSourceType {
    // 1. Strongest signal: iOS media subtypes.
    // We check for 'screenshot' case-insensitively to handle variations like 'photoScreenshot'.
    if (photo.mediaSubtypes?.some(subtype => subtype.toLowerCase().includes('screenshot'))) {
      return 'screenshots';
    }

    const isPNG = photo.filename.toLowerCase().endsWith('.png');
    const screen = Dimensions.get('screen');
    const screenWidth = screen.width * screen.scale;
    const screenHeight = screen.height * screen.scale;

    // 2. Dimension check: A PNG file matching screen dimensions is almost certainly a screenshot.
    // Photos are typically JPG/HEIC.
    const isScreenDimensions =
      (photo.width === screenWidth && photo.height === screenHeight) ||
      (photo.height === screenWidth && photo.width === screenHeight);

    if (isPNG && isScreenDimensions) {
      return 'screenshots';
    }

    // 3. Filename check as a fallback (e.g., for Android or older iOS versions)
    if (photo.filename.toLowerCase().startsWith('screenshot')) {
      return 'screenshots';
    }

    // 4. Differentiate Camera Roll from Other Apps based on album and file type.
    // If it's a PNG in a camera album and wasn't caught above, it's likely a screenshot.
    const album = photo.albumId?.toLowerCase();
    const isCameraAlbum = !album || album.includes('recents') || album.includes('dcim') || album.includes('camera');
    
    if (isPNG && isCameraAlbum) {
      return 'screenshots';
    }

    if (isCameraAlbum) {
      return 'cameraRoll';
    }

    // If it has a specific album that isn't a known camera roll alias, it's from another app.
    return 'otherApps';
  }

  /**
   * Convert month counts map to CategoryCount array
   */
  private convertMonthCountsToCategories(monthCounts: Map<string, { count: number; firstId?: string; lastId?: string }>): CategoryCount[] {
    const categories: CategoryCount[] = [];

    for (const [monthKey, data] of monthCounts.entries()) {
      if (monthKey === 'undated') {
        categories.push({
          id: 'undated',
          name: 'Undated Photos',
          count: data.count,
          sourceType: 'month',
          firstPhotoId: data.firstId,
          lastPhotoId: data.lastId,
        });
      } else {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month));
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        categories.push({
          id: monthKey,
          name: monthName,
          count: data.count,
          sourceType: 'month',
          firstPhotoId: data.firstId,
          lastPhotoId: data.lastId,
        });
      }
    }

    return categories.sort((a, b) => {
      if (a.id === 'undated') return 1;
      if (b.id === 'undated') return -1;
      return b.id.localeCompare(a.id); // Most recent first
    });
  }

  /**
   * Convert source counts map to CategoryCount array
   */
  private convertSourceCountsToCategories(sourceCounts: Map<string, { count: number; firstId?: string; lastId?: string }>): CategoryCount[] {
    const sourceTypeMap: Record<string, { name: string; priority: number }> = {
      cameraRoll: { name: 'Camera Roll', priority: 1 },
      screenshots: { name: 'Screenshots', priority: 2 },
      otherApps: { name: 'Other Apps', priority: 3 },
    };

    const categories: CategoryCount[] = [];

    for (const [sourceKey, data] of sourceCounts.entries()) {
      const sourceInfo = sourceTypeMap[sourceKey] || { name: 'Unknown', priority: 99 };
      
      categories.push({
        id: sourceKey,
        name: sourceInfo.name,
        count: data.count,
        sourceType: 'source',
        firstPhotoId: data.firstId,
        lastPhotoId: data.lastId,
      });
    }

    return categories.sort((a, b) => {
      const aPriority = sourceTypeMap[a.id]?.priority || 99;
      const bPriority = sourceTypeMap[b.id]?.priority || 99;
      return aPriority - bPriority;
    });
  }

  /**
   * Load photos for a specific category on-demand
   */
  public async loadCategoryPhotos(
    categoryId: string,
    sourceType: 'source' | 'month',
    options: { limit?: number; after?: string } = {}
  ): Promise<CategoryPhotosResult> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Photo library permission not granted');
      }

      const { limit = 50, after } = options;
      console.log('📥 PhotoCountingService: loadCategoryPhotos called', {
        categoryId,
        sourceType,
        limit,
        after: after ? `${after.substring(0, 20)}...` : 'none'
      });
      let assets: MediaLibrary.Asset[] = [];
      let hasNextPage = false;
      let endCursor: string | undefined = undefined;

      // Improved logic for month-based categories
      if (sourceType === 'month' && /^\d{4}-\d{2}$/.test(categoryId)) {
        const [year, month] = categoryId.split('-').map(Number);
        // The 'month' from categoryId is 0-indexed (e.g., 0 for Jan, 11 for Dec)
        const startDate = new Date(year, month, 1);
        startDate.setHours(0, 0, 0, 0);

        // Get the last day of the given month
        const endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const result = await MediaLibrary.getAssetsAsync({
          first: limit,
          after,
          sortBy: ['creationTime'],
          mediaType: ['photo'],
          createdAfter: startDate,
          createdBefore: endDate,
        });
        assets = result.assets;
        hasNextPage = result.hasNextPage;
        endCursor = result.endCursor;
      } else {
        // Improved logic for source categories and non-standard month formats
        let allFilteredAssets: MediaLibrary.Asset[] = [];
        let currentAfter: string | undefined = undefined;
        let foundAll = false;
        let lastEndCursor: string | undefined = undefined;
        let startAfterTimestamp: number | undefined = undefined;

        // Parse custom cursor format (timestamp_id) for source categories
        if (after && after.includes('_')) {
          const [timestampStr] = after.split('_');
          startAfterTimestamp = parseInt(timestampStr);
          console.log('📍 PhotoCountingService: Starting from timestamp:', startAfterTimestamp);
        } else {
          // Use MediaLibrary cursor if provided
          currentAfter = after;
        }

        // Keep loading pages until we have enough filtered assets
        while (allFilteredAssets.length < limit && !foundAll) {
        const result = await MediaLibrary.getAssetsAsync({
            first: Math.min(1000, limit * 5), // Get multiple pages worth
          mediaType: ['photo'],
          sortBy: ['creationTime'],
            after: currentAfter,
        });

          const pageFilteredAssets: MediaLibrary.Asset[] = [];
        for (const asset of result.assets) {
          // Skip assets that are at or after our starting timestamp (for pagination)
          if (startAfterTimestamp && asset.creationTime && asset.creationTime >= startAfterTimestamp) {
            continue;
          }

          let matches = false;
          if (sourceType === 'month') {
            const monthKey = this.getMonthKey(asset.creationTime);
            matches = monthKey === categoryId;
          } else {
            const sourceKey = this.getSourceCategoryName(asset);
            matches = sourceKey === categoryId;
          }

          if (matches) {
              pageFilteredAssets.push(asset);
            }
          }

          allFilteredAssets.push(...pageFilteredAssets);
          lastEndCursor = result.endCursor;

          // If MediaLibrary has no more pages, we're done
          if (!result.hasNextPage) {
            foundAll = true;
            break;
          }

          currentAfter = result.endCursor;

          // If we didn't find any matching assets in this page, but there are more pages,
          // continue searching to avoid false negatives
          if (pageFilteredAssets.length === 0 && result.hasNextPage) {
            continue;
          }
        }

        // Take only the requested amount
        assets = allFilteredAssets.slice(0, limit);
        
        // Determine if there are more photos available
        hasNextPage = allFilteredAssets.length > limit || !foundAll;
        
        // For source categories, use the last asset's ID as cursor for better pagination
        if (hasNextPage && assets.length > 0) {
          // Use the creation time of the last asset as cursor for next pagination
          const lastAsset = assets[assets.length - 1];
          endCursor = `${lastAsset.creationTime}_${lastAsset.id}`;
          console.log('📍 PhotoCountingService: Created custom endCursor:', endCursor, 'for', assets.length, 'assets');
        } else {
          endCursor = undefined;
          console.log('📍 PhotoCountingService: No more pages, endCursor set to undefined');
        }
      }

      // Convert to PhotoAsset format
      const photoAssets: PhotoAsset[] = await Promise.all(
        assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
            const uri = assetInfo.localUri || assetInfo.uri;
            
            // Get file size using FileSystem
            let fileSize: number | undefined = undefined;
            try {
              console.log(`[PhotoCountingService] Attempting to get size for URI: ${uri}`);
              const fileInfo = await FileSystem.getInfoAsync(uri);
              console.log(`[PhotoCountingService] FileInfo result:`, fileInfo);
              if (fileInfo.exists && !fileInfo.isDirectory) {
                fileSize = fileInfo.size;
                console.log(`[PhotoCountingService] File size obtained: ${fileSize} bytes`);
              }
            } catch (sizeError) {
              console.warn(`Failed to get file size for ${asset.id}:`, sizeError);
            }
            
            const photoAsset = {
              id: asset.id,
              uri: uri,
              width: asset.width,
              height: asset.height,
              fileName: asset.filename,
              creationTime: asset.creationTime,
              duration: asset.duration,
              type: asset.mediaType,
              albumName: asset.albumId,
              fileSize: fileSize,
            };
            console.log(`[PhotoCountingService] Created PhotoAsset:`, photoAsset);
            return photoAsset;
          } catch (error) {
            console.warn(`Failed to get asset info for ${asset.id}:`, error);
            return {
              id: asset.id,
              uri: asset.uri,
              width: asset.width,
              height: asset.height,
              fileName: asset.filename,
              creationTime: asset.creationTime,
              duration: asset.duration,
              type: asset.mediaType,
              albumName: asset.albumId,
              fileSize: undefined,
            };
          }
        })
      );

      return {
        success: true,
        data: {
          photos: photoAssets,
          hasMore: hasNextPage,
          endCursor: hasNextPage ? endCursor : undefined,
        },
      };
    } catch (error) {
      console.error('PhotoCountingService: Error loading category photos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private getDisplayNameForSource(sourceType: PhotoSourceType): string {
    const names = {
      cameraRoll: 'Camera Roll',
      screenshots: 'Screenshots',
      otherApps: 'Other Apps',
    };
    return names[sourceType] || 'Other Apps';
  }
}

export default PhotoCountingService.getInstance(); 