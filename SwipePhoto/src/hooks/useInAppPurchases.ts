import { useState, useEffect, useCallback } from 'react';
import { 
  inAppPurchaseService,
  type SubscriptionProduct,
  type PurchaseResult,
  type SubscriptionStatus,
  type SubscriptionSKU,
  SUBSCRIPTION_SKUS
} from '../services/InAppPurchaseService';
import { Alert } from 'react-native';

interface UseInAppPurchasesResult {
  isInitialized: boolean;
  products: SubscriptionProduct[];
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  purchaseSubscription: (sku: SubscriptionSKU) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export const useInAppPurchases = (): UseInAppPurchasesResult => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ isSubscribed: false });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        const initialized = await inAppPurchaseService.initialize();
        setIsInitialized(initialized);
        
        if (initialized) {
          // Load products and subscription status
          const availableProducts = inAppPurchaseService.getProducts();
          setProducts(availableProducts);
          
          const status = await inAppPurchaseService.getSubscriptionStatus();
          setSubscriptionStatus(status);
        }
      } catch (error) {
        console.error('useInAppPurchases: Failed to initialize', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      inAppPurchaseService.disconnect();
    };
  }, []);

  // Purchase subscription function
  const purchaseSubscription = useCallback(async (sku: SubscriptionSKU): Promise<boolean> => {
    if (!isInitialized) {
      Alert.alert('Error', 'Purchase service not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      const result: PurchaseResult = await inAppPurchaseService.purchaseSubscription(sku);
      
      if (result.success) {
        // Refresh subscription status
        const status = await inAppPurchaseService.getSubscriptionStatus();
        setSubscriptionStatus(status);
        
        Alert.alert('Success', 'Subscription purchased successfully!');
        return true;
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unknown error occurred');
        return false;
      }
    } catch (error) {
      console.error('useInAppPurchases: Purchase failed', error);
      Alert.alert('Error', 'Failed to complete purchase');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Restore purchases function
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      Alert.alert('Error', 'Purchase service not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      const result: PurchaseResult = await inAppPurchaseService.restorePurchases();
      
      if (result.success) {
        // Refresh subscription status
        const status = await inAppPurchaseService.getSubscriptionStatus();
        setSubscriptionStatus(status);
        
        Alert.alert('Success', 'Purchases restored successfully!');
        return true;
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore');
        return false;
      }
    } catch (error) {
      console.error('useInAppPurchases: Restore failed', error);
      Alert.alert('Error', 'Failed to restore purchases');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Refresh subscription status
  const refreshStatus = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;

    try {
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('useInAppPurchases: Failed to refresh status', error);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    products,
    subscriptionStatus,
    isLoading,
    purchaseSubscription,
    restorePurchases,
    refreshStatus,
  };
};