import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  SwipeGestureHandler,
  MainSwipeHeader,
  MainSwipeFooter,
} from '../components/swipe';
import { PhotoStack } from '../components/photo/PhotoStack';
import { useAppSelector, useAppDispatch } from '../store';
import { store } from '../store'; // Import the store instance directly
import { recordSwipeAction } from '../store/slices/undoSlice';
import {
  addToDeletionQueue,
  removeFromDeletionQueue,
  addToDeletionQueueForAllCategories,
  removeFromDeletionQueueForAllCategories,
} from '../store/slices/organizationSlice';
import { undoSwipeAction } from '../store/thunks/undoThunks';
import {
  selectLastUndoableAction,
  selectCanUndo,
} from '../store/selectors/undoSelectors';
import { makeSelectPhotosByCategory } from '../store/selectors/photoSelectors';
import type { SwipeDirection } from '../components/swipe/SwipeGestureHandler';
import { RootStackParamList } from '../types/navigation';
import { Photo } from '../types';
import PhotoPreloadingService from '../services/PhotoPreloadingService';
import { SessionManager } from '../services/SessionManager';
import { 
  setCategoryCleanedStatus, 
  loadCategoryPhotos, 
  loadMoreCategoryPhotos,
  selectCategoryHasMore,
  selectCategoryIsLoadingMore,
  resetCategoryPagination,
} from '../store/slices/categorySlice';
import { EmptyState } from '../components/common';
import { colors } from '../constants/theme';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { useSubscription } from '../contexts/SubscriptionContext';

type MainSwipeScreenRouteProp = RouteProp<RootStackParamList, 'MainSwipe'>;

