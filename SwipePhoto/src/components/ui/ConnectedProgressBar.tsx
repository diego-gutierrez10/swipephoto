import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store';
import { selectProgressPercentage, selectProgress, ProgressState } from '../../store/slices/progressSlice';
import { ProgressBar, ProgressBarProps } from './ProgressBar';
import { animateValue, easingFunctions } from '../../utils/animations';

interface ConnectedProgressBarProps extends Omit<ProgressBarProps, 'current' | 'total'> {
  // Allow overriding if needed, but defaults come from Redux
  current?: number;
  total?: number;
  // Animation config
  animationDuration?: number;
  enableSmoothUpdates?: boolean;
}

/**
 * Redux-connected ProgressBar that automatically syncs with progress state
 * Features smooth animations and real-time updates
 */
export const ConnectedProgressBar: React.FC<ConnectedProgressBarProps> = ({
  current: overrideCurrent,
  total: overrideTotal,
  animationDuration = 300,
  enableSmoothUpdates = true,
  ...progressBarProps
}) => {
  // Get progress from Redux store
  const progressState = useAppSelector(selectProgress);
  const progressPercentage = useAppSelector(selectProgressPercentage);
  
  // Use override values if provided, otherwise use Redux state
  const current = overrideCurrent ?? progressState.current;
  const total = overrideTotal ?? progressState.total;
  
  // Smooth animation state
  const animatedCurrentRef = useRef(current);
  const [animatedCurrent, setAnimatedCurrent] = React.useState(current);
  
  // Cancel function for ongoing animations
  const cancelAnimationRef = useRef<(() => void) | null>(null);

  // Handle smooth progress updates
  useEffect(() => {
    if (!enableSmoothUpdates) {
      setAnimatedCurrent(current);
      return;
    }

    // Cancel previous animation if running
    if (cancelAnimationRef.current) {
      cancelAnimationRef.current();
    }

    const startValue = animatedCurrentRef.current;
    const endValue = current;

    if (Math.abs(endValue - startValue) < 0.1) {
      // Skip animation for very small changes
      setAnimatedCurrent(current);
      animatedCurrentRef.current = current;
      return;
    }

    // Start smooth animation
    cancelAnimationRef.current = animateValue(
      startValue,
      endValue,
      {
        duration: animationDuration,
        easing: easingFunctions.easeOutCubic,
        onUpdate: (value) => {
          animatedCurrentRef.current = value;
          // Round to avoid precision issues with React Native Animated
          const roundedValue = Math.round(value * 1000) / 1000; // Round to 3 decimal places
          setAnimatedCurrent(roundedValue);
        },
        onComplete: () => {
          animatedCurrentRef.current = endValue;
          setAnimatedCurrent(endValue);
          cancelAnimationRef.current = null;
        },
      }
    );

    // Cleanup function
    return () => {
      if (cancelAnimationRef.current) {
        cancelAnimationRef.current();
        cancelAnimationRef.current = null;
      }
    };
  }, [current, enableSmoothUpdates, animationDuration]);

  // Show session status in accessibility label
  const isSessionActive = Boolean(progressState.sessionId);
  const accessibilityLabel = progressBarProps.accessibilityLabel || 
    `${isSessionActive ? 'Active session' : 'No active session'}: Progress ${current} of ${total} completed`;

  // Ensure integer values for React Native Animated compatibility
  const safeAnimatedCurrent = Math.max(0, Math.round((enableSmoothUpdates ? animatedCurrent : current) * 100) / 100);
  const safeTotal = Math.max(1, total); // Avoid division by zero

  return (
    <ProgressBar
      {...progressBarProps}
      current={safeAnimatedCurrent}
      total={safeTotal}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

export default ConnectedProgressBar; 