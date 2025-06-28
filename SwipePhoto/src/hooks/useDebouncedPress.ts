import { useRef, useCallback } from 'react';

/**
 * A custom hook to debounce a press handler.
 * Prevents a function from being called multiple times in rapid succession.
 * 
 * @param {() => void} onPress - The function to be called on press.
 * @param {number} delay - The debounce delay in milliseconds. Defaults to 1000ms.
 * @returns {() => void} - The debounced press handler.
 */
export const useDebouncedPress = (onPress: () => void, delay: number = 1000) => {
  const isDebouncing = useRef(false);

  return useCallback(() => {
    if (isDebouncing.current) {
      return;
    }
    
    isDebouncing.current = true;
    onPress();
    
    setTimeout(() => {
      isDebouncing.current = false;
    }, delay);
  }, [onPress, delay]);
}; 