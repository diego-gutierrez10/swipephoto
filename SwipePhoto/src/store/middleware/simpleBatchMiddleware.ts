/**
 * simpleBatchMiddleware.ts
 * 
 * Simplified Redux middleware for batching organization actions
 */

import { Middleware } from '@reduxjs/toolkit';

// Create a simple batch middleware without circular dependencies
export const createEnhancedBatchMiddleware = (): Middleware => {
  const pendingActions: any[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  
  const flushBatch = (dispatch: any) => {
    if (pendingActions.length === 0) return;
    
    // Process all pending actions
    const actionsToProcess = [...pendingActions];
    pendingActions.length = 0; // Clear array
    
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    
    // Process each action
    actionsToProcess.forEach(action => {
      dispatch(action);
    });
    
    // Log in development
    if (__DEV__) {
      console.log(`Batch processed ${actionsToProcess.length} organization actions`);
    }
  };
  
  const middleware: Middleware = (store) => (next) => (action: any) => {
    // Actions that should be batched
    const batchableActions = [
      'organization/addPhotoReference',
      'organization/updateCategoryCount', 
      'organization/addMonthCategory',
      'organization/addSourceCategory',
      'organization/updateProgress'
    ];
    
    // Check if this action should be batched
    if (batchableActions.includes(action.type)) {
      pendingActions.push(action);
      
      // Set timeout to flush if not already set
      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          flushBatch(next);
        }, 50); // 50ms batch window
      }
      
      // Flush immediately if batch gets too large
      if (pendingActions.length >= 25) {
        flushBatch(next);
      }
      
      return action;
    }
    
    // Handle manual flush
    if (action.type === 'FLUSH_ORGANIZATION_BATCH') {
      flushBatch(next);
      return action;
    }
    
    // For non-batchable actions, process normally
    return next(action);
  };
  
  return middleware;
}; 