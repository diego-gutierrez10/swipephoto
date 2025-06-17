/**
 * SwipeTestScreen.tsx
 * 
 * Test screen to demonstrate swipe gesture functionality
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SwipeTestCard } from '../components/swipe/SwipeTestCard';
import { PhotoCard } from '../components/photo/PhotoCard';
import { SwipeDirection } from '../components/swipe/SwipeGestureHandler';

export const SwipeTestScreen: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'test' | 'photo'>('photo');
  const [swipeStats, setSwipeStats] = useState({ deleted: 0, kept: 0 });

  const handleSwipeComplete = (direction: SwipeDirection) => {
    setSwipeStats(prev => ({
      deleted: direction === 'left' ? prev.deleted + 1 : prev.deleted,
      kept: direction === 'right' ? prev.kept + 1 : prev.kept,
    }));
  };

  const handleSwipeProgress = (progress: number, direction: SwipeDirection | null) => {
    // Optional: Add visual feedback during swipe
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            SwipePhoto Animation Demo
          </Text>
          <Text style={styles.subtitle}>
            Advanced card tilt & slide animations (300ms)
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, demoMode === 'photo' && styles.activeModeButton]}
            onPress={() => setDemoMode('photo')}
          >
            <Text style={[styles.modeButtonText, demoMode === 'photo' && styles.activeModeButtonText]}>
              📸 Photo Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, demoMode === 'test' && styles.activeModeButton]}
            onPress={() => setDemoMode('test')}
          >
            <Text style={[styles.modeButtonText, demoMode === 'test' && styles.activeModeButtonText]}>
              🧪 Test Card
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Component */}
        <View style={styles.demoContainer}>
          {demoMode === 'photo' ? (
            <PhotoCard
              onSwipeComplete={handleSwipeComplete}
              onSwipeProgress={handleSwipeProgress}
            />
          ) : (
            <SwipeTestCard title="Advanced Animation Test" />
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Swipe Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{swipeStats.deleted}</Text>
              <Text style={styles.statLabel}>Deleted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{swipeStats.kept}</Text>
              <Text style={styles.statLabel}>Kept</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Animation Features</Text>
          <Text style={styles.instructionText}>
            ✨ Physics-based spring animations{'\n'}
            🎯 300ms completion timing{'\n'}
            📐 20° maximum rotation tilt{'\n'}
            📏 Subtle scaling effects{'\n'}
            ⚡ Sub-100ms gesture response
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
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
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 10,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  activeModeButton: {
    borderColor: '#00FF41',
    backgroundColor: '#002211',
  },
  modeButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#00FF41',
  },
  demoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FF41',
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  instructionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});

export default SwipeTestScreen; 