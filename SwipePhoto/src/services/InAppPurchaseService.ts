import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  requestSubscription,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Product,
  type ProductPurchase,
  type SubscriptionPurchase,
  type PurchaseError,
} from 'react-native-iap';
import { Platform, EmitterSubscription } from 'react-native';

// Configuration for the subscription products
export const SUBSCRIPTION_SKUS = {
  YEARLY: 'com.diegogutierrez.swipephoto.pro.Yearly',
  MONTHLY: 'com.diegogutierrez.swipephoto.pro.Monthly', 
  WEEKLY: 'com.diegogutierrez.swipephoto.pro.Weekly',
} as const;

export type SubscriptionSKU = typeof SUBSCRIPTION_SKUS[keyof typeof SUBSCRIPTION_SKUS];

export interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  activeSubscription?: string;
  expirationDate?: Date;
}

class InAppPurchaseService {
  private isInitialized = false;
  private products: SubscriptionProduct[] = [];
  private purchaseUpdateSubscription: EmitterSubscription | null = null;
  private purchaseErrorSubscription: EmitterSubscription | null = null;
  private pendingPurchaseResolve: ((result: PurchaseResult) => void) | null = null;

  /**
   * Initialize the in-app purchase service
   */
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('InAppPurchaseService: Only iOS is supported');
        return false;
      }

      if (this.isInitialized) {
        return true;
      }

      // Initialize connection to the store
      const result = await initConnection();
      console.log('InAppPurchaseService: Connected to App Store', result);

      // Set up purchase listeners
      this.setupPurchaseListeners();

      // Load products
      await this.loadProducts();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('InAppPurchaseService: Failed to initialize', error);
      return false;
    }
  }

  /**
   * Set up purchase event listeners
   */
  private setupPurchaseListeners(): void {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: SubscriptionPurchase | ProductPurchase) => {
        console.log('InAppPurchaseService: Purchase updated', purchase);
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // Finish the transaction (required for iOS)
            await finishTransaction({
              purchase,
              isConsumable: false, // Subscriptions are not consumable
            });

            // Resolve pending purchase promise
            if (this.pendingPurchaseResolve) {
              this.pendingPurchaseResolve({
                success: true,
                productId: purchase.productId,
                transactionId: purchase.transactionId,
              });
              this.pendingPurchaseResolve = null;
            }

            console.log('InAppPurchaseService: Purchase completed successfully');
          } catch (error) {
            console.error('InAppPurchaseService: Error finishing transaction', error);
            if (this.pendingPurchaseResolve) {
              this.pendingPurchaseResolve({
                success: false,
                error: 'Failed to finish transaction',
              });
              this.pendingPurchaseResolve = null;
            }
          }
        }
      }
    );

    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('InAppPurchaseService: Purchase error', error);
        
        if (this.pendingPurchaseResolve) {
          this.pendingPurchaseResolve({
            success: false,
            error: error.message || 'Purchase failed',
          });
          this.pendingPurchaseResolve = null;
        }
      }
    );
  }

  /**
   * Load available subscription products from the App Store
   */
  private async loadProducts(): Promise<void> {
    try {
      const skus = Object.values(SUBSCRIPTION_SKUS);
      const products = await getProducts({ skus });

      this.products = products.map(product => ({
        id: product.productId,
        title: product.title,
        description: product.description,
        price: product.price,
        localizedPrice: product.localizedPrice,
        currency: product.currency,
      }));

      console.log('InAppPurchaseService: Loaded products', this.products);
    } catch (error) {
      console.error('InAppPurchaseService: Error loading products', error);
    }
  }

  /**
   * Get available subscription products
   */
  getProducts(): SubscriptionProduct[] {
    return this.products;
  }

  /**
   * Get a specific product by SKU
   */
  getProduct(sku: SubscriptionSKU): SubscriptionProduct | undefined {
    return this.products.find(product => product.id === sku);
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(sku: SubscriptionSKU): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log('InAppPurchaseService: Attempting to purchase', sku);

      // Return a promise that resolves when the purchase listener receives the result
      return new Promise((resolve) => {
        this.pendingPurchaseResolve = resolve;

        // Request the subscription purchase
        requestSubscription({
          sku,
        }).catch((error) => {
          console.error('InAppPurchaseService: requestSubscription error', error);
          resolve({
            success: false,
            error: error.message || 'Failed to request subscription',
          });
          this.pendingPurchaseResolve = null;
        });

        // Set a timeout to avoid hanging indefinitely
        setTimeout(() => {
          if (this.pendingPurchaseResolve === resolve) {
            resolve({
              success: false,
              error: 'Purchase timeout',
            });
            this.pendingPurchaseResolve = null;
          }
        }, 60000); // 60 second timeout
      });
    } catch (error) {
      console.error('InAppPurchaseService: Purchase error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log('InAppPurchaseService: Restoring purchases');

      const purchases = await getAvailablePurchases();
      
      const subscriptionPurchases = purchases.filter(purchase => 
        Object.values(SUBSCRIPTION_SKUS).includes(purchase.productId as SubscriptionSKU)
      );

      if (subscriptionPurchases.length > 0) {
        console.log('InAppPurchaseService: Found active purchases', subscriptionPurchases);
        
        return {
          success: true,
          productId: subscriptionPurchases[0].productId,
          transactionId: subscriptionPurchases[0].transactionId,
        };
      } else {
        return {
          success: false,
          error: 'No active purchases found',
        };
      }
    } catch (error) {
      console.error('InAppPurchaseService: Restore error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.isInitialized) {
        return { isSubscribed: false };
      }

      const purchases = await getAvailablePurchases();

      // Check for active subscriptions
      const activeSubscriptions = purchases.filter(purchase => 
        Object.values(SUBSCRIPTION_SKUS).includes(purchase.productId as SubscriptionSKU)
      );

      if (activeSubscriptions.length > 0) {
        const latestSubscription = activeSubscriptions[0];
        
        return {
          isSubscribed: true,
          activeSubscription: latestSubscription.productId,
          // Note: react-native-iap doesn't provide expiration dates directly
          // You might need to validate receipts on your server for accurate expiration dates
        };
      }

      return { isSubscribed: false };
    } catch (error) {
      console.error('InAppPurchaseService: Error checking subscription status', error);
      return { isSubscribed: false };
    }
  }

  /**
   * Disconnect from the App Store and clean up
   */
  async disconnect(): Promise<void> {
    try {
      // Remove listeners
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      // End connection
      if (this.isInitialized) {
        await endConnection();
        this.isInitialized = false;
        console.log('InAppPurchaseService: Disconnected from App Store');
      }
    } catch (error) {
      console.error('InAppPurchaseService: Error disconnecting', error);
    }
  }
}

// Export singleton instance
export const inAppPurchaseService = new InAppPurchaseService();