import Purchases, { 
  PurchasesPackage,
  PurchasesOffering,
  CustomerInfo,
  PurchasesStoreProduct,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Configuration for RevenueCat
// TODO: Replace with your actual RevenueCat API Key from https://app.revenuecat.com/
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY_IOS || 'appl_yyUQEJDpaRPVTAzkhNGPUIPODaO';

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
  period?: string; // e.g., 'P1Y' for yearly, 'P1M' for monthly, 'P1W' for weekly
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
  customerInfo?: CustomerInfo;
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  activeSubscription?: string;
  expirationDate?: Date;
  entitlements?: { [key: string]: PurchasesEntitlementInfo };
}

class InAppPurchaseService {
  private isInitialized = false;
  private currentOffering: PurchasesOffering | null = null;
  
  // Define the entitlement identifier for pro features
  private static readonly PRO_ENTITLEMENT_ID = 'SwipeAI Pro';

  /**
   * Initialize the RevenueCat service
   */
  async initialize(userId?: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('InAppPurchaseService: Only iOS is supported');
        return false;
      }

      if (this.isInitialized) {
        return true;
      }

      // Configure RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      
      // Initialize RevenueCat
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId, // Optional: set a user ID for tracking
        shouldShowInAppMessagesAutomatically: true,
      });

      // Load current offering
      await this.loadCurrentOffering();

      this.isInitialized = true;
      console.log('InAppPurchaseService: Successfully initialized RevenueCat');
      return true;
    } catch (error) {
      console.error('InAppPurchaseService: Failed to initialize RevenueCat', error);
      return false;
    }
  }

  /**
   * Load the current offering from RevenueCat
   */
  private async loadCurrentOffering(): Promise<void> {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        this.currentOffering = offerings.current;
        console.log('InAppPurchaseService: Loaded current offering', this.currentOffering);
      } else {
        console.warn('InAppPurchaseService: No current offering found');
      }
    } catch (error) {
      console.error('InAppPurchaseService: Error loading offerings', error);
    }
  }

  /**
   * Get available subscription products
   */
  getProducts(): SubscriptionProduct[] {
    if (!this.currentOffering) {
      return [];
    }

    const products: SubscriptionProduct[] = [];
    
    // Get packages from the current offering
    Object.values(this.currentOffering.availablePackages).forEach(pkg => {
      const product = pkg.product;
      
      products.push({
        id: product.identifier,
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        localizedPrice: product.priceString,
        currency: product.currencyCode,
        period: this.getSubscriptionPeriod(pkg),
      });
    });

    return products;
  }

  /**
   * Get a specific product by SKU
   */
  getProduct(sku: SubscriptionSKU): SubscriptionProduct | undefined {
    const products = this.getProducts();
    return products.find(product => product.id === sku);
  }

  /**
   * Get subscription period from package
   */
  private getSubscriptionPeriod(pkg: PurchasesPackage): string {
    switch (pkg.packageType) {
      case PACKAGE_TYPE.ANNUAL:
        return 'P1Y';
      case PACKAGE_TYPE.MONTHLY:
        return 'P1M';
      case PACKAGE_TYPE.WEEKLY:
        return 'P1W';
      default:
        return 'unknown';
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(sku: SubscriptionSKU): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.currentOffering) {
        throw new Error('No offerings available');
      }

      // Find the package for the given SKU
      const pkg = Object.values(this.currentOffering.availablePackages).find(
        p => p.product.identifier === sku
      );

      if (!pkg) {
        throw new Error(`Product ${sku} not found in current offering`);
      }

      console.log('InAppPurchaseService: Attempting to purchase', sku);

      // Make the purchase
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

      // Instead of an immediate check, we will now rely on polling from the hook
      // or a separate status check. The purchase itself was "successful" from a
      // user interaction standpoint. The hook will handle polling for status.
      console.log('InAppPurchaseService: Purchase call completed for', sku);

      return {
        success: true,
        productId: productIdentifier,
        customerInfo,
      };
    } catch (error: any) {
      // RevenueCat throws an error with a `userCancelled` boolean property.
      if (error.userCancelled) {
        console.log('InAppPurchaseService: Purchase was cancelled by the user.');
        return {
          success: false,
          error: 'Purchase cancelled by user.',
        };
      }

      console.error('InAppPurchaseService: Purchase failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log('InAppPurchaseService: Restoring purchases');

      // Restore purchases
      const customerInfo = await Purchases.restorePurchases();

      // Check if any subscriptions are active
      const isSubscribed = this.checkSubscriptionStatus(customerInfo);

      if (isSubscribed) {
        console.log('InAppPurchaseService: Purchases restored successfully');
        return {
          success: true,
          customerInfo,
        };
      } else {
        console.log('InAppPurchaseService: No active subscriptions found');
        return {
          success: false,
          error: 'No active subscriptions found',
        };
      }
    } catch (error) {
      console.error('InAppPurchaseService: Restore failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.isInitialized) {
        console.log('InAppPurchaseService: Service not initialized');
        return { isSubscribed: false };
      }

      // Get current customer info
      const customerInfo = await Purchases.getCustomerInfo();

      return this.parseSubscriptionStatus(customerInfo);
    } catch (error) {
      console.error('InAppPurchaseService: Error getting subscription status', error);
      return { isSubscribed: false };
    }
  }

  /**
   * Parse subscription status from customer info
   */
  private parseSubscriptionStatus(customerInfo: CustomerInfo): SubscriptionStatus {
    const proEntitlement = customerInfo.entitlements.active[InAppPurchaseService.PRO_ENTITLEMENT_ID];
    
    if (proEntitlement) {
      return {
        isSubscribed: true,
        activeSubscription: proEntitlement.productIdentifier,
        expirationDate: proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : undefined,
        entitlements: customerInfo.entitlements.active,
      };
    }

    return {
      isSubscribed: false,
      entitlements: {},
    };
  }

  /**
   * Check if customer has active subscription
   */
  private checkSubscriptionStatus(customerInfo: CustomerInfo): boolean {
    const proEntitlement = customerInfo.entitlements.active[InAppPurchaseService.PRO_ENTITLEMENT_ID];
    return proEntitlement !== undefined;
  }

  /**
   * Poll for subscription status with retries.
   * This is useful for environments like TestFlight where status updates can be delayed.
   */
  async pollForSubscriptionStatus(retries = 5, delay = 1000): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      const status = await this.getSubscriptionStatus();
      if (status.isSubscribed) {
        console.log(`InAppPurchaseService: Subscription status confirmed after ${i + 1} attempts.`);
        return true;
      }
      console.log(`InAppPurchaseService: Attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.warn(`InAppPurchaseService: Subscription status not confirmed after ${retries} attempts.`);
    return false;
  }

  /**
   * Check if user is subscribed (convenience method)
   */
  async isSubscribed(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isSubscribed;
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isInitialized) {
        return null;
      }

      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('InAppPurchaseService: Error getting customer info', error);
      return null;
    }
  }

  /**
   * Set user ID for tracking
   */
  async setUserId(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('InAppPurchaseService: Service not initialized');
        return;
      }

      await Purchases.logIn(userId);
      console.log('InAppPurchaseService: User ID set successfully');
    } catch (error) {
      console.error('InAppPurchaseService: Error setting user ID', error);
    }
  }

  /**
   * Clear user ID
   */
  async clearUserId(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('InAppPurchaseService: Service not initialized');
        return;
      }

      await Purchases.logOut();
      console.log('InAppPurchaseService: User ID cleared successfully');
    } catch (error) {
      console.error('InAppPurchaseService: Error clearing user ID', error);
    }
  }

  /**
   * Disconnect from RevenueCat
   */
  async disconnect(): Promise<void> {
    try {
      // RevenueCat doesn't require explicit disconnection
      // The SDK handles cleanup automatically
      this.isInitialized = false;
      this.currentOffering = null;
      console.log('InAppPurchaseService: Disconnected successfully');
    } catch (error) {
      console.error('InAppPurchaseService: Error during disconnect', error);
    }
  }

  /**
   * Get offering packages for display
   */
  getOfferingPackages(): PurchasesPackage[] {
    if (!this.currentOffering) {
      return [];
    }

    return Object.values(this.currentOffering.availablePackages);
  }
}

// Export a singleton instance
export const inAppPurchaseService = new InAppPurchaseService();
export default inAppPurchaseService; 