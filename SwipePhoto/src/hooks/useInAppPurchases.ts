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

export interface UseInAppPurchasesResult {
  isInitialized: boolean;
  products: SubscriptionProduct[];
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  purchaseSubscription: (sku: SubscriptionSKU) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  // New convenience methods
  isSubscribed: boolean;
  setUserId: (userId: string) => Promise<void>;
  clearUserId: () => Promise<void>;
}

export const useInAppPurchases = (userId?: string): UseInAppPurchasesResult => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ isSubscribed: false });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        const initialized = await inAppPurchaseService.initialize(userId);
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
  }, [userId]);

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
        // Poll for subscription status
        const isSubscribed = await inAppPurchaseService.pollForSubscriptionStatus();
        
        if (isSubscribed) {
          const status = await inAppPurchaseService.getSubscriptionStatus();
          setSubscriptionStatus(status);
          return true;
        } else {
          Alert.alert('Error en la compra', 'Subscription not active after purchase');
          return false;
        }
      } else {
        Alert.alert('Error en la compra', result.error || 'Ha ocurrido un error desconocido');
        return false;
      }
    } catch (error) {
      console.error('useInAppPurchases: Purchase failed', error);
      Alert.alert('Error', 'No se pudo completar la compra');
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
        
        Alert.alert('¡Éxito!', '¡Compras restauradas correctamente!');
        return true;
      } else {
        Alert.alert('Sin compras', 'No se encontraron compras anteriores para restaurar');
        return false;
      }
    } catch (error) {
      console.error('useInAppPurchases: Restore failed', error);
      Alert.alert('Error', 'No se pudieron restaurar las compras');
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

  // Set user ID for RevenueCat tracking
  const setUserId = useCallback(async (userId: string): Promise<void> => {
    if (!isInitialized) return;

    try {
      await inAppPurchaseService.setUserId(userId);
      // Refresh status after setting user ID
      await refreshStatus();
    } catch (error) {
      console.error('useInAppPurchases: Failed to set user ID', error);
    }
  }, [isInitialized, refreshStatus]);

  // Clear user ID
  const clearUserId = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;

    try {
      await inAppPurchaseService.clearUserId();
      // Refresh status after clearing user ID
      await refreshStatus();
    } catch (error) {
      console.error('useInAppPurchases: Failed to clear user ID', error);
    }
  }, [isInitialized, refreshStatus]);

  return {
    isInitialized,
    products,
    subscriptionStatus,
    isLoading,
    purchaseSubscription,
    restorePurchases,
    refreshStatus,
    // New convenience methods
    isSubscribed: subscriptionStatus.isSubscribed,
    setUserId,
    clearUserId,
  };
};