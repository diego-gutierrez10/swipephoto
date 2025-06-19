/**
 * CategoryProgressDemoScreen.tsx
 * 
 * Demo screen showing CategoryProgressTracker component in action
 * for Task 8.3 - Develop Category Completion Indicators
 */

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CategoryProgressTracker } from '../components/ui';
import { useCategoryProgress } from '../hooks';

interface CategoryProgressDemoScreenProps {
  navigation?: any;
}

export const CategoryProgressDemoScreen: React.FC<CategoryProgressDemoScreenProps> = ({ 
  navigation 
}) => {
  const { 
    categoryProgress, 
    updateCategoryProgress, 
    totalPhotos, 
    completedPhotos, 
    overallPercentage 
  } = useCategoryProgress();

  const handleCategoryPress = (categoryId: string) => {
    const category = categoryProgress.find(cp => cp.category.id === categoryId);
    if (category) {
      Alert.alert(
        `${category.category.name} Category`,
        `Status: ${category.status}\nProgress: ${category.completedCount}/${category.totalCount} photos\nDescription: ${category.category.description}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Progress', 
            onPress: () => {
              // Simulate adding 5 photos of progress
              const newCompleted = Math.min(
                category.completedCount + 5, 
                category.totalCount
              );
              updateCategoryProgress(categoryId, newCompleted);
            }
          },
        ]
      );
    }
  };

  const handleSimulateProgress = () => {
    // Simulate random progress across categories
    categoryProgress.forEach(cp => {
      if (cp.status !== 'completed') {
        const randomProgress = Math.floor(Math.random() * 10) + 1;
        const newCompleted = Math.min(
          cp.completedCount + randomProgress,
          cp.totalCount
        );
        updateCategoryProgress(cp.category.id, newCompleted);
      }
    });
  };

  const handleResetProgress = () => {
    // Reset all categories except the first one
    categoryProgress.forEach((cp, index) => {
      if (index === 0) {
        // Keep first category completed
        updateCategoryProgress(cp.category.id, cp.totalCount);
      } else if (index === 1) {
        // Reset second to partial progress
        updateCategoryProgress(cp.category.id, Math.floor(cp.totalCount * 0.3));
      } else {
        // Reset others to upcoming
        updateCategoryProgress(cp.category.id, 0);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Category Progress Demo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Overall Progress</Text>
          <Text style={styles.statsText}>
            {completedPhotos} / {totalPhotos} photos ({overallPercentage}%)
          </Text>
          <Text style={styles.statsSubtext}>
            {categoryProgress.filter(cp => cp.status === 'completed').length} categories completed
          </Text>
        </View>

        {/* Vertical Layout Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vertical Layout</Text>
          <CategoryProgressTracker
            categories={categoryProgress}
            title="Photo Organization Progress"
            onCategoryPress={handleCategoryPress}
            testID="vertical-category-tracker"
          />
        </View>

        {/* Horizontal Layout Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horizontal Layout</Text>
          <CategoryProgressTracker
            categories={categoryProgress}
            title="Quick Category Overview"
            horizontal={true}
            onCategoryPress={handleCategoryPress}
            testID="horizontal-category-tracker"
          />
        </View>

        {/* Compact Layout (No Title) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compact Layout</Text>
          <CategoryProgressTracker
            categories={categoryProgress}
            showTitle={false}
            onCategoryPress={handleCategoryPress}
            style={styles.compactTracker}
            testID="compact-category-tracker"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSimulateProgress}
          >
            <Text style={styles.actionButtonText}>🚀 Simulate Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleResetProgress}
          >
            <Text style={styles.actionButtonText}>🔄 Reset Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionsText}>
            • Tap any category to view details and add progress{'\n'}
            • Use "Simulate Progress" to see animations{'\n'}
            • Watch for color changes: Gray → Category Color → Green{'\n'}
            • Notice the completion animations when categories finish{'\n'}
            • Scroll horizontally in the horizontal layout
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#00D68F',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsText: {
    color: '#00D68F',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingLeft: 4,
  },
  compactTracker: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00D68F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3D71',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginBottom: 32,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CategoryProgressDemoScreen; 