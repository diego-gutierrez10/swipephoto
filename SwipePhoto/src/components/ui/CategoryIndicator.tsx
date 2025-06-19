/**
 * CategoryIndicator.tsx
 * 
 * Individual category completion indicator component showing status
 * with distinct visual cues for completed, current, and upcoming states.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';

export type CategoryStatus = 'completed' | 'current' | 'upcoming';

export interface CategoryIndicatorProps {
  categoryName: string;
  categoryColor: string;
  status: CategoryStatus;
  photoCount?: number;
  completedCount?: number;
  onPress?: () => void;
  style?: ViewStyle;
  showPhotoCount?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const CategoryIndicator: React.FC<CategoryIndicatorProps> = ({
  categoryName,
  categoryColor,
  status,
  photoCount = 0,
  completedCount = 0,
  onPress,
  style,
  showPhotoCount = true,
  accessibilityLabel,
  testID,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  // Animate when status changes
  useEffect(() => {
    if (status === 'completed') {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnimation, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [status, scaleAnimation, opacityAnimation]);

  // Get colors based on status
  const getColors = () => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: '#00D68F', // Green for completed
          borderColor: '#00A86B',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'current':
        return {
          backgroundColor: categoryColor, // Use category color for current
          borderColor: categoryColor,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'upcoming':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Gray for upcoming
          borderColor: 'rgba(255, 255, 255, 0.3)',
          textColor: 'rgba(255, 255, 255, 0.7)',
          iconColor: 'rgba(255, 255, 255, 0.5)',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          textColor: 'rgba(255, 255, 255, 0.7)',
          iconColor: 'rgba(255, 255, 255, 0.5)',
        };
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'current':
        return '▶';
      case 'upcoming':
        return '○';
      default:
        return '○';
    }
  };

  // Calculate completion percentage
  const completionPercentage = photoCount > 0 ? Math.round((completedCount / photoCount) * 100) : 0;

  const colors = getColors();
  const statusIcon = getStatusIcon();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        { 
          opacity: opacityAnimation,
          transform: [{ scale: scaleAnimation }] 
        },
        style,
      ]}
    >
      <Component
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
          },
        ]}
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={
          accessibilityLabel || 
          `${categoryName} category, ${status}, ${showPhotoCount ? `${completedCount} of ${photoCount} photos` : ''}`
        }
        testID={testID}
      >
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          <Text style={[styles.statusIcon, { color: colors.iconColor }]}>
            {statusIcon}
          </Text>
        </View>

        {/* Category Info */}
        <View style={styles.infoContainer}>
          <Text 
            style={[styles.categoryName, { color: colors.textColor }]}
            numberOfLines={1}
          >
            {categoryName}
          </Text>
          
          {showPhotoCount && (
            <Text style={[styles.photoCount, { color: colors.textColor }]}>
              {completedCount}/{photoCount} ({completionPercentage}%)
            </Text>
          )}
        </View>

        {/* Progress Indicator */}
        {status === 'current' && photoCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${completionPercentage}%`,
                    backgroundColor: colors.textColor,
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </Component>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  photoCount: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  progressContainer: {
    marginLeft: 8,
    width: 40,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default CategoryIndicator; 