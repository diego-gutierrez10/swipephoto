/**
 * SessionManagerDemoScreen.tsx
 * 
 * Demo screen showcasing SessionManager functionality.
 * Shows lifecycle state, session information, and pause/resume controls.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSessionManager, useSessionLifecycle } from '../hooks';
import { SessionState, SessionEvent } from '../types/session';
import { SessionManager } from '../services/SessionManager';

/**
 * Session info display component
 */
const SessionInfo: React.FC<{ session: SessionState | null }> = ({ session }) => {
  if (!session) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>No Active Session</Text>
      </View>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Session Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Session ID:</Text>
        <Text style={styles.infoValue}>{session.sessionId.substring(0, 20)}...</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Version:</Text>
        <Text style={styles.infoValue}>{session.version}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Saved:</Text>
        <Text style={styles.infoValue}>{formatTime(session.lastSaved)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Current Screen:</Text>
        <Text style={styles.infoValue}>{session.navigation.currentScreen}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Photo Index:</Text>
        <Text style={styles.infoValue}>{session.navigation.currentPhotoIndex}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Photos Processed:</Text>
        <Text style={styles.infoValue}>{session.progress.photosProcessed}</Text>
      </View>
    </View>
  );
};

/**
 * Lifecycle state display component
 */
const LifecycleState: React.FC<{ session: SessionState | null }> = ({ session }) => {
  if (!session) return null;

  const { lifecycle } = session;
  
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const getStatusColor = () => {
    if (lifecycle.isActive) return '#4CAF50'; // Green
    if (lifecycle.isPaused) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Lifecycle State</Text>
      
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>
          {lifecycle.isActive ? 'ACTIVE' : lifecycle.isPaused ? 'PAUSED' : 'INACTIVE'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Pause Count:</Text>
        <Text style={styles.infoValue}>{lifecycle.pauseCount}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Pause Time:</Text>
        <Text style={styles.infoValue}>{formatDuration(lifecycle.totalPauseTime)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Background Duration:</Text>
        <Text style={styles.infoValue}>{formatDuration(lifecycle.backgroundDuration)}</Text>
      </View>
      
      {lifecycle.pausedAt && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Paused At:</Text>
          <Text style={styles.infoValue}>
            {new Date(lifecycle.pausedAt).toLocaleTimeString()}
          </Text>
        </View>
      )}
      
      {lifecycle.resumedAt && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Resumed At:</Text>
          <Text style={styles.infoValue}>
            {new Date(lifecycle.resumedAt).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Restoration info display component
 */
const RestorationInfo: React.FC<{ session: SessionState | null }> = ({ session }) => {
  if (!session || !session.restoration.wasRestored) return null;

  const { restoration } = session;

  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Restoration Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Restored From:</Text>
        <Text style={styles.infoValue}>{restoration.restoredFrom || 'Unknown'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Validation Success:</Text>
        <Text style={[styles.infoValue, { color: restoration.validationSuccess ? '#4CAF50' : '#F44336' }]}>
          {restoration.validationSuccess ? 'Yes' : 'No'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Resources Loaded:</Text>
        <Text style={styles.infoValue}>
          {restoration.resourcesLoaded} / {restoration.totalResources}
        </Text>
      </View>
      
      {restoration.validationErrors.length > 0 && (
        <View style={styles.errorsContainer}>
          <Text style={styles.errorsTitle}>Validation Errors:</Text>
          {restoration.validationErrors.map((error, index) => (
            <Text key={index} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Control buttons component
 */
const SessionControls: React.FC = () => {
  const { pause, resume, saveSession, updateSession, state } = useSessionManager();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePause = useCallback(async () => {
    setLoading('pause');
    try {
      await pause();
      Alert.alert('Success', 'Session paused successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to pause: ${error}`);
    } finally {
      setLoading(null);
    }
  }, [pause]);

  const handleResume = useCallback(async () => {
    setLoading('resume');
    try {
      await resume();
      Alert.alert('Success', 'Session resumed successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to resume: ${error}`);
    } finally {
      setLoading(null);
    }
  }, [resume]);

  const handleSave = useCallback(async () => {
    setLoading('save');
    try {
      await saveSession();
      Alert.alert('Success', 'Session saved successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to save: ${error}`);
    } finally {
      setLoading(null);
    }
  }, [saveSession]);

  const handleUpdatePhoto = useCallback(async () => {
    setLoading('update');
    try {
      const newIndex = Math.floor(Math.random() * 100);
      await updateSession({
        navigation: {
          ...state.currentSession?.navigation!,
          currentPhotoIndex: newIndex,
        },
        progress: {
          ...state.currentSession?.progress!,
          photosProcessed: state.currentSession?.progress.photosProcessed! + 1,
        },
      });
      Alert.alert('Success', `Updated photo index to ${newIndex}`);
    } catch (error) {
      Alert.alert('Error', `Failed to update: ${error}`);
    } finally {
      setLoading(null);
    }
  }, [updateSession, state.currentSession]);

  const handleResetSession = useCallback(async () => {
    setLoading('reset');
    try {      
      // Reset the singleton and clean up
      if (SessionManager.resetInstance) {
        SessionManager.resetInstance();
      }
      
      // Clear storage manually
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Clear all session-related keys
      const keysToRemove = [
        '@SwipePhoto_session_state',
        '@SwipePhoto_session_backup', 
        '@SwipePhoto_session_metadata',
        // Also clear legacy keys just in case
        '@SwipePhoto:session_state',
        '@SwipePhoto:session_backup',
        '@SwipePhoto:session_metadata',
      ];
      
      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      }
      
      Alert.alert('Success', 'Session manager reset successfully. Please restart the demo to see changes.');
      
    } catch (error) {
      console.error('Reset failed:', error);
      Alert.alert('Error', `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <View style={styles.controlsContainer}>
      <Text style={styles.cardTitle}>Session Controls</Text>
      
      <TouchableOpacity
        style={[styles.button, styles.pauseButton]}
        onPress={handlePause}
        disabled={loading !== null || state.isPaused}
      >
        <Text style={styles.buttonText}>
          {loading === 'pause' ? 'Pausing...' : 'Pause Session'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.resumeButton]}
        onPress={handleResume}
        disabled={loading !== null || !state.isPaused}
      >
        <Text style={styles.buttonText}>
          {loading === 'resume' ? 'Resuming...' : 'Resume Session'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
        disabled={loading !== null}
      >
        <Text style={styles.buttonText}>
          {loading === 'save' ? 'Saving...' : 'Save Session'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.updateButton]}
        onPress={handleUpdatePhoto}
        disabled={loading !== null}
      >
        <Text style={styles.buttonText}>
          {loading === 'update' ? 'Updating...' : 'Simulate Photo Change'}
        </Text>
      </TouchableOpacity>
      
              <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleResetSession}
          disabled={state.isRestoring || loading === 'reset'}
        >
          <Text style={styles.buttonText}>
            {loading === 'reset' ? '⏳ Resetting...' : '🔄 Reset Session Manager'}
          </Text>
        </TouchableOpacity>
    </View>
  );
};

/**
 * Session events log component
 */
const SessionEventsLog: React.FC = () => {
  const [events, setEvents] = useState<Array<{ event: SessionEvent; data: any; timestamp: number }>>([]);
  const { addEventListener, removeEventListener } = useSessionManager();

  useEffect(() => {
    const handleEvent = (event: SessionEvent, data?: any) => {
      setEvents(prev => [...prev.slice(-9), { // Keep last 10 events
        event,
        data,
        timestamp: Date.now(),
      }]);
    };

    // Listen to all session events
    const eventTypes: SessionEvent[] = [
      'session_started',
      'session_ended',
      'session_saved',
      'session_loaded',
      'session_recovery_success',
      'session_recovery_failed',
      'storage_error',
    ];

    eventTypes.forEach(eventType => {
      addEventListener(eventType, handleEvent);
    });

    return () => {
      eventTypes.forEach(eventType => {
        removeEventListener(eventType, handleEvent);
      });
    };
  }, [addEventListener, removeEventListener]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Recent Events</Text>
      {events.length === 0 ? (
        <Text style={styles.noEventsText}>No events yet...</Text>
      ) : (
        events.map((eventInfo, index) => (
          <View key={index} style={styles.eventRow}>
            <Text style={styles.eventTime}>{formatTime(eventInfo.timestamp)}</Text>
            <Text style={styles.eventName}>{eventInfo.event}</Text>
          </View>
        ))
      )}
    </View>
  );
};

/**
 * Main demo screen component
 */
const SessionManagerDemoScreen: React.FC = () => {
      const { state } = useSessionManager();
    const lifecycle = useSessionLifecycle();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Session Manager Demo</Text>
        
                  {state.lastError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error:</Text>
              <Text style={styles.errorMessage}>{state.lastError}</Text>
            </View>
          )}
        
        {!lifecycle.isInitialized ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {lifecycle.isRestoring ? 'Restoring session...' : 'Initializing...'}
            </Text>
          </View>
        ) : (
          <>
            <SessionInfo session={state.currentSession} />
            <LifecycleState session={state.currentSession} />
            <RestorationInfo session={state.currentSession} />
            <SessionControls />
            <SessionEventsLog />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  statusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  controlsContainer: {
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  updateButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
  },
  errorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 2,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  eventName: {
    fontSize: 12,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  noEventsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
});

export default SessionManagerDemoScreen; 