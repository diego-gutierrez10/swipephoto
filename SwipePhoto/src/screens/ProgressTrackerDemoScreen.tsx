/**
 * ProgressTrackerDemoScreen.tsx
 * 
 * Demo screen for testing ProgressTracker functionality including:
 * - Auto-save behavior
 * - Background save simulation
 * - Priority-based saving
 * - Recovery testing
 * - Event monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useProgressTracker, useProgressTrackerEvents } from '../hooks/useProgressTracker';

export default function ProgressTrackerDemoScreen(): JSX.Element {
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  
  const progressTracker = useProgressTracker({
    autoSaveInterval: 5000, // 5 seconds for demo
    criticalSaveDelay: 2000, // 2 seconds for demo
    enableLogging: true,
  });
  
  const { events, clearEvents } = useProgressTrackerEvents();

  // Simulate user interactions for demo
  useEffect(() => {
    if (!autoTrackingEnabled) return;

    const interval = setInterval(() => {
      const actions = [
        () => progressTracker.trackChange('photo_processed', { id: Math.random(), timestamp: Date.now() }, 'normal'),
        () => progressTracker.trackChange('category_updated', { category: 'favorites', count: Math.floor(Math.random() * 100) }, 'normal'),
        () => progressTracker.trackChange('user_preference', { theme: 'dark', language: 'en' }, 'low'),
      ];
      
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      randomAction();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoTrackingEnabled, progressTracker]);

  const handleTrackNormalChange = () => {
    const data = {
      action: 'photo_swiped',
      photoId: `photo_${Math.floor(Math.random() * 1000)}`,
      direction: Math.random() > 0.5 ? 'left' : 'right',
      timestamp: Date.now(),
    };
    progressTracker.trackChange('swipe_action', data, 'normal');
  };

  const handleTrackCriticalChange = () => {
    const data = {
      action: 'user_data_update',
      userId: 'user_123',
      profileData: { name: 'Test User', email: 'test@example.com' },
      timestamp: Date.now(),
    };
    progressTracker.trackChange('user_profile', data, 'critical');
  };

  const handleTrackLowPriorityChange = () => {
    const data = {
      action: 'ui_interaction',
      element: 'button_pressed',
      metadata: { x: Math.random() * 100, y: Math.random() * 100 },
      timestamp: Date.now(),
    };
    progressTracker.trackChange('ui_analytics', data, 'low');
  };

  const handleForceSave = async () => {
    try {
      await progressTracker.saveProgress(true);
      Alert.alert('Success', 'Progress saved successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save progress');
    }
  };

  const handleSimulateBackgroundSave = async () => {
    setSimulationRunning(true);
    
    // Add some changes
    progressTracker.trackChange('pre_background_action', { action: 'user_action_before_background' }, 'critical');
    progressTracker.trackChange('session_data', { sessionId: 'session_123', duration: 300 }, 'normal');
    
    try {
      // Simulate going to background by forcing a save
      await progressTracker.saveProgress(true);
      Alert.alert('Simulation Complete', 'Background save simulation completed successfully!');
    } catch (error) {
      Alert.alert('Simulation Failed', error instanceof Error ? error.message : 'Background save simulation failed');
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleClearError = () => {
    progressTracker.clearError();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (event: string) => {
    const icons: Record<string, string> = {
      'progress_tracked': '📝',
      'auto_save_started': '💾',
      'auto_save_completed': '✅',
      'auto_save_failed': '❌',
      'background_save_started': '⏸️',
      'background_save_completed': '✅',
      'recovery_started': '🔄',
      'recovery_completed': '🔄',
      'critical_save_triggered': '🚨',
    };
    return icons[event] || '📊';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Progress Tracker Demo</Text>
      <Text style={styles.subtitle}>Task 10.4: Background Progress Saving</Text>

      {/* Current State Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Current State</Text>
        <View style={styles.stateContainer}>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Initialized:</Text>
            <Text style={[styles.stateValue, { color: progressTracker.state.isInitialized ? '#4CAF50' : '#F44336' }]}>
              {progressTracker.state.isInitialized ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Tracking:</Text>
            <Text style={[styles.stateValue, { color: progressTracker.state.isTracking ? '#4CAF50' : '#F44336' }]}>
              {progressTracker.state.isTracking ? '🟢 Active' : '🔴 Inactive'}
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Pending Changes:</Text>
            <Text style={styles.stateValue}>{progressTracker.state.pendingChanges}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>App State:</Text>
            <Text style={styles.stateValue}>{progressTracker.state.currentAppState}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Background Task:</Text>
            <Text style={[styles.stateValue, { color: progressTracker.state.backgroundTaskActive ? '#FF9800' : '#4CAF50' }]}>
              {progressTracker.state.backgroundTaskActive ? '⏳ Running' : '✅ Idle'}
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Last Save:</Text>
            <Text style={styles.stateValue}>
              {progressTracker.state.lastSaveTime > 0 
                ? formatTimestamp(progressTracker.state.lastSaveTime)
                : 'Never'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Error Display */}
      {progressTracker.state.lastError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Last Error:</Text>
          <Text style={styles.errorMessage}>{progressTracker.state.lastError}</Text>
          <TouchableOpacity style={styles.clearErrorButton} onPress={handleClearError}>
            <Text style={styles.clearErrorButtonText}>Clear Error</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Manual Controls</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleTrackNormalChange}>
          <Text style={styles.buttonText}>📝 Track Normal Change (Swipe Action)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.criticalButton]} onPress={handleTrackCriticalChange}>
          <Text style={styles.buttonText}>🚨 Track Critical Change (User Data)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.lowPriorityButton]} onPress={handleTrackLowPriorityChange}>
          <Text style={styles.buttonText}>📊 Track Low Priority Change (Analytics)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleForceSave}>
          <Text style={styles.buttonText}>💾 Force Save Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.simulateButton, simulationRunning && styles.disabledButton]} 
          onPress={handleSimulateBackgroundSave}
          disabled={simulationRunning}
        >
          <Text style={styles.buttonText}>
            {simulationRunning ? '⏳ Running Simulation...' : '⏸️ Simulate Background Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auto-tracking Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 Auto-tracking</Text>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Enable automatic change tracking (every 2s)</Text>
          <Switch
            value={autoTrackingEnabled}
            onValueChange={setAutoTrackingEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoTrackingEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Event Log Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Event Log (Last 10)</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearEvents}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.eventContainer}>
          {events.length === 0 ? (
            <Text style={styles.noEventsText}>No events yet. Start tracking some changes!</Text>
          ) : (
            events.slice().reverse().map((event, index) => (
              <View key={`${event.timestamp}-${index}`} style={styles.eventItem}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{getEventIcon(event.event)}</Text>
                  <Text style={styles.eventType}>{event.event}</Text>
                  <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                </View>
                {event.data && (
                  <Text style={styles.eventData} numberOfLines={2}>
                    {JSON.stringify(event.data, null, 2)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Instructions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Instructions</Text>
        <Text style={styles.instructionText}>
          • Use manual controls to track different types of changes{'\n'}
          • Enable auto-tracking to see continuous progress tracking{'\n'}
          • Critical changes trigger immediate saves (2s delay){'\n'}
          • Normal auto-save happens every 5 seconds{'\n'}
          • Simulate background save to test app state transitions{'\n'}
          • Monitor event log to see real-time progress tracker activity
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stateContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    paddingLeft: 12,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stateLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  stateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 12,
  },
  clearErrorButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  clearErrorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  criticalButton: {
    backgroundColor: '#F44336',
  },
  lowPriorityButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  simulateButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 12,
  },
  eventContainer: {
    maxHeight: 300,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
  },
  eventData: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 4,
    borderRadius: 4,
    marginLeft: 24,
  },
  clearButton: {
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 