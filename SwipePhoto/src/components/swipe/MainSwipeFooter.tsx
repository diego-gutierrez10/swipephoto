import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface MainSwipeFooterProps {
  keepCount?: number;
  deleteCount?: number;
  totalPhotos?: number;
  currentPhoto?: number;
  onUndo?: () => void;
  onSkip?: () => void;
}

export const MainSwipeFooter: React.FC<MainSwipeFooterProps> = ({
  keepCount = 0,
  deleteCount = 0,
  totalPhotos = 100,
  currentPhoto = 1,
  onUndo,
  onSkip,
}) => {
  const progress = totalPhotos > 0 ? (currentPhoto / totalPhotos) * 100 : 0;
  const processedCount = keepCount + deleteCount;

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      console.log('Undo last action');
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      console.log('Skip current photo');
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentPhoto} of {totalPhotos}
        </Text>
      </View>

      {/* Counters Section */}
      <View style={styles.countersSection}>
        <View style={styles.counterItem}>
          <Text style={styles.counterIcon}>✓</Text>
          <Text style={styles.counterLabel}>Keep</Text>
          <Text style={styles.counterValue}>{keepCount}</Text>
        </View>
        
        <View style={styles.counterItem}>
          <Text style={styles.counterIcon}>✕</Text>
          <Text style={styles.counterLabel}>Delete</Text>
          <Text style={styles.counterValue}>{deleteCount}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleUndo}
          accessibilityRole="button"
          accessibilityLabel="Undo last action"
          disabled={processedCount === 0}
        >
          <Text style={[
            styles.actionButtonText,
            processedCount === 0 && styles.disabledText
          ]}>
            Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip current photo"
        >
          <Text style={styles.actionButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent to not distract
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    width: screenWidth * 0.6,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  countersSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  counterIcon: {
    fontSize: 16,
    marginRight: 4,
    color: '#fff',
  },
  counterLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 4,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 12,
    bottom: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    minWidth: 44, // Minimum touch target
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default MainSwipeFooter; 