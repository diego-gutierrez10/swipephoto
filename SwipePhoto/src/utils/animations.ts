/**
 * Animation utilities for smooth progress updates and transitions
 */

export interface AnimationConfig {
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
  onUpdate?: (value: number) => void;
}

/**
 * Easing functions for smooth animations
 */
export const easingFunctions = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  linear: (t: number): number => t,
};

/**
 * Animate a numeric value from start to end with easing
 */
export const animateValue = (
  start: number,
  end: number,
  config: AnimationConfig = {}
): () => void => {
  const {
    duration = 300,
    easing = easingFunctions.easeOutCubic,
    onComplete,
    onUpdate,
  } = config;

  let animationId: number;
  let cancelled = false;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    if (cancelled) return;

    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = start + (end - start) * easedProgress;

    onUpdate?.(currentValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    cancelled = true;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
};

/**
 * Debounce function for limiting update frequency
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for limiting update frequency
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Schedule function to run on next frame for smooth animations
 */
export const scheduleOnNextFrame = (callback: () => void): number => {
  return requestAnimationFrame(callback);
};

/**
 * Chain multiple animations sequentially
 */
export const chainAnimations = (animations: (() => Promise<void>)[]): Promise<void> => {
  return animations.reduce((chain, animation) => 
    chain.then(() => animation()), Promise.resolve());
};

/**
 * CSS class names for optimized animations
 */
export const animationClasses = {
  willChange: 'will-change-transform',
  gpuAccelerated: 'transform-gpu',
  smooth: 'transition-all duration-300 ease-out',
} as const;

/**
 * Performance-optimized animation frame loop
 */
export class AnimationLoop {
  private isRunning = false;
  private callbacks: Set<() => void> = new Set();
  private animationId?: number;

  add(callback: () => void): () => void {
    this.callbacks.add(callback);
    if (!this.isRunning) {
      this.start();
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    this.isRunning = true;
    this.loop();
  }

  private stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    for (const callback of this.callbacks) {
      callback();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };
}

// Global animation loop instance
export const globalAnimationLoop = new AnimationLoop(); 