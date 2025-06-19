import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import {
  startSession,
  endSession,
  incrementProgress,
  decrementProgress,
  updateCategoryProgress,
  selectProgress,
  selectProgressPercentage,
  selectIsSessionActive,
} from '../store/slices/progressSlice';
import { ProgressManager } from '../services/ProgressManager';
import { ConnectedProgressBar, ConnectedPhotoCounter } from '../components/ui';

const ProgressSystemDemoScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const progressState = useAppSelector(selectProgress);
  const progressPercentage = useAppSelector(selectProgressPercentage);
  const isSessionActive = useAppSelector(selectIsSessionActive);
  
  const [autoIncrement, setAutoIncrement] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms

  const progressManager = ProgressManager.getInstance();

  // Auto-increment simulation
  useEffect(() => {
    if (!autoIncrement || !isSessionActive) return;

    const interval = setInterval(() => {
      if (progressState.current < progressState.total) {
        progressManager.incrementOverallProgress();
      } else {
        setAutoIncrement(false);
      }
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [autoIncrement, isSessionActive, progressState.current, progressState.total, simulationSpeed, progressManager]);

  // Event listeners for progress events
  useEffect(() => {
    const unsubscribe = progressManager.addListener((event) => {
      console.log('Progress Event:', event);
      
      if (event.type === 'category_completed') {
        Alert.alert(
          '🎉 Category Completed!',
          `Category ${event.payload.categoryId} has been completed!`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    });

    return unsubscribe;
  }, [progressManager]);

  const handleStartSession = () => {
    const sessionId = `demo_${Date.now()}`;
    const totalPhotos = 20;
    
    progressManager.startProgressSession(sessionId, totalPhotos);
    
    // Add some sample categories
    progressManager.updateCategoryProgress('favorites', 0, 5);
    progressManager.updateCategoryProgress('work', 0, 8);
    progressManager.updateCategoryProgress('family', 0, 7);
  };

  const handleEndSession = () => {
    progressManager.endProgressSession();
    setAutoIncrement(false);
  };

  const handleIncrement = () => {
    progressManager.incrementOverallProgress();
  };

  const handleDecrement = () => {
    progressManager.decrementOverallProgress();
  };

  const handleBatchUpdate = () => {
    // Simulate rapid batch updates
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        progressManager.incrementOverallProgress();
      }, i * 100);
    }
  };

  const handleCategoryUpdate = () => {
    // Simulate category progress updates
    const categories = ['favorites', 'work', 'family'];
    categories.forEach((categoryId, index) => {
      setTimeout(() => {
        const currentProgress = progressState.categories[categoryId] || { completed: 0, total: 5 };
        const newCompleted = Math.min(currentProgress.completed + 1, currentProgress.total);
        progressManager.updateCategoryProgress(categoryId, newCompleted, currentProgress.total);
      }, index * 200);
    });
  };

  const handleResetProgress = () => {
    dispatch(startSession({ sessionId: `demo_${Date.now()}`, total: 20 }));
  };

  const handleSpeedChange = (speed: number) => {
    setSimulationSpeed(speed);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>🔄 Progress System Demo</Text>
      <Text style={styles.subtitle}>Test real-time updates & animations</Text>

      {/* Progress Display */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Current Progress</Text>
        
        <ConnectedProgressBar
          height={8}
          fillColor="#00D68F"
          backgroundColor="rgba(255, 255, 255, 0.2)"
          showText
          textFormat="both"
          style={styles.progressBar}
        />
        
        <ConnectedPhotoCounter
          textColor="rgba(255, 255, 255, 0.9)"
          backgroundColor="rgba(0, 0, 0, 0.6)"
        />
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Percentage</Text>
            <Text style={styles.statValue}>{progressPercentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Session Active</Text>
            <Text style={[styles.statValue, { color: isSessionActive ? '#00D68F' : '#FF3D71' }]}>
              {isSessionActive ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Session ID</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {progressState.sessionId || 'None'}
            </Text>
          </View>
        </View>
      </View>

      {/* Session Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Controls</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleStartSession}
            disabled={isSessionActive}
          >
            <Text style={styles.buttonText}>Start Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleEndSession}
            disabled={!isSessionActive}
          >
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Progress</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleIncrement}
            disabled={!isSessionActive}
          >
            <Text style={styles.buttonText}>+1 Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleDecrement}
            disabled={!isSessionActive}
          >
            <Text style={styles.buttonText}>-1 Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Batch Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batch Updates</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleBatchUpdate}
            disabled={!isSessionActive}
          >
            <Text style={styles.buttonText}>+5 Rapid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleCategoryUpdate}
            disabled={!isSessionActive}
          >
            <Text style={styles.buttonText}>Update Categories</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto Simulation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto Simulation</Text>
        
        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Speed:</Text>
          {[2000, 1000, 500, 200].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                simulationSpeed === speed && styles.speedButtonActive
              ]}
              onPress={() => handleSpeedChange(speed)}
            >
              <Text style={[
                styles.speedButtonText,
                simulationSpeed === speed && styles.speedButtonTextActive
              ]}>
                {speed}ms
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.button,
            autoIncrement ? styles.dangerButton : styles.successButton
          ]}
          onPress={() => setAutoIncrement(!autoIncrement)}
          disabled={!isSessionActive}
        >
          <Text style={styles.buttonText}>
            {autoIncrement ? 'Stop Auto' : 'Start Auto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reset */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleResetProgress}
        >
          <Text style={styles.buttonText}>Reset Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Category Progress Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {Object.entries(progressState.categories).map(([categoryId, category]) => (
          <View key={categoryId} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{categoryId}</Text>
            <Text style={styles.categoryProgress}>
              {category.completed} / {category.total} ({((category.completed / category.total) * 100).toFixed(0)}%)
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressBar: {
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#00D68F',
  },
  dangerButton: {
    backgroundColor: '#FF3D71',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  speedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  speedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedButtonActive: {
    backgroundColor: '#007AFF',
  },
  speedButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  speedButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  categoryProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ProgressSystemDemoScreen; 