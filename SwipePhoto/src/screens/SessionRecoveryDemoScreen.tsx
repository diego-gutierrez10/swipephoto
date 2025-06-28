import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { RecoveryDialog } from '../components/RecoveryDialog';
import { RecoveryTelemetry } from '../services/SessionRecoveryManager';

export const SessionRecoveryDemoScreen: React.FC = () => {
  const [telemetryData, setTelemetryData] = useState<Array<RecoveryTelemetry & { timestamp: number }>>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [autoModeActive, setAutoModeActive] = useState(false);

  const recovery = useSessionRecovery({
    autoInitialize: false, // Manual control for demo
    onCrashDetected: (result) => {
      console.log('🔥 Demo: Crash detected!', result);
      Alert.alert(
        'Crash Detected!',
        `Corruption Level: ${result.corruptionLevel}\nRecommendation: ${result.recoveryRecommendation}`
      );
    },
    onRecoveryCompleted: (success, action) => {
      console.log('🎯 Demo: Recovery completed', { success, action });
      Alert.alert(
        'Recovery Completed',
        `Action: ${action}\nSuccess: ${success ? 'Yes' : 'No'}`
      );
      loadTelemetry();
    },
    onError: (error) => {
      console.error('❌ Demo: Recovery error:', error);
      Alert.alert('Recovery Error', error);
    }
  });

  const loadTelemetry = useCallback(async () => {
    try {
      const data = await recovery.getTelemetry();
      setTelemetryData(data);
    } catch (error) {
      console.error('Error loading telemetry:', error);
    }
  }, [recovery]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const handleManualInitialize = async () => {
    const success = await recovery.initialize();
    if (success) {
      Alert.alert('Success', 'Session recovery initialized successfully');
    }
    await loadTelemetry();
  };

  const handleCreateSnapshot = async () => {
    await recovery.createSnapshot('manual_demo_snapshot');
    Alert.alert('Success', 'Session snapshot created');
  };

  const handleRecordJournalEntry = () => {
    recovery.recordJournalEntry(
      { 
        action: 'demo_action', 
        timestamp: Date.now(),
        data: 'Demo journal entry data'
      }, 
      'manual_demo_journal'
    );
    Alert.alert('Success', 'Journal entry recorded');
  };

  const simulateCrash = async () => {
    Alert.alert(
      'Simulate Crash',
      'This will simulate an app crash by not clearing the startup flag. Restart the app to see recovery in action.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Crash Simulated', 'Now restart the app to test recovery!');
          }
        }
      ]
    );
  };

  const startAutoMode = useCallback(() => {
    setAutoModeActive(true);
    let counter = 0;
    
    const interval = setInterval(() => {
      counter++;
      
      // Create snapshot every 3 cycles
      if (counter % 3 === 0) {
        recovery.createSnapshot(`auto_demo_${counter}`);
      }
      
      // Record journal entry every cycle
      recovery.recordJournalEntry(
        {
          cycle: counter,
          timestamp: Date.now(),
          randomData: Math.random()
        },
        `auto_demo_cycle_${counter}`
      );
      
      // Stop after 10 cycles
      if (counter >= 10) {
        clearInterval(interval);
        setAutoModeActive(false);
        Alert.alert('Auto Demo Complete', 'Created 3 snapshots and 10 journal entries');
        loadTelemetry();
      }
    }, 1000);
  }, [recovery, loadTelemetry]);

  const clearTelemetry = () => {
    Alert.alert(
      'Clear Telemetry',
      'This will clear all recovery telemetry data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setTelemetryData([]);
            Alert.alert('Success', 'Telemetry data cleared');
          }
        }
      ]
    );
  };

  const resetRecoveryManager = () => {
    Alert.alert(
      'Reset Recovery Manager',
      'This will reset the entire recovery manager instance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            recovery.dispose();
            Alert.alert('Success', 'Recovery manager reset');
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTelemetryEntry = (entry: RecoveryTelemetry & { timestamp: number }) => {
    const lines = [
      `Time: ${formatTimestamp(entry.timestamp)}`,
      `Crash: ${entry.crashDetected ? 'Yes' : 'No'}`,
      `Recovery Attempted: ${entry.recoveryAttempted ? 'Yes' : 'No'}`,
      `Success: ${entry.recoverySuccess ? 'Yes' : 'No'}`
    ];

    if (entry.userChoice) lines.push(`User Choice: ${entry.userChoice}`);
    if (entry.sessionAge) lines.push(`Session Age: ${Math.round(entry.sessionAge / 60000)}min`);
    if (entry.dataCorruption) lines.push(`Data Corruption: Yes`);
    if (entry.errorType) lines.push(`Error: ${entry.errorType}`);
    if (entry.recoveryDuration) lines.push(`Duration: ${entry.recoveryDuration}ms`);

    return lines.join('\n');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Session Recovery Demo</Text>
          <Text style={styles.subtitle}>Test crash detection and recovery functionality</Text>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Initialized</Text>
              <View style={[styles.statusIndicator, { backgroundColor: recovery.isInitialized ? '#34C759' : '#FF3B30' }]} />
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Initializing</Text>
              <View style={[styles.statusIndicator, { backgroundColor: recovery.isInitializing ? '#FF9500' : '#8E8E93' }]} />
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Has Error</Text>
              <View style={[styles.statusIndicator, { backgroundColor: recovery.hasError ? '#FF3B30' : '#34C759' }]} />
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Recovery Dialog</Text>
              <View style={[styles.statusIndicator, { backgroundColor: recovery.showRecoveryDialog ? '#007AFF' : '#8E8E93' }]} />
            </View>
          </View>
          
          {recovery.hasError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {recovery.error}</Text>
            </View>
          )}
        </View>

        {/* Manual Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Controls</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleManualInitialize}
              disabled={recovery.isInitializing}
            >
              {recovery.isInitializing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>🔄 Initialize</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleCreateSnapshot}
              disabled={!recovery.isInitialized}
            >
              <Text style={styles.secondaryButtonText}>📸 Create Snapshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRecordJournalEntry}
              disabled={!recovery.isInitialized}
            >
              <Text style={styles.secondaryButtonText}>📝 Record Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.warningButton]}
              onPress={simulateCrash}
            >
              <Text style={styles.warningButtonText}>🔥 Simulate Crash</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Mode */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Auto Demo Mode</Text>
            <Switch
              value={autoMode}
              onValueChange={setAutoMode}
              disabled={autoModeActive}
            />
          </View>
          
          {autoMode && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={startAutoMode}
              disabled={autoModeActive || !recovery.isInitialized}
            >
              {autoModeActive ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Running Auto Demo...</Text>
                </>
              ) : (
                <Text style={styles.primaryButtonText}>🤖 Start Auto Demo</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Telemetry Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Telemetry ({telemetryData.length})</Text>
            <TouchableOpacity onPress={clearTelemetry} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {telemetryData.length === 0 ? (
            <Text style={styles.emptyText}>No telemetry data available</Text>
          ) : (
            <View style={styles.telemetryContainer}>
              {telemetryData.slice().reverse().map((entry, index) => (
                <View key={index} style={styles.telemetryEntry}>
                  <Text style={styles.telemetryText}>{formatTelemetryEntry(entry)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Debug Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Actions</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={resetRecoveryManager}
          >
            <Text style={styles.dangerButtonText}>🔴 Reset Recovery Manager</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Recovery Dialog */}
      {recovery.showRecoveryDialog && recovery.recoveryUIOptions && recovery.crashDetectionResult && (
        <RecoveryDialog
          visible={recovery.showRecoveryDialog}
          recoveryOptions={recovery.recoveryUIOptions}
          crashResult={recovery.crashDetectionResult}
          onRecoveryAction={recovery.executeRecovery}
          onClose={recovery.dismissRecoveryDialog}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    width: '100%',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  telemetryContainer: {
    maxHeight: 300,
  },
  telemetryEntry: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  telemetryText: {
    fontSize: 12,
    color: '#333333',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
}); 