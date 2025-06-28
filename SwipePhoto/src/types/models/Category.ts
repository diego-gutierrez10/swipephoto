export interface Category {
  id: string;
  name: string;
  photoIds: string[];
  thumbnail: string | null;
  count: number;
  isCleaned?: boolean;
  sourceType?: 'month' | 'source';
} 