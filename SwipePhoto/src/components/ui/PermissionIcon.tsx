import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { PermissionStatus } from '../../types';

interface PermissionIconProps {
  status: PermissionStatus;
  size?: number;
  animated?: boolean;
}

/**
 * Icon component that displays different icons based on permission status
 */
export const PermissionIcon: React.FC<PermissionIconProps> = ({
  status,
  size = 64,
  animated = false,
}) => {
  const getIconConfig = () => {
    switch (status) {
      case 'granted':
        return {
          name: 'checkmark-circle' as const,
          color: colors.success,
          backgroundColor: colors.surfaceSecondary,
        };
      case 'limited':
        return {
          name: 'albums' as const,
          color: colors.warning,
          backgroundColor: colors.surfaceSecondary,
        };
      case 'denied':
        return {
          name: 'close-circle' as const,
          color: colors.error,
          backgroundColor: colors.surfaceSecondary,
        };
      case 'blocked':
        return {
          name: 'lock-closed' as const,
          color: colors.error,
          backgroundColor: colors.surfaceSecondary,
        };
      case 'unavailable':
        return {
          name: 'help-circle' as const,
          color: colors.textSecondary,
          backgroundColor: colors.surface,
        };
      default: // undetermined
        return {
          name: 'images' as const,
          color: colors.primary,
          backgroundColor: colors.surfaceSecondary,
        };
    }
  };

  const { name, color, backgroundColor } = getIconConfig();
  const iconSize = size * 0.6;

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
      }
    ]}>
      <Ionicons
        name={name}
        size={iconSize}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default PermissionIcon; 