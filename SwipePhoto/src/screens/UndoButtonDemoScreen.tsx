/**
 * UndoButtonDemoScreen.tsx
 * 
 * Demo screen showcasing the UndoButton component and undo functionality.
 * This screen demonstrates the complete undo system integration.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedUndoButton } from '../components/undo/AnimatedUndoButton';
import { EnhancedUndoButton } from '../components/undo/EnhancedUndoButton';
import UndoVisualFeedback from '../components/undo/UndoVisualFeedback';
import { useUndo } from '../hooks/useUndo';

interface DemoPhoto {
  id: string;
  name: string;
  status: 'pending' | 'kept' | 'deleted';
}

const initialPhotos: DemoPhoto[] = [
  { id: '1', name: 'Beach Sunset', status: 'pending' },
  { id: '2', name: 'Mountain Peak', status: 'pending' },
  { id: '3', name: 'City Skyline', status: 'pending' },
  { id: '4', name: 'Forest Path', status: 'pending' },
  { id: '5', name: 'Ocean Wave', status: 'pending' },
  { id: '6', name: 'Desert Dune', status: 'pending' },
];

export const UndoButtonDemoScreen: React.FC = () => {
  const [photos, setPhotos] = useState<DemoPhoto[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use undo hook
  const { 
    canUndo, 
    undoCount, 
    recordSwipe, 
    undo, 
    clearAll,
    stackInfo,
    lastAction,
    visualFeedback
  } = useUndo();

  const currentPhoto = photos[currentIndex];

  // Handle swipe action
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentPhoto) return;

    // Record action for undo
    recordSwipe(currentPhoto.id, direction, currentIndex, {
      velocity: 500,
      confidence: 0.9,
      sessionId: 'demo-session',
    });

    // Update photo status
    setPhotos(prev => prev.map(photo => 
      photo.id === currentPhoto.id 
        ? { ...photo, status: direction === 'right' ? 'kept' : 'deleted' }
        : photo
    ));

    // Move to next photo
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }

    console.log(`📸 Demo: ${direction} swipe on ${currentPhoto.name}`);
  }, [currentPhoto, currentIndex, recordSwipe, photos.length]);

  // Handle undo from button
  const handleUndoAction = useCallback(async () => {
    const undoneAction = await undo();
    
    if (undoneAction) {
      // Revert photo status
      setPhotos(prev => prev.map(photo => 
        photo.id === undoneAction.photoId 
          ? { ...photo, status: 'pending' }
          : photo
      ));

      // Restore photo index
      setCurrentIndex(undoneAction.previousState.photoIndex);

      Alert.alert(
        'Action Undone',
        `Undid ${undoneAction.direction} swipe on ${undoneAction.photoId}`,
        [{ text: 'OK' }]
      );

      console.log(`🔄 Demo: Undone ${undoneAction.direction} swipe on ${undoneAction.photoId}`);
    }
  }, [undo]);

  // Reset demo
  const resetDemo = useCallback(() => {
    setPhotos(initialPhotos);
    setCurrentIndex(0);
    clearAll();
  }, [clearAll]);

  // Get statistics
  const keptCount = photos.filter(p => p.status === 'kept').length;
  const deletedCount = photos.filter(p => p.status === 'deleted').length;
  const pendingCount = photos.filter(p => p.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔄 Undo Button Demo</Text>
          <Text style={styles.subtitle}>
            Swipe photos and use the floating undo button
          </Text>
        </View>

        {/* Current Photo */}
        {currentPhoto && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Current Photo</Text>
            <View style={styles.photoCard}>
              <Text style={styles.photoName}>{currentPhoto.name}</Text>
              <Text style={styles.photoId}>ID: {currentPhoto.id}</Text>
              <Text style={styles.photoProgress}>
                Photo {currentIndex + 1} of {photos.length}
              </Text>
            </View>

            {/* Swipe Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleSwipe('left')}
              >
                <Text style={styles.actionButtonText}>❌ Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.keepButton]}
                onPress={() => handleSwipe('right')}
              >
                <Text style={styles.actionButtonText}>✅ Keep</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Completion Message */}
        {!currentPhoto && (
          <View style={styles.completionSection}>
            <Text style={styles.completionTitle}>🎉 All Photos Processed!</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
              <Text style={styles.resetButtonText}>Reset Demo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Undo Stack Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Undo Stack Status</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Can Undo</Text>
              <Text style={styles.infoValue}>{canUndo ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Actions Available</Text>
              <Text style={styles.infoValue}>{undoCount}/3</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Stack Full</Text>
              <Text style={styles.infoValue}>{stackInfo.isFull ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Utilization</Text>
              <Text style={styles.infoValue}>{Math.round(stackInfo.utilizationPercentage)}%</Text>
            </View>
          </View>

          {lastAction && (
            <View style={styles.lastActionInfo}>
              <Text style={styles.lastActionTitle}>Last Action:</Text>
              <Text style={styles.lastActionText}>
                {lastAction.direction} swipe on {lastAction.photoId}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Session Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{keptCount}</Text>
              <Text style={styles.statLabel}>Kept</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deletedCount}</Text>
              <Text style={styles.statLabel}>Deleted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Manual Undo Button */}
        <View style={styles.manualUndoSection}>
          <Text style={styles.sectionTitle}>Manual Undo</Text>
          <TouchableOpacity
            style={[styles.manualUndoButton, !canUndo && styles.disabledButton]}
            onPress={handleUndoAction}
            disabled={!canUndo}
          >
            <Text style={[styles.manualUndoText, !canUndo && styles.disabledText]}>
              🔄 Undo Last Action
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            1. Use the Delete/Keep buttons to process photos{'\n'}
            2. Watch the floating undo button appear in the bottom-right{'\n'}
            3. Tap the floating button or manual button to undo{'\n'}
            4. Stack holds up to 3 actions, older ones are automatically removed
          </Text>
        </View>
      </ScrollView>

      {/* Floating Enhanced Undo Button with animations */}
      <EnhancedUndoButton
        enableHaptics={true}
        animationConfig={{
          duration: 150,
          pressedScale: 0.92,
          respectReduceMotion: true,
        }}
        testID="demo-enhanced-undo-button"
      />

      {/* Visual Feedback Component */}
      <UndoVisualFeedback
        visible={visualFeedback.isVisible}
        type={visualFeedback.feedbackState.type}
        restoredItem={visualFeedback.feedbackState.restoredItem}
        animationOrigin={visualFeedback.feedbackState.animationOrigin}
        onComplete={visualFeedback.hideFeedback}
        enableSound={visualFeedback.config.enableSound}
        reducedMotion={visualFeedback.config.respectReducedMotion}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for floating button
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  photoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  photoCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  photoId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  photoProgress: {
    fontSize: 12,
    color: '#007AFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  keepButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completionSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastActionInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  lastActionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  lastActionText: {
    fontSize: 16,
    color: '#fff',
  },
  statsSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  manualUndoSection: {
    marginBottom: 20,
  },
  manualUndoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  manualUndoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  instructionsSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
}); 