export const MainSwipeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<MainSwipeScreenRouteProp>();
  const dispatch = useAppDispatch();
  const sessionManager = SessionManager.getInstance();
  const { subscriptionStatus } = useSubscription();

  const categoryId = route.params?.categoryId;

  const selectPhotosByCategory = useMemo(makeSelectPhotosByCategory, []);

  const { categories, loading, loadedCategories } = useAppSelector((state) => state.categories);
  const photoItems = useAppSelector((state) => {
    if (!categoryId) return [];
    return selectPhotosByCategory(state, categoryId);
  });
  const canUndo = useAppSelector(selectCanUndo);
  const { deletionQueue } = useAppSelector((state) => state.organization);
  const lastAction = useAppSelector(selectLastUndoableAction);
  const lastUndoneAction = useAppSelector(
    (state) => state.undo.lastUndoneAction
  );
  
  // NEW: Pagination selectors
  const categoryHasMore = useAppSelector((state) => categoryId ? selectCategoryHasMore(state, categoryId) : false);
  const categoryIsLoadingMore = useAppSelector((state) => categoryId ? selectCategoryIsLoadingMore(state, categoryId) : false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ kept: 0, deleted: 0 });
  const [isReady, setIsReady] = useState(false);
  const [progressRestored, setProgressRestored] = useState(false);
  const [storeConnected, setStoreConnected] = useState(false);
  const previousUndoId = useRef<string | null>(null);
  const paginationFixApplied = useRef<boolean>(false); // Track if pagination fix was applied
  const isLoadingMoreRef = useRef<boolean>(false); // NEW: Ref to prevent dispatch loops

  const category = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categoryId, categories]);

  // Connect Redux store to SessionManager for deletion queue persistence
  useEffect(() => {
    if (!storeConnected) {
      // Import the store instance to get the full Redux store
      sessionManager.setReduxStore(store);
      setStoreConnected(true);
      console.log('🔗 MainSwipeScreen: Redux store connected to SessionManager');
    }
  }, [sessionManager, store, storeConnected]);

  // First, restore progress from previous session
  useEffect(() => {
    const restoreProgress = async () => {
      if (category && !progressRestored && storeConnected) {
        console.log('🔄 MainSwipeScreen: Attempting to restore progress for category:', category.id);
        const progress = await sessionManager.categoryMemoryManager.getCategoryProgress(category.id);
        
        if (progress) {
          console.log('✅ MainSwipeScreen: Found saved progress:', {
            lastPhotoIndex: progress.lastPhotoIndex,
            keptCount: progress.keptCount,
            deletedCount: progress.deletedCount,
            totalCompleted: progress.completedPhotos
          });
          
          // Restore stats immediately
          setStats({
            kept: progress.keptCount || 0,
            deleted: progress.deletedCount || 0,
          });
          
          // Set index immediately if we have progress
          if (progress.lastPhotoIndex > 0) {
            setCurrentIndex(progress.lastPhotoIndex);
            console.log(`📍 MainSwipeScreen: Restored to photo index ${progress.lastPhotoIndex}`);
          }
        } else {
          console.log('ℹ️  MainSwipeScreen: No previous progress found for category:', category.id);
        }
        
        // Restore deletion queue from session
        sessionManager.restoreDeletionQueue();
        const queueInfo = sessionManager.getDeletionQueueInfo();
        console.log('🗂️  MainSwipeScreen: Deletion queue restored:', queueInfo);
        
        setProgressRestored(true);
      }
    };
    
    restoreProgress();
  }, [category, sessionManager, progressRestored, storeConnected]);

  // Then, check if category photos need to be loaded (only after progress is restored)
  useEffect(() => {
    if (categoryId && category && progressRestored && !loadedCategories.includes(categoryId) && photoItems.length === 0 && !loading) {
      console.log('📥 MainSwipeScreen: Loading photos for category:', categoryId);
      // Determine sourceType based on category
      const sourceType: 'source' | 'month' = category.sourceType === 'source' ? 'source' : 'month';
      dispatch(loadCategoryPhotos({ categoryId, sourceType }));
    }
  }, [categoryId, category, progressRestored, loadedCategories, photoItems.length, loading, dispatch]);

  // Finally, set ready state when photos are loaded
  useEffect(() => {
    if (progressRestored && ((photoItems.length > 0) || (category && loadedCategories.includes(category.id)))) {
      console.log('🎯 MainSwipeScreen: Setting ready state. Photos loaded:', photoItems.length);
      setIsReady(true);
    }
  }, [progressRestored, photoItems.length, category, loadedCategories]);

  // Validate and adjust currentIndex when photos are loaded to ensure it's within bounds
  // BUT do NOT interfere with completion detection
  useEffect(() => {
    if (progressRestored && photoItems.length > 0 && currentIndex > 0) {
      // Only adjust currentIndex if we're WAY beyond bounds AND there are no more photos to load
      // Give a buffer for completion detection to work
      if (currentIndex > photoItems.length + 1 && !categoryHasMore) {
        console.log(`⚠️  MainSwipeScreen: Adjusting currentIndex from ${currentIndex} to ${photoItems.length - 1} (no more photos available)`);
        setCurrentIndex(photoItems.length - 1);
      } else {
        console.log(`✅ MainSwipeScreen: CurrentIndex ${currentIndex} is valid for ${photoItems.length} photos (hasMore: ${categoryHasMore})`);
      }
    }
  }, [progressRestored, photoItems.length, currentIndex, categoryHasMore]);

  // NEW: Load more photos when approaching the end and more are available
  useEffect(() => {
    if (
      isReady && 
      categoryId && 
      category && 
      photoItems.length > 0 && 
      categoryHasMore && 
      !categoryIsLoadingMore &&
      !isLoadingMoreRef.current && // Check the ref to prevent loops
      currentIndex >= photoItems.length - 35 // Load more when 35 photos remain (even more aggressive)
    ) {
      console.log('📥 MainSwipeScreen: Loading more photos as user approaches end', {
        categoryId,
        currentIndex,
        totalPhotos: photoItems.length,
        remainingPhotos: photoItems.length - currentIndex,
        categoryHasMore,
        categoryIsLoadingMore
      });
      
      isLoadingMoreRef.current = true; // Set lock
      const sourceType: 'source' | 'month' = category.sourceType === 'source' ? 'source' : 'month';
      dispatch(loadMoreCategoryPhotos({ categoryId, sourceType }))
        .unwrap()
        .catch(err => console.warn('MainSwipeScreen: Failed to load more photos:', err))
        .finally(() => {
          isLoadingMoreRef.current = false; // Release lock
        });
    }
  }, [
    isReady,
    categoryId,
    category,
    currentIndex,
    photoItems.length,
    categoryHasMore,
    categoryIsLoadingMore,
    dispatch
  ]);

  // ADDITIONAL: Force load more photos immediately if currentIndex exceeds available photos
  useEffect(() => {
    if (
      isReady && 
      categoryId && 
      category && 
      currentIndex >= photoItems.length && 
      categoryHasMore && 
      !categoryIsLoadingMore &&
      !isLoadingMoreRef.current // Check the ref to prevent loops
    ) {
      console.log('🚨 MainSwipeScreen: IMMEDIATE load more photos - user exceeded available photos', {
        categoryId,
        currentIndex,
        totalPhotos: photoItems.length,
        categoryHasMore,
        categoryIsLoadingMore
      });
      
      isLoadingMoreRef.current = true; // Set lock
      const sourceType: 'source' | 'month' = category.sourceType === 'source' ? 'source' : 'month';
      dispatch(loadMoreCategoryPhotos({ categoryId, sourceType }))
        .unwrap()
        .catch(err => console.warn('MainSwipeScreen: Failed to load more photos immediately:', err))
        .finally(() => {
          isLoadingMoreRef.current = false; // Release lock
        });
    }
  }, [
    isReady,
    categoryId,
    category,
    currentIndex,
    photoItems.length,
    categoryHasMore,
    categoryIsLoadingMore,
    dispatch
  ]);

  // CRITICAL FIX: Force load more photos when user reaches exactly the end
  useEffect(() => {
    // Add debugging to understand why this doesn't trigger
    console.log('🔍 CRITICAL Effect Debug:', {
      isReady,
      categoryId,
      category: !!category,
      currentIndex,
      photoItemsLength: photoItems.length,
      indexEqualsLength: currentIndex === photoItems.length,
      photoItemsLengthGreaterThanZero: photoItems.length > 0,
      categoryHasMore,
      categoryIsLoadingMore,
      isLoadingMoreRefCurrent: isLoadingMoreRef.current
    });

    if (
      isReady && 
      categoryId && 
      category && 
      currentIndex === photoItems.length && // Exactly at the end
      photoItems.length > 0 && 
      categoryHasMore && 
      !isLoadingMoreRef.current
    ) {
      console.log('🚨 MainSwipeScreen: CRITICAL - User reached end, forcing photo load', {
        categoryId,
        currentIndex,
        totalPhotos: photoItems.length,
        categoryHasMore,
        categoryIsLoadingMore,
        message: 'Bypassing stuck loading state'
      });
      
      isLoadingMoreRef.current = true;
      const sourceType: 'source' | 'month' = categoryId.includes('-') ? 'month' : 'source';
      
      dispatch(loadMoreCategoryPhotos({ 
        categoryId, 
        sourceType,
        forceLoad: true // CRITICAL: Force load even if already loading
      }))
        .unwrap()
        .then(() => {
          console.log('✅ MainSwipeScreen: CRITICAL photo load succeeded!', {
            categoryId,
            newPhotoCount: photoItems.length
          });
        })
        .catch((error) => {
          console.error('❌ MainSwipeScreen: CRITICAL photo load failed:', error);
        })
        .finally(() => {
          isLoadingMoreRef.current = false;
        });
    }
  }, [isReady, categoryId, category, currentIndex, photoItems.length, categoryHasMore, dispatch]);

  // Save deletion queue when component unmounts or category changes
  useEffect(() => {
    return () => {
      if (storeConnected) {
        console.log('🧹 MainSwipeScreen: Component unmounting, saving deletion queue...');
        sessionManager.saveDeletionQueue().catch(error => {
          console.error('❌ MainSwipeScreen: Failed to save deletion queue on unmount:', error);
        });
      }
    };
  }, [sessionManager, storeConnected]);

  // Clean up PhotoPreloadingService when component unmounts or category changes
  useEffect(() => {
    return () => PhotoPreloadingService.clearQueue();
  }, [category]);

  // Save session when component unmounts
  useEffect(() => {
    return () => {
      sessionManager.saveSession();
    };
  }, [sessionManager]);

  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      if (!isReady) return;
      
      // STRONGER GUARD: Do not process swipe if there's no photo at the current index.
      // This prevents trying to swipe on a card that is still loading.
      if (currentIndex >= photoItems.length) {
        console.log('🚫 MainSwipeScreen: Swipe ignored, index out of bounds.', { currentIndex, totalPhotos: photoItems.length });
        return;
      }
      
      const { count, limit } = sessionManager.getDailyUsage();
      // Only show upgrade screen if the limit is reached AND the user is not subscribed
      if (count >= limit && !subscriptionStatus.isSubscribed) {
        navigation.navigate('Upgrade', { limitReached: true });
        return;
      }

      sessionManager.incrementPhotoCount();

      const currentPhoto = photoItems[currentIndex];
      const nextIndex = currentIndex + 1;

      console.log('👆 MainSwipeScreen: Swipe completed', {
        direction,
        photoId: currentPhoto?.id || 'no-photo',
        currentIndex,
        nextIndex,
        categoryId: categoryId,
        totalPhotos: photoItems.length,
        categoryHasMore,
        loadedPhotos: photoItems.length
      });

      if (currentPhoto) {
        dispatch(
          recordSwipeAction({
            photoId: currentPhoto.id,
            direction,
            categoryId: categoryId || '',
            previousIndex: currentIndex,
          })
        );

        if (direction === 'left') {
          dispatch(addToDeletionQueue({ photoId: currentPhoto.id, categoryId: categoryId || '' }));
          console.log('🗑️  DELETION QUEUE: Added photo to deletion queue', {
            photoId: currentPhoto.id,
            categoryId: categoryId || '',
            currentQueueLength: (deletionQueue[categoryId || '']?.length || 0) + 1
          });
        }
      }

      setCurrentIndex(nextIndex);
      setStats((prevStats) => {
        const newStats = {
          kept: prevStats.kept + (direction === 'right' ? 1 : 0),
          deleted: prevStats.deleted + (direction === 'left' ? 1 : 0),
        };
        
        console.log('📊 MainSwipeScreen: Updated stats:', newStats);
        
        // Save progress to category memory
        if (category) {
          sessionManager.categoryMemoryManager.updateCategoryProgress(
            category.id,
            {
              lastPhotoId: currentPhoto?.id || `index-${currentIndex}`,
              lastPhotoIndex: nextIndex,
              completedPhotos: newStats.kept + newStats.deleted,
              keptCount: newStats.kept,
              deletedCount: newStats.deleted,
            }
          );
        }
        
        return newStats;
      });

      // Track swipe for adaptive preloading
      PhotoPreloadingService.trackSwipe();

      // Save deletion queue after each swipe to ensure persistence
      if (storeConnected) {
        setTimeout(() => {
          sessionManager.saveDeletionQueue().then(() => {
            const queueInfo = sessionManager.getDeletionQueueInfo();
            console.log('💾 MainSwipeScreen: Deletion queue saved after swipe:', queueInfo);
            console.log('🔍 QUEUE DEBUG: Current deletion queue state:', {
              categoryId: categoryId || '',
              queueLength: deletionQueue[categoryId || '']?.length || 0,
              queueIds: deletionQueue[categoryId || ''] || []
            });
          }).catch(error => {
            console.error('❌ MainSwipeScreen: Failed to save deletion queue:', error);
          });
        }, 100); // Small delay to ensure Redux state is updated
      }
    },
    [
      isReady,
      currentIndex,
      photoItems,
      sessionManager,
      navigation,
      dispatch,
      categoryId,
      category,
      stats,
      storeConnected,
      subscriptionStatus.isSubscribed,
      categoryHasMore,
    ]
  );

  const handleUndo = () => {
    if (canUndo && lastAction) {
      const photoToRestore = photoItems.find(
        (p) => p.id === lastAction.photoId
      );
      if (photoToRestore?.uri) {
        PhotoPreloadingService.updatePreloadQueue([photoToRestore], 0);
      }
      dispatch(undoSwipeAction({}));
    }
  };

  // Update preloading queue when ready and respect current progress
  useEffect(() => {
    if (isReady && photoItems.length > 0) {
      const currentWindow = PhotoPreloadingService.getCurrentPreloadWindow();
      console.log(`🔄 MainSwipeScreen: Updating preload queue from index ${currentIndex} for ${photoItems.length} photos (window: ${currentWindow})`);
      PhotoPreloadingService.updatePreloadQueue(photoItems, currentIndex);
    }
  }, [isReady, currentIndex, photoItems]);

  // Add global debugging functions (only in dev mode)
  useEffect(() => {
    if (__DEV__) {
      // @ts-ignore - Global debugging functions for development
      global.swipePhotoDebug = {
        setPreloadWindow: (size: number) => PhotoPreloadingService.setPreloadWindow(size),
        getCurrentWindow: () => PhotoPreloadingService.getCurrentPreloadWindow(),
        resetPreloading: () => PhotoPreloadingService.clearQueue(),
      };
      console.log('🛠️  SwipePhoto Debug Functions Available:');
      console.log('   swipePhotoDebug.setPreloadWindow(50) - Set preload to 50 photos');
      console.log('   swipePhotoDebug.getCurrentWindow() - Get current preload window');
      console.log('   swipePhotoDebug.resetPreloading() - Clear preload queue');
    }
  }, []);

  // Handle undo logic with proper state restoration
  useEffect(() => {
    if (lastUndoneAction && lastUndoneAction.id !== previousUndoId.current) {
      console.log('↩️  MainSwipeScreen: Processing undo action:', lastUndoneAction.id);
      previousUndoId.current = lastUndoneAction.id;
      const originalIndex = lastUndoneAction.previousState.photoIndex;
      if (originalIndex !== undefined && originalIndex !== currentIndex) {
        console.log(`📍 MainSwipeScreen: Restoring index to ${originalIndex} after undo`);
        setCurrentIndex(originalIndex);
      }
      if (lastUndoneAction.direction === 'left') {
        dispatch(removeFromDeletionQueue({ photoId: lastUndoneAction.photoId, categoryId: categoryId || '' }));
      }
      setStats((prevStats) => {
        const wasKept = lastUndoneAction.direction === 'right';
        const wasDeleted = lastUndoneAction.direction === 'left';
        const newStats = {
          kept: Math.max(0, prevStats.kept - (wasKept ? 1 : 0)),
          deleted: Math.max(0, prevStats.deleted - (wasDeleted ? 1 : 0)),
        };
        console.log('📊 MainSwipeScreen: Stats after undo:', newStats);
        if (category) {
          sessionManager.categoryMemoryManager.updateCategoryProgress(
            category.id,
            {
              lastPhotoId: lastUndoneAction.photoId,
              lastPhotoIndex: originalIndex,
              completedPhotos: newStats.kept + newStats.deleted,
              keptCount: newStats.kept,
              deletedCount: newStats.deleted,
            }
          );
        }
        return newStats;
      });
      
      // Save deletion queue after undo as well
      if (storeConnected) {
        setTimeout(() => {
          sessionManager.saveDeletionQueue();
        }, 100);
      }
    }
  }, [lastUndoneAction, category, currentIndex, dispatch, sessionManager, storeConnected]);

  // Handle category completion - ENHANCED DEBUG VERSION WITH PRIORITY
  useEffect(() => {
    // Enhanced debugging to understand why DeletionReview doesn't appear
    console.log('🔍 COMPLETION DEBUG: Checking completion conditions...', {
      isReady,
      currentIndex,
      photoItemsLength: photoItems.length,
      indexGreaterOrEqualToLength: currentIndex >= photoItems.length,
      photoItemsLengthGreaterThanZero: photoItems.length > 0,
      categoryHasMore,
      categoryIsLoadingMore,
      categoryId,
      deletionQueueLength: deletionQueue[categoryId]?.length || 0,
      deletionQueueExists: !!deletionQueue[categoryId],
      allConditionsMet: isReady && 
        currentIndex >= photoItems.length && 
        photoItems.length > 0 && 
        !categoryHasMore && 
        !categoryIsLoadingMore
    });

    // IMMEDIATE execution for completion detection - no delay
    if (
      isReady && 
      currentIndex >= photoItems.length && // Use >= to catch the state where we are at the end
      photoItems.length > 0 && 
      !categoryHasMore && // Only complete if there are no more photos to load
      !categoryIsLoadingMore // And we're not currently loading more
    ) {
      console.log('🎉 MainSwipeScreen: Category truly completed!', {
        categoryId: category?.id,
        categoryName: category?.name,
        totalPhotos: photoItems.length,
        finalStats: stats,
        deletionQueueLength: deletionQueue[categoryId]?.length,
        categoryHasMore,
        categoryIsLoadingMore,
        currentIndex
      });
      
      if (category) {
        dispatch(
          setCategoryCleanedStatus({
            categoryId: category.id,
            isCleaned: true,
          })
        );
      }
      
      console.log('🚀 NAVIGATION DEBUG: About to check deletion queue...', {
        deletionQueueLength: deletionQueue[categoryId]?.length || 0,
        hasPhotosToDelete: (deletionQueue[categoryId]?.length || 0) > 0
      });
      
      if (deletionQueue[categoryId]?.length > 0) {
        console.log('🔄 NAVIGATION: Navigating to DeletionReview screen with categoryId:', categoryId);
        navigation.replace('DeletionReview', { categoryId });
      } else {
        console.log('📝 NAVIGATION: No photos to delete, showing completion alert');
        Alert.alert(
          'Congratulations!',
          `You've organized all ${photoItems.length} photos in "${category?.name}"!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  }, [
    currentIndex,
    isReady,
    photoItems.length,
    deletionQueue,
    navigation,
    category,
    dispatch,
    stats,
    categoryHasMore,
    categoryIsLoadingMore,
  ]);

  // REMOVED: Temporary fix that caused infinite loop

  // IMPROVED TEMPORARY FIX: Detect and reset incorrect pagination state (with loop protection)
  useEffect(() => {
    if (
      isReady && 
      category && 
      categoryId &&
      currentIndex >= 45 && // Near the problematic area
      currentIndex < photoItems.length && // We have photos loaded
      !categoryHasMore && // But system thinks there are no more
      !categoryIsLoadingMore && // And we're not loading
      category.count > photoItems.length && // But total count shows there are more photos
      !paginationFixApplied.current // And we haven't applied the fix yet
    ) {
      console.log('🔧 IMPROVED TEMPORARY FIX: Detected incorrect pagination state, resetting...', {
        categoryId,
        currentIndex,
        photoItemsLength: photoItems.length,
        categoryCount: category.count,
        categoryHasMore
      });
      
      // Reset pagination state to allow loading more photos
      dispatch(resetCategoryPagination({ categoryId }));
      paginationFixApplied.current = true; // Mark as applied to prevent loops
      
      // Reset the flag after a delay to allow future fixes if needed
      setTimeout(() => {
        paginationFixApplied.current = false;
      }, 5000); // 5 second cooldown
    }
  }, [
    isReady,
    category,
    categoryId,
    currentIndex,
    photoItems.length,
    categoryHasMore,
    categoryIsLoadingMore,
    dispatch
  ]);

  const renderEmptyState = () => (
    <EmptyState
      title={category?.name ? `No more photos in "${category.name}"` : 'No photos'}
      description="Looks like you've organized everything here. Great job!"
      lottieSource={require('../assets/animations/success.json')}
      lottieColor="#FFFFFF"
      onButtonPress={() => navigation.goBack()}
      buttonText="Go Back to Categories"
    />
  );
  
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.loadingText}>Loading Photos...</Text>
    </View>
  );

  const renderContent = () => (
    <>
      <MainSwipeHeader
        sessionTitle={category?.name || 'Photos'}
        currentPhoto={Math.min(currentIndex + 1, category?.count || photoItems.length)}
        totalPhotos={category?.count || photoItems.length} // NEW: Use total count from category, not just loaded photos
        onBackPress={() => navigation.goBack()}
        showSettingsButton={false}
      />
      <View style={styles.stackContainer}>
        <SwipeGestureHandler
          onSwipeComplete={handleSwipeComplete}
          translateX={translateX}
        >
          <PhotoStack
            photos={photoItems}
            currentIndex={currentIndex}
            translateX={translateX}
            onCardTap={handleUndo}
            isLoadingMore={categoryIsLoadingMore}
          />
        </SwipeGestureHandler>
      </View>
      <MainSwipeFooter
        keepCount={stats.kept}
        deleteCount={stats.deleted}
        onUndo={handleUndo}
        currentPhoto={photoItems[currentIndex]}
        isLoadingMore={categoryIsLoadingMore} // NEW: Show loading indicator when loading more photos
      />
    </>
  );

  const translateX = useSharedValue(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {loading && photoItems.length === 0 ? renderLoading() : null}
      {!loading && isReady && photoItems.length === 0 ? renderEmptyState() : null}
      {!loading && isReady && photoItems.length > 0 ? renderContent() : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
    fontSize: 16,
  },
});

export default MainSwipeScreen; 