export interface Photo {
  id: string;
  uri: string;
  filename: string;
  createdAt: number;
  modifiedAt?: number;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  categoryIds: string[];
  metadata?: {
    orientation?: number;
    cameraMake?: string;
    cameraModel?: string;
    iso?: number;
    focalLength?: number;
    aperture?: number;
    shutterSpeed?: string;
  };
  tags?: string[];
  isFavorite: boolean;
  isHidden: boolean;
}

export interface PhotoMetadata {
  totalCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  favoriteCount: number;
  totalSize: number;
}

export type PhotoSortOrder = 'newest' | 'oldest' | 'name' | 'size' | 'modified'; 