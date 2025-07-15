import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ProgressBar } from '../ui/ProgressBar';
import { Photo } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface MainSwipeFooterProps {
  keepCount?: number;
  deleteCount?: number;
  onUndo?: () => void;
  currentPhoto?: Photo | null;
  isLoadingMore?: boolean; // NEW: Show loading indicator when loading more photos
}

// Helper to format bytes into KB, MB, etc.
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const MainSwipeFooter: React.FC<MainSwipeFooterProps> = ({
  keepCount = 0,
  deleteCount = 0,
  onUndo,
  currentPhoto,
  isLoadingMore = false, // NEW: Default to false
}) => {



  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      console.log('Undo last action');
    }
  };

  return (
    <View style={styles.container}>
      {/* Photo Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          {currentPhoto?.createdAt ? new Date(currentPhoto.createdAt).toLocaleDateString() : ''}
        </Text>
        <View style={styles.rightInfo}>
          {isLoadingMore && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          )}
          <Text style={styles.infoText}>
            {currentPhoto?.size ? formatBytes(currentPhoto.size) : ''}
          </Text>
        </View>
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <ProgressBar 
          keepCount={keepCount}
          deleteCount={deleteCount}
          width={screenWidth * 0.9}
        />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120, // Increased height for new info section
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between', // Distribute content
    width: '100%', // Ensure it takes full width
    zIndex: 10, // Ensure footer is above the content
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  countersSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default MainSwipeFooter; 