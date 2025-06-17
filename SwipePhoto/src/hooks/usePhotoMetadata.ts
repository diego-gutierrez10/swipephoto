import { useState, useCallback, useRef } from 'react';
import { PhotoMetadataService } from '../services/PhotoMetadataService';
import {
  PhotoMetadata,
  PhotoMetadataOptions,
  SanitizedMetadata,
  MetadataResult,
  BatchMetadataRequest,
  BatchMetadataResult,
  PhotoLibraryResult
} from '../types/photo';

interface UsePhotoMetadataState {
  loading: boolean;
  error: string | null;
  metadata: PhotoMetadata | null;
  sanitizedMetadata: SanitizedMetadata | null;
  batchResults: BatchMetadataResult | null;
}

interface UsePhotoMetadataReturn extends UsePhotoMetadataState {
  extractMetadata: (photoId: string, options?: PhotoMetadataOptions) => Promise<PhotoLibraryResult<PhotoMetadata>>;
  getPhotoDetails: (photoId: string) => Promise<PhotoLibraryResult<PhotoMetadata>>;
  sanitizeMetadata: (metadata: PhotoMetadata, options?: PhotoMetadataOptions) => SanitizedMetadata;
  batchExtractMetadata: (request: BatchMetadataRequest) => Promise<PhotoLibraryResult<BatchMetadataResult>>;
  clearResults: () => void;
  clearCache: () => void;
  getCacheSize: () => number;
}

export const usePhotoMetadata = (): UsePhotoMetadataReturn => {
  const [state, setState] = useState<UsePhotoMetadataState>({
    loading: false,
    error: null,
    metadata: null,
    sanitizedMetadata: null,
    batchResults: null
  });

  const metadataService = useRef(PhotoMetadataService.getInstance());

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const extractMetadata = useCallback(async (
    photoId: string, 
    options?: PhotoMetadataOptions
  ): Promise<PhotoLibraryResult<PhotoMetadata>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await metadataService.current.extractMetadata(photoId, options);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          metadata: result.data || null,
          loading: false
        }));
        
        return {
          success: true,
          data: result.data
        };
      } else {
        const errorMessage = result.error?.message || 'Failed to extract metadata';
        setError(errorMessage);
        setLoading(false);
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [setLoading, setError]);

  const getPhotoDetails = useCallback(async (
    photoId: string
  ): Promise<PhotoLibraryResult<PhotoMetadata>> => {
    return extractMetadata(photoId, {
      includeLocation: true,
      includeExif: true,
      includeDeviceInfo: true,
      stripSensitiveData: false,
      cacheResults: true
    });
  }, [extractMetadata]);

  const sanitizeMetadata = useCallback((
    metadata: PhotoMetadata, 
    options?: PhotoMetadataOptions
  ): SanitizedMetadata => {
    try {
      const sanitized = metadataService.current.sanitizeMetadata(metadata, options);
      
      setState(prev => ({
        ...prev,
        sanitizedMetadata: sanitized
      }));
      
      return sanitized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sanitize metadata';
      setError(errorMessage);
      
      // Return a minimal sanitized version
      return {
        creationDate: metadata.creationDate,
        modificationDate: metadata.modificationDate,
        fileSize: metadata.fileSize,
        fileName: 'sanitized_filename',
        fileFormat: metadata.fileFormat,
        width: metadata.width,
        height: metadata.height,
        hasLocation: false,
        hasExif: false,
        hasDeviceInfo: false
      };
    }
  }, [setError]);

  const batchExtractMetadata = useCallback(async (
    request: BatchMetadataRequest
  ): Promise<PhotoLibraryResult<BatchMetadataResult>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await metadataService.current.batchExtractMetadata(request);
      
      setState(prev => ({
        ...prev,
        batchResults: result,
        loading: false
      }));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch processing failed';
      setError(errorMessage);
      setLoading(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [setLoading, setError]);

  const clearResults = useCallback(() => {
    setState({
      loading: false,
      error: null,
      metadata: null,
      sanitizedMetadata: null,
      batchResults: null
    });
  }, []);

  const clearCache = useCallback(() => {
    metadataService.current.clearCache();
  }, []);

  const getCacheSize = useCallback((): number => {
    return metadataService.current.getCacheSize();
  }, []);

  return {
    ...state,
    extractMetadata,
    getPhotoDetails,
    sanitizeMetadata,
    batchExtractMetadata,
    clearResults,
    clearCache,
    getCacheSize
  };
}; 