import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MainSwipeCard } from '../components/swipe';
import { PhotoCounter } from '../components/ui/PhotoCounter';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAppSelector, useAppDispatch } from '../store';
import { recordSwipeAction } from '../store/slices/undoSlice';
import { addToDeletionQueue, removeFromDeletionQueue } from '../store/slices/organizationSlice';
import { undoSwipeAction } from '../store/thunks/undoThunks';
import { selectLastUndoableAction, selectCanUndo, selectUndoCount } from '../store/selectors/undoSelectors';
import { makeSelectPhotosByCategory } from '../store/selectors/photoSelectors';
import type { SwipeDirection } from '../components/swipe/SwipeGestureHandler';
import { RootStackParamList } from '../types/navigation';
import { Photo, Category } from '../types';
import PhotoPreloadingService from '../services/PhotoPreloadingService';
import { SessionManager } from '../services/SessionManager';
import { setCategoryCleanedStatus } from '../store/slices/categorySlice';
import { EmptyState } from '../components/common';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type MainSwipeScreenRouteProp = RouteProp<RootStackParamList, 'MainSwipe'>;

export const MainSwipeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<MainSwipeScreenRouteProp>();
  const dispatch = useAppDispatch();
  const sessionManager = SessionManager.getInstance();

  const categoryId = route.params?.categoryId;

  if (!categoryId) {
    return (
      <EmptyState
        title="Navigation Error"
        description="Something went wrong while trying to load this category. Please go back and try again."
        lottieSource={require('../assets/animations/onboarding.json')}
        buttonText="Go Back"
        onButtonPress={() => navigation.goBack()}
      />
    );
  }

  const selectPhotosByCategory = useMemo(makeSelectPhotosByCategory, []);

  const { categories } = useAppSelector((state) => state.categories);
  const photoItems = useAppSelector((state) => selectPhotosByCategory(state, categoryId));

  const canUndo = useAppSelector(selectCanUndo);
  const undoCount = useAppSelector(selectUndoCount);
  const { deletionQueue } = useAppSelector((state) => state.organization);
  const lastAction = useAppSelector(selectLastUndoableAction);
  const lastUndoneAction = useAppSelector(state => state.undo.lastUndoneAction);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ kept: 0, deleted: 0 });
  const [isReady, setIsReady] = useState(false);
  const [previousUndoCount, setPreviousUndoCount] = useState(undoCount);
  const previousUndoId = React.useRef<string | null>(null);
  
  const category = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categoryId, categories]);


  useEffect(() => {
    setStats({ kept: 0, deleted: 0 });
    const restoreProgress = async () => {
      if (category && photoItems.length > 0) {
        const progress = await sessionManager.categoryMemoryManager.getCategoryProgress(category.id);
        if (progress) {
          if (progress.lastPhotoIndex > 0 && progress.lastPhotoIndex < photoItems.length) {
            console.log(`Restoring progress for category ${category.id} to index ${progress.lastPhotoIndex}`);
            setCurrentIndex(progress.lastPhotoIndex);
          }
          setStats({
            kept: progress.keptCount || 0,
            deleted: progress.deletedCount || 0,
          });
        }
        setIsReady(true);
      } else if (category) {
        setIsReady(true);
      }
    };
    restoreProgress();

    // Cleanup queue on unmount
    return () => {
      PhotoPreloadingService.clearQueue();
    };
  }, [category, photoItems, sessionManager]);

  // Preloading logic
  useEffect(() => {
    if (isReady && photoItems.length > 0) {
      PhotoPreloadingService.updatePreloadQueue(photoItems, currentIndex);
    }
  }, [isReady, currentIndex, photoItems]);


  useEffect(() => {
    if (lastUndoneAction && lastUndoneAction.id !== previousUndoId.current) {
      previousUndoId.current = lastUndoneAction.id;

      const originalIndex = lastUndoneAction.previousState.photoIndex;
      if (originalIndex !== undefined && originalIndex !== currentIndex) {
        setCurrentIndex(originalIndex);
      }

      if (lastUndoneAction.direction === 'left') {
        dispatch(removeFromDeletionQueue(lastUndoneAction.photoId));
      }

      setStats(prevStats => {
        const wasKept = lastUndoneAction.direction === 'right';
        const wasDeleted = lastUndoneAction.direction === 'left';
        
        const newStats = {
          kept: prevStats.kept - (wasKept ? 1 : 0),
          deleted: prevStats.deleted - (wasDeleted ? 1 : 0),
        };

        newStats.kept = Math.max(0, newStats.kept);
        newStats.deleted = Math.max(0, newStats.deleted);

        if (category) {
          sessionManager.categoryMemoryManager.updateCategoryProgress(category.id, {
            lastPhotoId: lastUndoneAction.photoId,
            lastPhotoIndex: originalIndex,
            completedPhotos: newStats.kept + newStats.deleted,
            keptCount: newStats.kept,
            deletedCount: newStats.deleted,
          });
        }
        
        return newStats;
      });
    }
  }, [lastUndoneAction, category, currentIndex, dispatch, sessionManager]);

  useEffect(() => {
    if (isReady && currentIndex >= photoItems.length && photoItems.length > 0) {
      if (category) {
        dispatch(setCategoryCleanedStatus({ categoryId: category.id, isCleaned: true }));
      }

      if (deletionQueue.length > 0) {
        navigation.replace('DeletionReview');
      } else {
        Alert.alert(
          'Congratulations!',
          `You've organized all ${photoItems.length} photos in "${category?.name}"!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  }, [currentIndex, isReady, photoItems.length, deletionQueue.length, navigation, category, dispatch]);


  const handleSwipeComplete = useCallback(
    async (direction: SwipeDirection) => {
      if (!isReady || currentIndex >= photoItems.length) return;
      
      const { count, limit } = sessionManager.getDailyUsage();
      if (count >= limit) {
        navigation.navigate('Upgrade', { limitReached: true });
        return;
      }

      await sessionManager.incrementPhotoCount();

      const currentPhoto = photoItems[currentIndex];
      const nextIndex = currentIndex + 1;

      dispatch(
        recordSwipeAction({
          photoId: currentPhoto.id,
          direction,
          previousIndex: currentIndex,
          categoryId: categoryId,
        })
      );
      
      if (direction === 'left') {
        dispatch(addToDeletionQueue(currentPhoto.id));
      }
      
      const newStats = {
        kept: stats.kept + (direction === 'right' ? 1 : 0),
        deleted: stats.deleted + (direction === 'left' ? 1 : 0),
      };
      setStats(newStats);
      setCurrentIndex(nextIndex);

      if (category) {
        await sessionManager.categoryMemoryManager.updateCategoryProgress(category.id, {
          lastPhotoId: currentPhoto.id,
          lastPhotoIndex: nextIndex,
          completedPhotos: newStats.kept + newStats.deleted,
          keptCount: newStats.kept,
          deletedCount: newStats.deleted,
        });
      }
    },
    [currentIndex, photoItems, dispatch, category, stats, isReady, categoryId, navigation, sessionManager]
  );

  const handleUndo = () => {
    if (canUndo) {
      dispatch(undoSwipeAction({}));
    }
  };

  if (!isReady) {
    return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>;
  }

  if (!category) {
    return (
      <EmptyState
        title="Category Not Found"
        description="We couldn't find the category you selected. It might have been removed."
        lottieSource={require('../assets/animations/onboarding.json')}
        buttonText="Go Back"
        onButtonPress={() => navigation.goBack()}
      />
    );
  }

  if (photoItems.length === 0) {
    return (
      <EmptyState
        title="All Cleaned Up!"
        description={`You've organized all the photos in the "${category.name}" category.`}
        lottieSource={require('../assets/animations/success.json')}
        buttonText="Back to Categories"
        onButtonPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{category.name}</Text>
        <TouchableOpacity onPress={handleUndo} disabled={!canUndo}>
          <Text style={[styles.headerButton, !canUndo && styles.disabledButton]}>Undo ({undoCount})</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <ProgressBar
          total={photoItems.length}
          current={currentIndex + 1}
          height={4}
          backgroundColor="#444"
          fillColor="#FFF"
        />
        <PhotoCounter current={currentIndex + 1} total={photoItems.length} />
        
        <MainSwipeCard 
          photos={photoItems}
          currentIndex={currentIndex}
          onSwipeComplete={handleSwipeComplete}
          onPhotoChange={setCurrentIndex}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Swipe left to delete • Swipe right to keep</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: 'white', fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerButton: { color: '#FFF', fontSize: 24 },
  disabledButton: { color: '#555' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { color: '#888', fontSize: 14, marginTop: 10 },
});

export default MainSwipeScreen; 