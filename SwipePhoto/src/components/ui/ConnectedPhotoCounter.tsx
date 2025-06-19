import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store';
import { selectProgress } from '../../store/slices/progressSlice';
import { PhotoCounter } from './PhotoCounter';
import { animateValue, easingFunctions } from '../../utils/animations';

interface ConnectedPhotoCounterProps {
  // Allow overriding if needed, but defaults come from Redux
  current?: number;
  total?: number;
  textColor?: string;
  backgroundColor?: string;
  testID?: string;
  // Animation config
  animationDuration?: number;
  enableSmoothUpdates?: boolean;
}

/**
 * Redux-connected PhotoCounter that automatically syncs with progress state
 * Features smooth animations when photo index changes
 */
export const ConnectedPhotoCounter: React.FC<ConnectedPhotoCounterProps> = ({
  current: overrideCurrent,
  total: overrideTotal,
  textColor = 'rgba(255, 255, 255, 0.9)',
  backgroundColor = 'rgba(0, 0, 0, 0.6)',
  testID = 'connected-photo-counter',
  animationDuration = 150,
  enableSmoothUpdates = true,
}) => {
  // Get progress from Redux store
  const progressState = useAppSelector(selectProgress);
  
  // Use override values if provided, otherwise use Redux state
  const current = overrideCurrent ?? progressState.current;
  const total = overrideTotal ?? progressState.total;
  
  // Smooth animation state for counter changes
  const animatedIndexRef = useRef(current);
  const [animatedIndex, setAnimatedIndex] = React.useState(current);
  
  // Cancel function for ongoing animations
  const cancelAnimationRef = useRef<(() => void) | null>(null);

  // Handle smooth counter updates
  useEffect(() => {
    if (!enableSmoothUpdates) {
      setAnimatedIndex(current);
      return;
    }

    // Cancel previous animation if running
    if (cancelAnimationRef.current) {
      cancelAnimationRef.current();
    }

    const startValue = animatedIndexRef.current;
    const endValue = current;

    if (Math.abs(endValue - startValue) < 0.1) {
      // Skip animation for very small changes or same value
      setAnimatedIndex(current);
      animatedIndexRef.current = current;
      return;
    }

    // Start smooth animation for counter
    cancelAnimationRef.current = animateValue(
      startValue,
      endValue,
      {
        duration: animationDuration,
        easing: easingFunctions.easeOutCubic,
        onUpdate: (value) => {
          animatedIndexRef.current = value;
          // Round to whole numbers for display to avoid precision issues
          const roundedValue = Math.round(value);
          setAnimatedIndex(roundedValue);
        },
        onComplete: () => {
          animatedIndexRef.current = endValue;
          setAnimatedIndex(endValue);
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

  // Show session status
  const isSessionActive = Boolean(progressState.sessionId);
  
  // Only show counter if there's an active session and photos to count
  if (!isSessionActive || total === 0) {
    return null;
  }

  // Ensure safe integer values
  const safeCurrent = Math.max(0, Math.round(enableSmoothUpdates ? animatedIndex : current));
  const safeTotal = Math.max(1, total);

  return (
    <PhotoCounter
      current={safeCurrent}
      total={safeTotal}
      textColor={textColor}
      backgroundColor={backgroundColor}
      testID={testID}
    />
  );
};

export default ConnectedPhotoCounter; 