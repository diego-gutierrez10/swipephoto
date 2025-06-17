export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  modifiedAt?: Date;
  photoCount: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface CategoryStats {
  totalCategories: number;
  defaultCategories: number;
  customCategories: number;
  mostUsedCategory: string | null;
  leastUsedCategory: string | null;
}

export type CategorySortOrder = 'name' | 'created' | 'modified' | 'photoCount' | 'custom';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'modifiedAt' | 'photoCount'>[] = [
  {
    name: 'Favorites',
    description: 'Your favorite photos',
    color: '#FF6B6B',
    icon: 'heart',
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: 'Work',
    description: 'Work-related photos',
    color: '#4ECDC4',
    icon: 'briefcase',
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: 'Family',
    description: 'Family photos and memories',
    color: '#45B7D1',
    icon: 'users',
    isDefault: true,
    sortOrder: 2,
  },
  {
    name: 'Travel',
    description: 'Travel and vacation photos',
    color: '#96CEB4',
    icon: 'map-pin',
    isDefault: true,
    sortOrder: 3,
  },
  {
    name: 'Archive',
    description: 'Archived photos',
    color: '#FFEAA7',
    icon: 'archive',
    isDefault: true,
    sortOrder: 4,
  },
]; 