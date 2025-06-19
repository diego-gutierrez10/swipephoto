import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MainSwipeCard, MainSwipeHeader, MainSwipeFooter } from '../components/swipe';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MainSwipeScreenProps {
  navigation?: any;
}

export const MainSwipeScreen: React.FC<MainSwipeScreenProps> = ({ navigation }) => {
  // State for tracking current photo index and swipe counts
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keepCount, setKeepCount] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);

  // Sample photos for the layout demonstration
  const samplePhotos = [
    {
      id: '1',
      uri: 'https://picsum.photos/800/600?random=1',
      thumbnailUri: 'https://picsum.photos/200/150?random=1',
      metadata: { width: 800, height: 600, fileSize: 120000, format: 'jpeg' }
    },
    {
      id: '2', 
      uri: 'https://picsum.photos/800/600?random=2',
      thumbnailUri: 'https://picsum.photos/200/150?random=2',
      metadata: { width: 800, height: 600, fileSize: 115000, format: 'jpeg' }
    },
    {
      id: '3',
      uri: 'https://picsum.photos/800/600?random=3', 
      thumbnailUri: 'https://picsum.photos/200/150?random=3',
      metadata: { width: 800, height: 600, fileSize: 108000, format: 'jpeg' }
    }
  ];

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    console.log(`🏗️ Task 7.4 Layout - Swiped ${direction}`);
    
    // Update counters based on swipe direction
    if (direction === 'right') {
      setKeepCount(prev => prev + 1);
    } else if (direction === 'left') {
      setDeleteCount(prev => prev + 1);
    }
  };

  const handlePhotoChange = (newIndex: number) => {
    console.log(`📸 Task 7.4 Layout - Photo changed to index ${newIndex}`);
    setCurrentIndex(newIndex);
  };

  const handleUndo = () => {
    console.log('🔄 Undo last action');
    // In a real implementation, this would revert the last swipe
    // For now, just reset counters as a demonstration
    if (keepCount > 0) {
      setKeepCount(prev => prev - 1);
    } else if (deleteCount > 0) {
      setDeleteCount(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Skip current photo');
    // Move to next photo without counting as keep/delete
    if (currentIndex < samplePhotos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header - Minimal and subtle */}
      <MainSwipeHeader navigation={navigation} />
      
      {/* Main Content - Photo Stack as focal point */}
      <View style={styles.contentContainer}>
        <MainSwipeCard 
          photos={samplePhotos}
          currentIndex={currentIndex}
          onSwipeComplete={handleSwipeComplete}
          onPhotoChange={handlePhotoChange}
        />
      </View>
      
      {/* Footer - Discrete controls */}
      <MainSwipeFooter 
        keepCount={keepCount}
        deleteCount={deleteCount}
        totalPhotos={samplePhotos.length}
        currentPhoto={currentIndex + 1} // +1 because UI shows 1-based indexing
        onUndo={handleUndo}
        onSkip={handleSkip}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    // Ensure minimum spacing for touch accuracy
    paddingVertical: 8,
  },
});

export default MainSwipeScreen; 