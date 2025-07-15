import { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAppSelector } from '../store';
import { SessionManager } from '../services/SessionManager';

export interface CategoryProgressData {
  completed: number;
  total: number;
  progress: number; // 0-1 (percentage as decimal)
}

export const useCategoryProgressData = (categoryId: string): CategoryProgressData => {
  const [progressData, setProgressData] = useState<CategoryProgressData>({
    completed: 0,
    total: 0,
    progress: 0,
  });

  // Get category info from Redux
  const category = useAppSelector((state) => 
    state.categories.categories.find(c => c.id === categoryId)
  );

  const loadProgressData = useCallback(async () => {
    try {
      const sessionManager = SessionManager.getInstance();
      const categoryProgress = await sessionManager.categoryMemoryManager.getCategoryProgress(categoryId);
      
      if (categoryProgress && category) {
        const completed = categoryProgress.completedPhotos || 0;
        const total = category.count || 0;
        const progress = total > 0 ? completed / total : 0;

        setProgressData({
          completed,
          total,
          progress: Math.min(1, Math.max(0, progress)), // Clamp between 0 and 1
        });

        // Log for debugging
        console.log('📊 useCategoryProgressData: Updated progress for', categoryId, {
          completed,
          total,
          progress: (progress * 100).toFixed(1) + '%'
        });
      } else if (category) {
        // No progress data available, use defaults
        setProgressData({
          completed: 0,
          total: category.count || 0,
          progress: 0,
        });
        
        console.log('📊 useCategoryProgressData: No progress found for', categoryId, 'using defaults');
      }
    } catch (error) {
      console.warn('useCategoryProgressData: Failed to load progress for category', categoryId, error);
      // Fallback to category count only
      if (category) {
        setProgressData({
          completed: 0,
          total: category.count || 0,
          progress: 0,
        });
      }
    }
  }, [categoryId, category]);

  // Load progress when component mounts or category changes
  useEffect(() => {
    if (categoryId && category) {
      loadProgressData();
    }
  }, [categoryId, category, loadProgressData]);

  // Reload progress when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      if (categoryId && category) {
        loadProgressData();
      }
    }, [categoryId, category, loadProgressData])
  );

  return progressData;
};

export default useCategoryProgressData; 