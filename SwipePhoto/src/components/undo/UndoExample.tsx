/**
 * UndoExample.tsx
 * 
 * Example component demonstrating how to integrate the undo system
 * with swipe components. This serves as both documentation and a test
 * of the undo functionality.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUndo } from '../../hooks/useUndo';
import type { SwipeDirection } from '../../types/undo';

interface Photo {
  id: string;
  name: string;
  url: string;
}

const samplePhotos: Photo[] = [
  { id: '1', name: 'Beach Photo', url: 'https://example.com/beach.jpg' },
  { id: '2', name: 'Mountain View', url: 'https://example.com/mountain.jpg' },
  { id: '3', name: 'City Lights', url: 'https://example.com/city.jpg' },
  { id: '4', name: 'Forest Trail', url: 'https://example.com/forest.jpg' },
  { id: '5', name: 'Ocean Sunset', url: 'https://example.com/sunset.jpg' },
];

export const UndoExample: React.FC = () => {
  // State for current photo and processed photos
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedPhotos, setProcessedPhotos] = useState<Set<string>>(new Set());
  const [keptPhotos, setKeptPhotos] = useState<Set<string>>(new Set());
  const [deletedPhotos, setDeletedPhotos] = useState<Set<string>>(new Set());

  // Use the undo hook
  const {
    canUndo,
    undoCount,
    lastAction,
    stackInfo,
    recordSwipe,
    undo,
    clearAll,
    hasActions,
    isStackFull,
    remainingSlots,
  } = useUndo();

  // Current photo
  const currentPhoto = samplePhotos[currentIndex];

  // Handle swipe action
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (!currentPhoto) return;

    // Record the action for undo
    recordSwipe(currentPhoto.id, direction, currentIndex, {
      velocity: 500,
      confidence: 0.8,
      sessionId: 'example-session',
    });

    // Update app state
    setProcessedPhotos(prev => new Set([...prev, currentPhoto.id]));
    
    if (direction === 'right') {
      setKeptPhotos(prev => new Set([...prev, currentPhoto.id]));
    } else {
      setDeletedPhotos(prev => new Set([...prev, currentPhoto.id]));
    }

    // Move to next photo
    if (currentIndex < samplePhotos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }

    console.log(`🔄 Undo Example: Swiped ${direction} on photo ${currentPhoto.id}`, {
      stackInfo,
      canUndo,
      undoCount,
    });
  }, [currentPhoto, currentIndex, recordSwipe, stackInfo, canUndo, undoCount]);

  // Handle undo action
  const handleUndo = useCallback(() => {
    const undoneAction = undo();
    
    if (undoneAction) {
      // Revert the app state
      const { photoId, direction, previousState } = undoneAction;
      
      setProcessedPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });

      if (direction === 'right') {
        setKeptPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
      } else {
        setDeletedPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(photoId);
          return newSet;
        });
      }

      // Restore photo index
      setCurrentIndex(previousState.photoIndex);

      Alert.alert(
        'Action Undone',
        `Undid ${direction} swipe on photo ${photoId}`,
        [{ text: 'OK' }]
      );

      console.log('🔄 Undo Example: Undone action', undoneAction);
    }
  }, [undo]);

  // Reset demo
  const resetDemo = useCallback(() => {
    setCurrentIndex(0);
    setProcessedPhotos(new Set());
    setKeptPhotos(new Set());
    setDeletedPhotos(new Set());
    clearAll();
    console.log('🔄 Undo Example: Demo reset');
  }, [clearAll]);

  if (!currentPhoto) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎉 All Photos Processed!</Text>
        <TouchableOpacity style={styles.button} onPress={resetDemo}>
          <Text style={styles.buttonText}>Reset Demo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Undo System Demo</Text>
      
      {/* Current Photo */}
      <View style={styles.photoContainer}>
        <Text style={styles.photoName}>{currentPhoto.name}</Text>
        <Text style={styles.photoId}>ID: {currentPhoto.id}</Text>
        <Text style={styles.progress}>
          Photo {currentIndex + 1} of {samplePhotos.length}
        </Text>
      </View>

      {/* Swipe Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.swipeButton, styles.deleteButton]}
          onPress={() => handleSwipe('left')}
        >
          <Text style={styles.swipeButtonText}>✕ Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeButton, styles.keepButton]}
          onPress={() => handleSwipe('right')}
        >
          <Text style={styles.swipeButtonText}>✓ Keep</Text>
        </TouchableOpacity>
      </View>

      {/* Undo Stack Info */}
      <View style={styles.stackInfo}>
        <Text style={styles.stackTitle}>Undo Stack Status</Text>
        <Text style={styles.stackText}>Actions in stack: {undoCount}/3</Text>
        <Text style={styles.stackText}>Can undo: {canUndo ? 'Yes' : 'No'}</Text>
        <Text style={styles.stackText}>Remaining slots: {remainingSlots}</Text>
        <Text style={styles.stackText}>Stack full: {isStackFull ? 'Yes' : 'No'}</Text>
        
        {lastAction && (
          <Text style={styles.stackText}>
            Last action: {lastAction.direction} on {lastAction.photoId}
          </Text>
        )}
      </View>

      {/* Undo Button */}
      <TouchableOpacity
        style={[styles.undoButton, !canUndo && styles.disabledButton]}
        onPress={handleUndo}
        disabled={!canUndo}
      >
        <Text style={[styles.undoButtonText, !canUndo && styles.disabledText]}>
          🔄 Undo Last Action
        </Text>
      </TouchableOpacity>

      {/* Statistics */}
      <View style={styles.stats}>
        <Text style={styles.statsTitle}>Session Stats</Text>
        <Text style={styles.statsText}>Kept: {keptPhotos.size}</Text>
        <Text style={styles.statsText}>Deleted: {deletedPhotos.size}</Text>
        <Text style={styles.statsText}>Total processed: {processedPhotos.size}</Text>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
        <Text style={styles.resetButtonText}>Reset Demo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
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
  progress: {
    fontSize: 12,
    color: '#007AFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  swipeButton: {
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
  swipeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stackInfo: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  stackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  stackText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  undoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  stats: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  resetButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 