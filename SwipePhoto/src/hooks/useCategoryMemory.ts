/**
 * useCategoryMemory.ts
 * 
 * React hook for category memory management and navigation state tracking.
 * Provides easy access to category progress and automatic navigation persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { 
  CategoryMemoryManager, 
  CategoryProgress, 
  NavigationStateUpdate,
  ICategoryMemoryManager 
} from '../services/CategoryMemoryManager';
import { SessionStorageService } from '../services/SessionStorageService';
import { NavigationHistoryEntry } from '../types/session';

/**
 * Category memory hook configuration
 */
export interface UseCategoryMemoryConfig {
  enableAutoNavigation?: boolean;
  enableAutoSave?: boolean;
  debounceDelay?: number;
  categoryId?: string;
}

/**
 * Category memory hook return type
 */
export interface UseCategoryMemoryReturn {
  // Category progress methods
  updateProgress: (progress: Partial<CategoryProgress>) => Promise<void>;
  getProgress: (categoryId?: string) => Promise<CategoryProgress | null>;
  resetProgress: (categoryId?: string) => Promise<void>;
  getAllProgress: () => Promise<Record<string, CategoryProgress>>;
  
  // Navigation methods
  getNavigationHistory: () => Promise<NavigationHistoryEntry[]>;
  clearNavigationHistory: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Stats
  stats: {
    cachedCategories: number;
    pendingWrites: number;
    lastFlushTime: number;
  };
  
  // Manual control
  flushPendingWrites: () => Promise<void>;
}

/**
 * Singleton instance management
 */
let categoryMemoryManagerInstance: ICategoryMemoryManager | null = null;

const getCategoryMemoryManager = (): ICategoryMemoryManager => {
  if (!categoryMemoryManagerInstance) {
    const sessionStorage = new SessionStorageService();
    categoryMemoryManagerInstance = new CategoryMemoryManager(sessionStorage);
  }
  return categoryMemoryManagerInstance;
};

/**
 * React hook for category memory management
 */
export const useCategoryMemory = (config: UseCategoryMemoryConfig = {}): UseCategoryMemoryReturn => {
  const {
    enableAutoNavigation = true,
    enableAutoSave = true,
    categoryId,
  } = config;

  const navigation = useNavigation();
  const route = useRoute();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    cachedCategories: 0,
    pendingWrites: 0,
    lastFlushTime: 0,
  });

  // Manager instance
  const managerRef = useRef<ICategoryMemoryManager>(getCategoryMemoryManager());
  const manager = managerRef.current;

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const newStats = manager.getCacheStats();
      setStats(newStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [manager]);

  // Auto-navigation tracking
  useFocusEffect(
    useCallback(() => {
      if (!enableAutoNavigation) return;

      const handleNavigationUpdate = async () => {
        try {
          const navigationUpdate: NavigationStateUpdate = {
            routeName: route.name,
            params: route.params,
          };

          await manager.updateNavigationState(navigationUpdate);
        } catch (err) {
          console.error('useCategoryMemory: Navigation tracking failed:', err);
          setError(err instanceof Error ? err.message : 'Navigation tracking failed');
        }
      };

      handleNavigationUpdate();
    }, [route.name, route.params, enableAutoNavigation, manager])
  );

  // Category progress methods
  const updateProgress = useCallback(async (progress: Partial<CategoryProgress>) => {
    if (!categoryId) {
      throw new Error('categoryId is required for updateProgress');
    }

    setIsLoading(true);
    setError(null);

    try {
      await manager.updateCategoryProgress(categoryId, progress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, manager]);

  const getProgress = useCallback(async (targetCategoryId?: string) => {
    const id = targetCategoryId || categoryId;
    if (!id) {
      throw new Error('categoryId is required for getProgress');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await manager.getCategoryProgress(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get progress';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, manager]);

  const resetProgress = useCallback(async (targetCategoryId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await manager.resetCategoryProgress(targetCategoryId || categoryId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset progress';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, manager]);

  const getAllProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await manager.getAllCategoryProgress();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get all progress';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  // Navigation methods
  const getNavigationHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await manager.getNavigationHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get navigation history';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  const clearNavigationHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await manager.clearNavigationHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear navigation history';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  // Manual control
  const flushPendingWrites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await manager.flushPendingWrites();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to flush pending writes';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  return {
    // Category progress methods
    updateProgress,
    getProgress,
    resetProgress,
    getAllProgress,
    
    // Navigation methods
    getNavigationHistory,
    clearNavigationHistory,
    
    // State
    isLoading,
    error,
    stats,
    
    // Manual control
    flushPendingWrites,
  };
};

/**
 * Hook specifically for category progress tracking
 */
export const useCategoryProgress = (categoryId: string) => {
  const { updateProgress, getProgress, resetProgress, isLoading, error } = useCategoryMemory({
    categoryId,
    enableAutoNavigation: false, // Disable auto navigation for this specific hook
  });

  const [currentProgress, setCurrentProgress] = useState<CategoryProgress | null>(null);

  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await getProgress();
        setCurrentProgress(progress);
      } catch (err) {
        console.error('useCategoryProgress: Failed to load initial progress:', err);
      }
    };

    loadProgress();
  }, [categoryId, getProgress]);

  // Update progress with local state sync
  const updateProgressWithSync = useCallback(async (progress: Partial<CategoryProgress>) => {
    await updateProgress(progress);
    
    // Update local state
    setCurrentProgress(prev => prev ? { ...prev, ...progress, lastAccessTime: Date.now() } : null);
  }, [updateProgress]);

  // Reset progress with local state sync
  const resetProgressWithSync = useCallback(async () => {
    await resetProgress();
    setCurrentProgress(null);
  }, [resetProgress]);

  return {
    currentProgress,
    updateProgress: updateProgressWithSync,
    resetProgress: resetProgressWithSync,
    isLoading,
    error,
  };
};

/**
 * Hook for navigation state tracking only
 */
export const useNavigationTracking = () => {
  const { getNavigationHistory, clearNavigationHistory, isLoading, error } = useCategoryMemory({
    enableAutoNavigation: true,
    enableAutoSave: true,
  });

  return {
    getNavigationHistory,
    clearNavigationHistory,
    isLoading,
    error,
  };
}; 