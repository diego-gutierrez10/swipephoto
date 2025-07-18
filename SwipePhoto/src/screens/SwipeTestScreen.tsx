/**
 * SwipeTestScreen.tsx
 * 
 * Test screen to demonstrate swipe gesture functionality
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SwipeTestCard } from '../components/swipe/SwipeTestCard';
import { SwipePhotoCard } from '../components/swipe/SwipePhotoCard';
import { MainSwipeScreen } from './MainSwipeScreen';
import CategoryProgressDemoScreen from './CategoryProgressDemoScreen';
import ProgressSystemDemoScreen from './ProgressSystemDemoScreen';
import { UndoButtonDemoScreen } from './UndoButtonDemoScreen';
import SessionManagerDemoScreen from './SessionManagerDemoScreen';
import ProgressTrackerDemoScreen from './ProgressTrackerDemoScreen';
import { SessionRecoveryDemoScreen } from './SessionRecoveryDemoScreen';

export const SwipeTestScreen: React.FC = () => {
  const [showPhotoCard, setShowPhotoCard] = useState(false);
  const [showMainSwipeScreen, setShowMainSwipeScreen] = useState(false);
  const [showCategoryProgress, setShowCategoryProgress] = useState(false);
  const [showProgressSystemDemo, setShowProgressSystemDemo] = useState(false);
  const [showUndoDemo, setShowUndoDemo] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);

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

  // If showing session recovery demo (Task 10.5), render full screen
  if (showSessionRecovery) {
    return (
      <View style={{ flex: 1 }}>
        <SessionRecoveryDemoScreen />
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 60, left: 20, zIndex: 1001 }]}
          onPress={() => setShowSessionRecovery(false)}
        >
          <Text style={styles.backButtonText}>← Back to Test Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If showing progress tracker demo (Task 10.4), render full screen
  if (showProgressTracker) {
    return (
      <View style={{ flex: 1 }}>
        <ProgressTrackerDemoScreen />
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 60, left: 20, zIndex: 1001 }]}
          onPress={() => setShowProgressTracker(false)}
        >
          <Text style={styles.backButtonText}>← Back to Test Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If showing session manager demo (Task 10.3), render full screen
  if (showSessionManager) {
    return (
      <View style={{ flex: 1 }}>
        <SessionManagerDemoScreen />
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 60, left: 20, zIndex: 1001 }]}
          onPress={() => setShowSessionManager(false)}
        >
          <Text style={styles.backButtonText}>← Back to Test Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <MainSwipeScreen />
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 60, left: 20, zIndex: 1001 }]}
          onPress={() => setShowMainSwipeScreen(false)}
        >
          <Text style={styles.backButtonText}>← Back to Test Menu</Text>
        </TouchableOpacity>
      </View>
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

          {/* Test Session Manager Demo (Task 10.3) */}
          <TouchableOpacity
            style={styles.sessionManagerButton}
            onPress={() => setShowSessionManager(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Session Manager and Pause/Resume Functionality for Task 10.3"
          >
            <Text style={styles.sessionManagerButtonText}>
              💾 Test Session Manager (Task 10.3)
            </Text>
          </TouchableOpacity>

          {/* Test Progress Tracker Demo (Task 10.4) */}
          <TouchableOpacity
            style={styles.progressTrackerButton}
            onPress={() => setShowProgressTracker(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Progress Tracker and Background Saving for Task 10.4"
          >
            <Text style={styles.progressTrackerButtonText}>
              🔄 Test Progress Tracker (Task 10.4)
            </Text>
          </TouchableOpacity>

          {/* Test Session Recovery Demo (Task 10.5) */}
          <TouchableOpacity
            style={styles.sessionRecoveryButton}
            onPress={() => setShowSessionRecovery(true)}
            accessibilityRole="button"
            accessibilityLabel="Test Session Recovery and Crash Detection for Task 10.5"
          >
            <Text style={styles.sessionRecoveryButtonText}>
              🛡️ Test Session Recovery (Task 10.5)
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
  sessionManagerButton: {
    backgroundColor: '#32D74B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#32D74B',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sessionManagerButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressTrackerButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  progressTrackerButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  sessionRecoveryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sessionRecoveryButtonText: {
    color: '#FFFFFF',
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
});

export default SwipeTestScreen; 