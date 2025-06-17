/**
 * SwipeTestCard.tsx
 * 
 * Test component to verify swipe gesture functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeGestureHandler, SwipeDirection } from './SwipeGestureHandler';

export interface SwipeTestCardProps {
  imageUri?: string;
  title?: string;
}

export const SwipeTestCard: React.FC<SwipeTestCardProps> = ({
  imageUri,
  title = 'Swipe Test Card',
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [swipeCount, setSwipeCount] = useState({ left: 0, right: 0 });

  const handleSwipeComplete = (direction: SwipeDirection) => {
    setSwipeCount(prev => ({
      ...prev,
      [direction]: prev[direction] + 1,
    }));

    Alert.alert(
      'Swipe Detected!',
      `Direction: ${direction === 'left' ? 'Delete' : 'Keep'}\nTotal swipes: ${swipeCount.left + swipeCount.right + 1}`,
      [{ text: 'OK' }]
    );

    // Reset progress indicators
    setSwipeProgress(0);
    setSwipeDirection(null);
  };

  const handleSwipeProgress = (progress: number, direction: SwipeDirection | null) => {
    setSwipeProgress(progress);
    setSwipeDirection(direction);
  };

  const getProgressColor = () => {
    if (!swipeDirection) return '#0D0D0D';
    return swipeDirection === 'left' ? '#FF3D71' : '#00D68F';
  };

  const getDirectionLabel = () => {
    if (!swipeDirection || swipeProgress < 0.1) return 'Neutral';
    return swipeDirection === 'left' ? 'DELETE' : 'KEEP';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Swipe Gesture Test
        </Text>
        
        <SwipeGestureHandler
          onSwipeComplete={handleSwipeComplete}
          onSwipeProgress={handleSwipeProgress}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            {/* Card Header */}
            <Text style={styles.cardTitle}>
              {title}
            </Text>
            
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Direction: {getDirectionLabel()}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${swipeProgress * 100}%`,
                      backgroundColor: getProgressColor(),
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Progress: {Math.round(swipeProgress * 100)}%
              </Text>
            </View>

            {/* Swipe Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionText}>
                👈 Swipe Left to Delete
              </Text>
              <Text style={styles.instructionText}>
                👉 Swipe Right to Keep
              </Text>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumberDelete}>
                  {swipeCount.left}
                </Text>
                <Text style={styles.statLabel}>
                  Deleted
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumberKeep}>
                  {swipeCount.right}
                </Text>
                <Text style={styles.statLabel}>
                  Kept
                </Text>
              </View>
            </View>

            {/* Visual Feedback */}
            <View style={[
              styles.feedbackOverlay,
              {
                opacity: swipeProgress * 0.3,
                backgroundColor: getProgressColor(),
              }
            ]} />
          </View>
        </SwipeGestureHandler>

        {/* Debug Information */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>
            Debug Info
          </Text>
          <Text style={styles.debugText}>
            Current Direction: {swipeDirection || 'None'}
          </Text>
          <Text style={styles.debugText}>
            Progress: {(swipeProgress * 100).toFixed(1)}%
          </Text>
          <Text style={styles.debugText}>
            Total Swipes: {swipeCount.left + swipeCount.right}
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  card: {
    width: 300,
    height: 400,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#0D0D0D',
    borderColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 30,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginVertical: 20,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#CCCCCC',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#CCCCCC',
  },
  instructionsContainer: {
    marginVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 4,
    color: '#CCCCCC',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberDelete: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3D71',
  },
  statNumberKeep: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D68F',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    color: '#CCCCCC',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    pointerEvents: 'none',
  },
  debugContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    backgroundColor: '#1A1A1A',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#00FF41',
  },
  debugText: {
    fontSize: 14,
    marginVertical: 2,
    textAlign: 'center',
    color: '#CCCCCC',
  },
});

export default SwipeTestCard; 