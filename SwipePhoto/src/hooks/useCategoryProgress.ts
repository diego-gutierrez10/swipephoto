/**
 * useCategoryProgress.ts
 * 
 * Hook to provide category progress data for demonstration purposes.
 * In a real app, this would connect to Redux store and track actual progress.
 */

import { useState, useEffect } from 'react';
import type { CategoryProgress } from '../components/ui/CategoryProgressTracker';
import type { CategoryStatus } from '../components/ui/CategoryIndicator';
import type { Category } from '../types/models/Category';

// Sample categories for demonstration
const SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'Your favorite photos',
    color: '#FF6B6B',
    icon: 'heart',
    isDefault: true,
    sortOrder: 0,
    photoCount: 25,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Work-related photos',
    color: '#4ECDC4',
    icon: 'briefcase',
    isDefault: true,
    sortOrder: 1,
    photoCount: 40,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family photos and memories',
    color: '#45B7D1',
    icon: 'users',
    isDefault: true,
    sortOrder: 2,
    photoCount: 60,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Travel and vacation photos',
    color: '#96CEB4',
    icon: 'map-pin',
    isDefault: true,
    sortOrder: 3,
    photoCount: 35,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: 'archive',
    name: 'Archive',
    description: 'Archived photos',
    color: '#FFEAA7',
    icon: 'archive',
    isDefault: true,
    sortOrder: 4,
    photoCount: 80,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
];

export interface UseCategoryProgressReturn {
  categoryProgress: CategoryProgress[];
  updateCategoryProgress: (categoryId: string, completedCount: number) => void;
  totalPhotos: number;
  completedPhotos: number;
  overallPercentage: number;
}

export const useCategoryProgress = (): UseCategoryProgressReturn => {
  const [progressData, setProgressData] = useState<CategoryProgress[]>([]);

  // Initialize progress data
  useEffect(() => {
    const initialProgress: CategoryProgress[] = SAMPLE_CATEGORIES.map((category, index) => {
      // Simulate different completion states for demonstration
      let status: CategoryStatus;
      let completedCount: number;

      if (index === 0) {
        // First category is completed
        status = 'completed';
        completedCount = category.photoCount;
      } else if (index === 1) {
        // Second category is current with partial progress
        status = 'current';
        completedCount = Math.floor(category.photoCount * 0.6); // 60% complete
      } else {
        // Rest are upcoming
        status = 'upcoming';
        completedCount = 0;
      }

      return {
        category,
        status,
        completedCount,
        totalCount: category.photoCount,
      };
    });

    setProgressData(initialProgress);
  }, []);

  // Function to update category progress
  const updateCategoryProgress = (categoryId: string, completedCount: number) => {
    setProgressData(prevData =>
      prevData.map(item => {
        if (item.category.id === categoryId) {
          const newCompletedCount = Math.min(completedCount, item.totalCount);
          let newStatus: CategoryStatus;

          if (newCompletedCount === item.totalCount) {
            newStatus = 'completed';
          } else if (newCompletedCount > 0) {
            newStatus = 'current';
          } else {
            newStatus = 'upcoming';
          }

          return {
            ...item,
            completedCount: newCompletedCount,
            status: newStatus,
          };
        }
        return item;
      })
    );
  };

  // Calculate totals
  const totalPhotos = progressData.reduce((sum, item) => sum + item.totalCount, 0);
  const completedPhotos = progressData.reduce((sum, item) => sum + item.completedCount, 0);
  const overallPercentage = totalPhotos > 0 ? Math.round((completedPhotos / totalPhotos) * 100) : 0;

  return {
    categoryProgress: progressData,
    updateCategoryProgress,
    totalPhotos,
    completedPhotos,
    overallPercentage,
  };
}; 