import React, { createContext, useContext, ReactNode } from 'react';
import { useInAppPurchases as useInAppPurchasesHook, UseInAppPurchasesResult } from '../hooks/useInAppPurchases';

// Create a context with a default undefined value
const SubscriptionContext = createContext<UseInAppPurchasesResult | undefined>(undefined);

// Create a provider component
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const purchases = useInAppPurchasesHook();
  return (
    <SubscriptionContext.Provider value={purchases}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Create a custom hook to use the context
export const useSubscription = (): UseInAppPurchasesResult => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within an SubscriptionProvider');
  }
  return context;
}; 