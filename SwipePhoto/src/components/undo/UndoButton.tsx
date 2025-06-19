/**
 * UndoButton.tsx
 * 
 * Floating undo button component that appears in the bottom-right corner
 * when undo actions are available. Connects to Redux for state management.
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useUndo } from '../../hooks/useUndo';
import { HapticFeedbackService } from '../../services/HapticFeedbackService';

// Undo icon component (using a simple Unicode arrow for now)
const UndoIcon: React.FC<{ size?: number; color?: string; disabled?: boolean }> = ({ 
  size = 24, 
  color = '#FFFFFF',
  disabled = false 
}) => {
  // Simple text-based undo icon - could be replaced with react-native-vector-icons
  const iconStyle = {
    fontSize: size,
    color: disabled ? '#666666' : color,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    lineHeight: size,
  };

  return (
    <Animated.Text style={iconStyle} accessible={false}>
      ↶
    </Animated.Text>
  );
};

interface UndoButtonProps {
  /**
   * Custom positioning overrides
   */
  position?: {
    bottom?: number;
    right?: number;
  };
  
  /**
   * Custom size override
   */
  size?: number;
  
  /**
   * Custom styling
   */
  style?: ViewStyle;
  
  /**
   * Whether to use haptic feedback on press
   */
  enableHaptics?: boolean;
  
  /**
   * Test identifier for testing
   */
  testID?: string;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
  position,
  size,
  style,
  enableHaptics = true,
  testID = 'undo-button',
}) => {
  const { width, height } = useWindowDimensions();
  
  // Connect to undo functionality
  const {
    canUndo,
    undoCount,
    undo,
    lastAction,
  } = useUndo();

  // Handle undo action with haptic feedback
  const handleUndo = useCallback(async () => {
    if (!canUndo) return;

    // Provide haptic feedback
    if (enableHaptics) {
      try {
        await HapticFeedbackService.triggerDeleteFeedback(); // Medium intensity for undo action
      } catch (error) {
        // Haptic feedback is optional, fail silently
        console.warn('🔄 UndoButton: Haptic feedback failed:', error);
      }
    }

    // Perform undo
    const undoneAction = undo();
    
    if (undoneAction && __DEV__) {
      console.log('🔄 UndoButton: Undo performed', {
        actionId: undoneAction.id,
        photoId: undoneAction.photoId,
        direction: undoneAction.direction,
        remainingCount: undoCount - 1,
      });
    }
  }, [canUndo, undo, undoCount, enableHaptics]);

  // Calculate responsive size based on screen dimensions
  const responsiveSize = size || (width < 768 ? 48 : 56);
  const responsiveBottom = position?.bottom || (width < 768 ? 16 : 24);
  const responsiveRight = position?.right || (width < 768 ? 16 : 24);

  // Don't render if no undo actions are available
  if (!canUndo) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: responsiveSize,
          height: responsiveSize,
          borderRadius: responsiveSize / 2,
          bottom: responsiveBottom,
          right: responsiveRight,
        },
        style,
      ]}
      onPress={handleUndo}
      disabled={!canUndo}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Undo last action${lastAction ? `: ${lastAction.direction} swipe on photo ${lastAction.photoId}` : ''}`}
      accessibilityHint={`Undoes your last swipe action. ${undoCount} action${undoCount !== 1 ? 's' : ''} available to undo.`}
      accessibilityState={{
        disabled: !canUndo,
      }}
      testID={testID}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch target
    >
      <UndoIcon 
        size={responsiveSize * 0.4} 
        color="#FFFFFF"
        disabled={!canUndo}
      />
      
      {/* Optional: Add badge showing undo count */}
      {undoCount > 1 && (
        <Animated.View style={styles.badge}>
          <Animated.Text style={styles.badgeText}>
            {undoCount}
          </Animated.Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#007AFF', // iOS blue for primary action
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000, // Ensure it's above other elements
    
    // Platform-specific adjustments
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30', // Red badge for count
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UndoButton; 