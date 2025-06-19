/**
 * SwipeTestScreen.tsx
 * 
 * Test screen to demonstrate swipe gesture functionality
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SwipeTestCard } from '../components/swipe/SwipeTestCard';
import { SwipePhotoCard } from '../components/swipe/SwipePhotoCard';
import MainSwipeCard from '../components/swipe/MainSwipeCard';
import { MainSwipeScreen } from './MainSwipeScreen';
import CategoryProgressDemoScreen from './CategoryProgressDemoScreen';
import ProgressSystemDemoScreen from './ProgressSystemDemoScreen';
import { UndoButtonDemoScreen } from './UndoButtonDemoScreen';

export const SwipeTestScreen: React.FC = () => {
  const [showPhotoCard, setShowPhotoCard] = useState(false);
  const [showMainSwipe, setShowMainSwipe] = useState(false);
  const [showMainSwipeScreen, setShowMainSwipeScreen] = useState(false);
  const [showCategoryProgress, setShowCategoryProgress] = useState(false);
  const [showProgressSystemDemo, setShowProgressSystemDemo] = useState(false);
  const [showUndoDemo, setShowUndoDemo] = useState(false);

  const handlePhotoDelete = () => {
    console.log('Photo deleted!');
  };

  const handlePhotoKeep = () => {
    console.log('Photo kept!');
  };

  const handleImagePress = () => {
    console.log('Image pressed - could open full screen view');
  };

  const handleMainSwipeDecision = (photoId: string, decision: 'keep' | 'delete') => {
    console.log(`Main Swipe Decision - Photo ${photoId}: ${decision}`);
  };

  const handleMainSwipeQueueEmpty = () => {
    console.log('Main Swipe Queue Complete!');
    // Could navigate to next screen or show completion message
  };

  // If showing undo demo (Task 9.2), render full screen
  if (showUndoDemo) {
    return (
      <View style={{ flex: 1 }}>
        <UndoButtonDemoScreen />
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 60, left: 20, zIndex: 1001 }]}
          onPress={() => setShowUndoDemo(false)}
        >
          <Text style={styles.backButtonText}>← Back to Test Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If showing progress system demo (Task 8.4), render full screen
  if (showProgressSystemDemo) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
          <TouchableOpacity 
            style={[styles.backButton, { margin: 20 }]}
            onPress={() => setShowProgressSystemDemo(false)}
          >
            <Text style={styles.backButtonText}>← Back to Test Menu</Text>
          </TouchableOpacity>
          <ProgressSystemDemoScreen />
        </SafeAreaView>
      </View>
    );
  }

  // If showing category progress demo (Task 8.3), render full screen
  if (showCategoryProgress) {
    return (
      <CategoryProgressDemoScreen 
        navigation={{ 
          goBack: () => setShowCategoryProgress(false) 
        }} 
      />
    );
  }

  // If showing main swipe screen layout (Task 7.4), render full screen
  if (showMainSwipeScreen) {
    return (
      <View style={{ flex: 1 }}>
        <MainSwipeScreen 
          navigation={{ 
            goBack: () => setShowMainSwipeScreen(false) 
          }} 
        />
      </View>
    );
  }

  // If showing main swipe, render full screen
  if (showMainSwipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowMainSwipe(false)}
          >
            <Text style={styles.backButtonText}>
              ← Back to Test Menu
            </Text>
          </TouchableOpacity>
        </View>
        
        <MainSwipeCard
          photos={[
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
          ]}
          currentIndex={0}
          onSwipeComplete={(direction) => {
            console.log(`🎯 Task 7.3 - Swiped ${direction} with visual animations`);
          }}
          onPhotoChange={(newIndex) => {
            console.log(`📸 Task 7.3 - Photo changed to index ${newIndex}`);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.header}>
            SwipePhoto Gesture Test
          </Text>
          <Text style={styles.subtitle}>
            Test the core swipe mechanics
          </Text>
          
          {/* Toggle Button */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowPhotoCard(!showPhotoCard)}
          >
            <Text style={styles.toggleButtonText}>
              {showPhotoCard ? '🧪 Show Debug Card' : '📷 Show Photo Card'}
            </Text>
          </TouchableOpacity>

          {/* Test Main Swipe with PhotoStack (Task 7.2) */}
          <TouchableOpacity 
            style={styles.mainSwipeButton}
            onPress={() => setShowMainSwipe(true)}
          >
            <Text style={styles.mainSwipeButtonText}>
              📸 Test Main Swipe with PhotoStack (Task 7.2)
            </Text>
          </TouchableOpacity>

          {/* Test Main Swipe with Visual Animations (Task 7.3) */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowMainSwipe(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Main Swipe with Visual Animations for Task 7.3"
          >
            <Text style={styles.testButtonText}>
              🎯 Test Main Swipe with Animations (Task 7.3)
            </Text>
          </TouchableOpacity>

          {/* Test Main Swipe Screen Layout (Task 7.4) */}
          <TouchableOpacity
            style={styles.layoutTestButton}
            onPress={() => setShowMainSwipeScreen(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Main Swipe Screen Layout for Task 7.4"
          >
            <Text style={styles.layoutTestButtonText}>
              🏗️ Test Main Swipe Screen Layout (Task 7.4)
            </Text>
          </TouchableOpacity>

          {/* Test Category Progress Tracker (Task 8.3) */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowCategoryProgress(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Category Progress Tracker for Task 8.3"
          >
            <Text style={styles.testButtonText}>
              📊 Test Category Progress (Task 8.3)
            </Text>
          </TouchableOpacity>

          {/* Test Progress System Demo (Task 8.4) */}
          <TouchableOpacity
            style={styles.progressSystemButton}
            onPress={() => setShowProgressSystemDemo(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Progress System with Real-time Updates for Task 8.4"
          >
            <Text style={styles.progressSystemButtonText}>
              🔄 Test Progress System (Task 8.4)
            </Text>
          </TouchableOpacity>

          {/* Test Undo Button Demo (Task 9.2) */}
          <TouchableOpacity
            style={styles.undoTestButton}
            onPress={() => setShowUndoDemo(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Undo Button Functionality for Task 9.2"
          >
            <Text style={styles.undoTestButtonText}>
              ↶ Test Undo Button (Task 9.2)
            </Text>
          </TouchableOpacity>
          
          {/* Conditional Card Display */}
          {showPhotoCard ? (
            <SwipePhotoCard
              imageSource={{
                uri: 'https://picsum.photos/800/600?random=2'
              }}
              altText="Test photo for SwipePhotoCard"
              metadata={{
                date: new Date().toLocaleDateString(),
                fileSize: '3.2 MB',
                location: 'Mountain View, CA',
                sourceApp: 'SwipePhoto Demo'
              }}
              onDelete={handlePhotoDelete}
              onKeep={handlePhotoKeep}
              onImagePress={handleImagePress}
              showMetadata={true}
              showDebugInfo={true}
            />
          ) : (
            <SwipeTestCard title="Swipe Me!" />
          )}
          
          <Text style={styles.instructions}>
            Use your finger to swipe the card{'\n'}
            Left = Delete | Right = Keep
            {showPhotoCard && '\n\nTap image to open full view (Task 6.1)'}
            {'\n\n📸 Task 7.2: PhotoStack with Preloading & Memory Management'}
            {'\n🎯 Task 7.3: Visual Animations like Tinder (rotation, scale, flyoff)'}
            {'\n🏗️ Task 7.4: Main Swipe Screen Layout (responsive, minimal UI)'}
            {'\n📊 Task 8.3: Category Completion Indicators (progress tracking)'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF41',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainSwipeButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  mainSwipeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
  backButtonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  testButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  layoutTestButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  layoutTestButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressSystemButton: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#5856D6',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  progressSystemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  undoTestButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  undoTestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default SwipeTestScreen; 