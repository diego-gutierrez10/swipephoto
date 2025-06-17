/**
 * batchOrganizationMiddleware.ts
 * 
 * Redux middleware for batching organization-related actions to improve performance
 * when processing large numbers of photos or category updates.
 */

import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';

// Actions that should be batched
const BATCHABLE_ACTIONS = [
  'organization/addPhotoReference',
  'organization/updateCategoryCount',
  'organization/addMonthCategory',
  'organization/addSourceCategory',
  'organization/updateOrganizationProgress'
];

export interface BatchedAction {
  type: 'BATCHED_ORGANIZATION_ACTIONS';
  payload: {
    actions: AnyAction[];
    batchId: string;
    timestamp: number;
  };
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  enableBatching: boolean;
}

class BatchProcessor {
  private pendingActions: AnyAction[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private dispatch: Dispatch | null = null;
  
  constructor(config: BatchConfig) {
    this.config = config;
  }
  
  setDispatch(dispatch: Dispatch): void {
    this.dispatch = dispatch;
  }
  
  addAction(action: AnyAction): void {
    if (!this.config.enableBatching) {
      // If batching is disabled, dispatch immediately
      this.dispatch?.(action);
      return;
    }
    
    this.pendingActions.push(action);
    
    // Check if we should flush immediately
    if (this.pendingActions.length >= this.config.maxBatchSize) {
      this.flush();
    } else if (!this.batchTimeout) {
      // Set a timeout to flush pending actions
      this.batchTimeout = setTimeout(() => {
        this.flush();
      }, this.config.maxWaitTime);
    }
  }
  
  flush(): void {
    if (this.pendingActions.length === 0) return;
    
    const batchedAction: BatchedAction = {
      type: 'BATCHED_ORGANIZATION_ACTIONS',
      payload: {
        actions: [...this.pendingActions],
        batchId: this.generateBatchId(),
        timestamp: Date.now()
      }
    };
    
    // Clear pending actions and timeout
    this.pendingActions = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // Dispatch the batched action
    this.dispatch?.(batchedAction);
  }
  
  forceFlush(): void {
    this.flush();
  }
  
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create the batch organization middleware
 */
export const createBatchOrganizationMiddleware = (
  config: Partial<BatchConfig> = {}
): Middleware => {
  const defaultConfig: BatchConfig = {
    maxBatchSize: 50,
    maxWaitTime: 100, // 100ms
    enableBatching: true,
    ...config
  };
  
  const batchProcessor = new BatchProcessor(defaultConfig);
  
  const middleware: Middleware<{}, RootState> = 
    (store: MiddlewareAPI<Dispatch, RootState>) => 
    (next: Dispatch) => 
    (action: AnyAction) => {
      // Set the dispatch reference for the batch processor
      batchProcessor.setDispatch(next);
      
      // Handle batched actions
      if (action.type === 'BATCHED_ORGANIZATION_ACTIONS') {
        const batchedAction = action as BatchedAction;
        const startTime = performance.now();
        
        // Process all actions in the batch
        const results = batchedAction.payload.actions.map(batchedAction => {
          return next(batchedAction);
        });
        
        const processingTime = performance.now() - startTime;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processed batch ${batchedAction.payload.batchId}:`, {
            actionCount: batchedAction.payload.actions.length,
            processingTime: `${processingTime.toFixed(2)}ms`,
            actionsPerMs: (batchedAction.payload.actions.length / processingTime).toFixed(2)
          });
        }
        
        return results;
      }
      
      // Check if this action should be batched
      if (BATCHABLE_ACTIONS.includes(action.type)) {
        batchProcessor.addAction(action);
        return action; // Return the action for consistency
      }
      
      // For non-batchable actions, process normally
      return next(action);
    };
  
  // Add a way to access the batch processor for manual control
  (middleware as any).batchProcessor = batchProcessor;
  
  return middleware;
};

/**
 * Hook for manual batch control
 */
export const useBatchControl = () => {
  return {
    forceFlush: () => {
      // This would need to be connected to the actual middleware instance
      // For now, just a placeholder
      console.warn('forceFlush called but not connected to middleware instance');
    }
  };
};

/**
 * Action creator for manually triggering a batch flush
 */
export const flushOrganizationBatch = () => ({
  type: 'FLUSH_ORGANIZATION_BATCH' as const
});

/**
 * Enhanced middleware that also handles flush commands
 */
export const createEnhancedBatchMiddleware = (
  config: Partial<BatchConfig> = {}
): Middleware<{}, RootState> => {
  const baseMiddleware = createBatchOrganizationMiddleware(config);
  const batchProcessor = (baseMiddleware as any).batchProcessor as BatchProcessor;
  
  const enhancedMiddleware: Middleware<{}, RootState> = 
    (store: MiddlewareAPI<Dispatch, RootState>) => 
    (next: Dispatch) => 
    (action: AnyAction) => {
      // Handle flush commands
      if (action.type === 'FLUSH_ORGANIZATION_BATCH') {
        batchProcessor.forceFlush();
        return action;
      }
      
      // Pass through to base middleware
      return baseMiddleware(store)(next)(action);
    };
  
  return enhancedMiddleware;
};

/**
 * Performance monitoring utilities
 */
export const createPerformanceMonitor = () => {
  const metrics = {
    totalBatches: 0,
    totalActions: 0,
    totalProcessingTime: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0
  };
  
  const updateMetrics = (batchSize: number, processingTime: number) => {
    metrics.totalBatches++;
    metrics.totalActions += batchSize;
    metrics.totalProcessingTime += processingTime;
    metrics.averageBatchSize = metrics.totalActions / metrics.totalBatches;
    metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.totalBatches;
  };
  
  const getMetrics = () => ({ ...metrics });
  
  const resetMetrics = () => {
    Object.keys(metrics).forEach(key => {
      (metrics as any)[key] = 0;
    });
  };
  
  return {
    updateMetrics,
    getMetrics,
    resetMetrics
  };
}; 