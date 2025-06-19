/**
 * CategoryProgressTracker.tsx
 * 
 * Container component that displays multiple category indicators
 * showing completion status across different photo categories.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import CategoryIndicator, { CategoryStatus } from './CategoryIndicator';
import type { Category } from '../../types/models/Category';

export interface CategoryProgress {
  category: Category;
  status: CategoryStatus;
  completedCount: number;
  totalCount: number;
}

export interface CategoryProgressTrackerProps {
  categories: CategoryProgress[];
  title?: string;
  style?: ViewStyle;
  horizontal?: boolean;
  showTitle?: boolean;
  onCategoryPress?: (categoryId: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export const CategoryProgressTracker: React.FC<CategoryProgressTrackerProps> = ({
  categories,
  title = 'Category Progress',
  style,
  horizontal = false,
  showTitle = true,
  onCategoryPress,
  accessibilityLabel,
  testID,
}) => {
  // Calculate overall progress stats
  const totalPhotos = categories.reduce((sum, cat) => sum + cat.totalCount, 0);
  const completedPhotos = categories.reduce((sum, cat) => sum + cat.completedCount, 0);
  const overallPercentage = totalPhotos > 0 ? Math.round((completedPhotos / totalPhotos) * 100) : 0;
  
  const completedCategories = categories.filter(cat => cat.status === 'completed').length;
  const currentCategories = categories.filter(cat => cat.status === 'current').length;

  const renderCategoryIndicator = (categoryProgress: CategoryProgress, index: number) => (
    <CategoryIndicator
      key={categoryProgress.category.id}
      categoryName={categoryProgress.category.name}
      categoryColor={categoryProgress.category.color}
      status={categoryProgress.status}
      photoCount={categoryProgress.totalCount}
      completedCount={categoryProgress.completedCount}
      onPress={onCategoryPress ? () => onCategoryPress(categoryProgress.category.id) : undefined}
      style={horizontal ? styles.horizontalIndicator : undefined}
      testID={`category-indicator-${index}`}
    />
  );

  return (
    <View 
      style={[styles.container, style]}
      accessibilityLabel={
        accessibilityLabel || 
        `Category progress tracker, ${completedCategories} completed, ${currentCategories} in progress`
      }
      testID={testID}
    >
      {/* Header */}
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {completedPhotos}/{totalPhotos} photos ({overallPercentage}%)
            </Text>
            <Text style={styles.categoriesStats}>
              {completedCategories}/{categories.length} categories completed
            </Text>
          </View>
        </View>
      )}

      {/* Overall Progress Bar */}
      <View style={styles.overallProgressContainer}>
        <View style={styles.overallProgressBackground}>
          <View 
            style={[
              styles.overallProgressFill,
              { width: `${overallPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Category Indicators */}
      {horizontal ? (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {categories.map(renderCategoryIndicator)}
        </ScrollView>
      ) : (
        <View style={styles.verticalContainer}>
          {categories.map(renderCategoryIndicator)}
        </View>
      )}

      {/* Empty State */}
      {categories.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No categories to track</Text>
          <Text style={styles.emptyStateSubtext}>
            Start organizing photos to see progress here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  categoriesStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  overallProgressContainer: {
    marginBottom: 16,
  },
  overallProgressBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#00D68F',
    borderRadius: 3,
  },
  verticalContainer: {
    gap: 8,
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  horizontalIndicator: {
    minWidth: 200,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default CategoryProgressTracker; 