import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import LottieAnimation from '../components/common/LottieAnimation';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SUBSCRIPTION_SKUS } from '../services/InAppPurchaseService';

type UpgradeScreenRouteProp = RouteProp<RootStackParamList, 'Upgrade'>;

// Get device dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768 || (Platform.OS === 'ios' && screenWidth >= 744); // iPad detection

export const UpgradeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<UpgradeScreenRouteProp>();
  const { products, subscriptionStatus, isLoading, purchaseSubscription, restorePurchases } = useSubscription();
  const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null);

  const limitReached = route.params?.limitReached;

  // If user is already subscribed, redirect them back
  React.useEffect(() => {
    if (subscriptionStatus.isSubscribed) {
      navigation.goBack();
    }
  }, [subscriptionStatus.isSubscribed, navigation]);

  const handlePurchase = async (productId: string) => {
    setPurchasingProduct(productId);
    const success = await purchaseSubscription(productId as any);
    setPurchasingProduct(null);
    
    if (success) {
      navigation.navigate('Success');
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      navigation.goBack();
    }
  };

  // Get product details
  const monthlyProduct = products.find(p => p.id === SUBSCRIPTION_SKUS.MONTHLY);
  const yearlyProduct = products.find(p => p.id === SUBSCRIPTION_SKUS.YEARLY);
  const weeklyProduct = products.find(p => p.id === SUBSCRIPTION_SKUS.WEEKLY);

  // Fallback products with your configured prices if RevenueCat products aren't loaded
  const fallbackProducts = {
    yearly: {
      id: SUBSCRIPTION_SKUS.YEARLY,
      title: 'SwipeAI Pro - Yearly',
      localizedPrice: '$29.99',
      price: '$29.99'
    },
    monthly: {
      id: SUBSCRIPTION_SKUS.MONTHLY,
      title: 'SwipeAI Pro - Monthly', 
      localizedPrice: '$8.99',
      price: '$8.99'
    },
    weekly: {
      id: SUBSCRIPTION_SKUS.WEEKLY,
      title: 'SwipeAI Pro - Weekly',
      localizedPrice: '$2.99', 
      price: '$2.99'
    }
  };

  // Use RevenueCat products if available, otherwise use fallback
  const displayYearly = yearlyProduct || fallbackProducts.yearly;
  const displayMonthly = monthlyProduct || fallbackProducts.monthly;
  const displayWeekly = weeklyProduct || fallbackProducts.weekly;

  // Debug logs
  React.useEffect(() => {
    console.log('🛒 UpgradeScreen: Products loaded:', products);
    console.log('🛒 UpgradeScreen: Subscription status:', subscriptionStatus);
    console.log('🛒 UpgradeScreen: Is loading:', isLoading);
    console.log('🛒 UpgradeScreen: Is tablet:', isTablet);
    console.log('🛒 UpgradeScreen: Screen dimensions:', { width: screenWidth, height: screenHeight });
    if (products.length === 0 && !isLoading) {
      console.log('⚠️  UpgradeScreen: Using fallback products');
    }
  }, [products, subscriptionStatus, isLoading]);

  // Dynamic styles based on device type
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 120, // Space for restore button on phone
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: isTablet ? 'space-between' : 'center',
      paddingHorizontal: isTablet ? 60 : 30, // More padding on tablets
      paddingTop: isTablet ? 20 : 20,
      paddingBottom: isTablet ? 100 : 20, // Fixed space for restore button on tablet
    },
    header: {
      alignItems: 'flex-start',
      padding: 15,
      alignSelf: 'stretch',
    },
    animationContainer: {
      marginVertical: isTablet ? 20 : 20,
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: isTablet ? 20 : 30,
    },
    featuresContainer: {
      alignSelf: 'stretch',
      marginBottom: isTablet ? 20 : 30,
      maxWidth: isTablet ? 600 : undefined, // Limit width on tablets
      alignItems: isTablet ? 'center' : 'stretch',
    },
    subscriptionOptions: {
      alignSelf: 'stretch',
      maxWidth: isTablet ? 700 : undefined, // Limit width on tablets
      width: '100%',
      flex: isTablet ? 0 : undefined, // Don't flex on tablet to maintain size
    },
    subscriptionOptionsContent: {
      paddingBottom: isTablet ? 0 : 20,
    },
    upperSection: {
      alignItems: 'center',
      flex: isTablet ? 0 : undefined,
    },
    lowerSection: {
      alignSelf: 'stretch',
      alignItems: 'center',
      flex: isTablet ? 0 : undefined,
    },
  });

  // Render content for tablet (no scroll, fixed layout)
  const renderTabletContent = () => (
    <View style={dynamicStyles.content}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={dynamicStyles.upperSection}>
        <View style={dynamicStyles.animationContainer}>
          <LottieAnimation
            source={require('../assets/animations/rocket.json')}
            color="#DFFF00" // Neon Yellow
            width={200}
            height={200}
          />
        </View>
        
        <View style={dynamicStyles.titleSection}>
          <Text style={[styles.title, { fontSize: 42 }]}>Go Premium</Text>
          <Text style={[styles.subtitle, { 
            fontSize: 22,
            marginTop: 15,
            maxWidth: 500
          }]}>
            Unlock unlimited access and all features.
          </Text>
        </View>
        
        <View style={dynamicStyles.featuresContainer}>
          <Text style={[styles.featureText, { 
            fontSize: 22,
            marginBottom: 20,
            textAlign: 'center'
          }]}>
            ✓ Unlimited photo swipes
          </Text>
          <Text style={[styles.featureText, { 
            fontSize: 22,
            marginBottom: 20,
            textAlign: 'center'
          }]}>
            ✓ Organize your entire gallery
          </Text>
          <Text style={[styles.featureText, { 
            fontSize: 22,
            marginBottom: 20,
            textAlign: 'center'
          }]}>
            ✓ Priority support
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.lowerSection}>
        {isLoading ? (
          <View style={[styles.loadingContainer, { paddingVertical: 60 }]}>
            <ActivityIndicator size="large" color="#DFFF00" />
            <Text style={[styles.loadingText, { 
              fontSize: 18,
              marginTop: 15
            }]}>
              Loading subscription options...
            </Text>
          </View>
        ) : (
          <View style={dynamicStyles.subscriptionOptions}>
            <View style={dynamicStyles.subscriptionOptionsContent}>
              {/* Yearly Subscription (Best Value) */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton, 
                  styles.bestValueButton,
                  {
                    minHeight: 85,
                    marginBottom: 20,
                    paddingVertical: 20,
                    paddingHorizontal: 30,
                  }
                ]} 
                onPress={() => handlePurchase(displayYearly.id)}
                disabled={purchasingProduct !== null}
              >
                <View style={[styles.bestValueBadge, {
                  top: -10,
                  right: 15,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }]}>
                  <Text style={[styles.bestValueText, { fontSize: 12 }]}>BEST VALUE</Text>
                </View>
                {purchasingProduct === displayYearly.id ? (
                  <ActivityIndicator color="#000" size="large" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 22,
                      marginBottom: 8
                    }]}>
                      SwipeAI Pro - Yearly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 28 }]}>
                      {displayYearly.localizedPrice}/year
                    </Text>
                    <Text style={[styles.subscriptionSavings, { 
                      fontSize: 16,
                      marginTop: 4
                    }]}>
                      Save over 70%
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Monthly Subscription */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton,
                  {
                    minHeight: 85,
                    marginBottom: 20,
                    paddingVertical: 20,
                    paddingHorizontal: 30,
                  }
                ]} 
                onPress={() => handlePurchase(displayMonthly.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === displayMonthly.id ? (
                  <ActivityIndicator color="#000" size="large" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 22,
                      marginBottom: 8
                    }]}>
                      SwipeAI Pro - Monthly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 28 }]}>
                      {displayMonthly.localizedPrice}/month
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Weekly Subscription */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton,
                  {
                    minHeight: 85,
                    marginBottom: 0, // Last button, no margin
                    paddingVertical: 20,
                    paddingHorizontal: 30,
                  }
                ]} 
                onPress={() => handlePurchase(displayWeekly.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === displayWeekly.id ? (
                  <ActivityIndicator color="#000" size="large" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 22,
                      marginBottom: 8
                    }]}>
                      SwipeAI Pro - Weekly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 28 }]}>
                      {displayWeekly.localizedPrice}/week
                    </Text>
                    <Text style={[styles.subscriptionTrialText, { 
                      fontSize: 16,
                      marginTop: 4
                    }]}>
                      Perfect for trying out
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // Render content for phone (with scroll)
  const renderPhoneContent = () => (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={dynamicStyles.scrollContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.animationContainer}>
          <LottieAnimation
            source={require('../assets/animations/rocket.json')}
            color="#DFFF00" // Neon Yellow
            width={150}
            height={150}
          />
        </View>
        
        <View style={dynamicStyles.titleSection}>
          <Text style={[styles.title, { fontSize: 32 }]}>Go Premium</Text>
          <Text style={[styles.subtitle, { 
            fontSize: 18,
            marginTop: 10,
          }]}>
            Unlock unlimited access and all features.
          </Text>
        </View>
        
        <View style={dynamicStyles.featuresContainer}>
          <Text style={[styles.featureText, { 
            fontSize: 18,
            marginBottom: 15,
            textAlign: 'left'
          }]}>
            ✓ Unlimited photo swipes
          </Text>
          <Text style={[styles.featureText, { 
            fontSize: 18,
            marginBottom: 15,
            textAlign: 'left'
          }]}>
            ✓ Organize your entire gallery
          </Text>
          <Text style={[styles.featureText, { 
            fontSize: 18,
            marginBottom: 15,
            textAlign: 'left'
          }]}>
            ✓ Priority support
          </Text>
        </View>

        {isLoading ? (
          <View style={[styles.loadingContainer, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color="#DFFF00" />
            <Text style={[styles.loadingText, { 
              fontSize: 16,
              marginTop: 10
            }]}>
              Loading subscription options...
            </Text>
          </View>
        ) : (
          <View style={dynamicStyles.subscriptionOptions}>
            <View style={dynamicStyles.subscriptionOptionsContent}>
              {/* Yearly Subscription (Best Value) */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton, 
                  styles.bestValueButton,
                  {
                    minHeight: 65,
                    marginBottom: 10,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                  }
                ]} 
                onPress={() => handlePurchase(displayYearly.id)}
                disabled={purchasingProduct !== null}
              >
                <View style={[styles.bestValueBadge, {
                  top: -8,
                  right: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }]}>
                  <Text style={[styles.bestValueText, { fontSize: 10 }]}>BEST VALUE</Text>
                </View>
                {purchasingProduct === displayYearly.id ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 18,
                      marginBottom: 4
                    }]}>
                      SwipeAI Pro - Yearly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 22 }]}>
                      {displayYearly.localizedPrice}/year
                    </Text>
                    <Text style={[styles.subscriptionSavings, { 
                      fontSize: 14,
                      marginTop: 2
                    }]}>
                      Save over 70%
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Monthly Subscription */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton,
                  {
                    minHeight: 65,
                    marginBottom: 10,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                  }
                ]} 
                onPress={() => handlePurchase(displayMonthly.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === displayMonthly.id ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 18,
                      marginBottom: 4
                    }]}>
                      SwipeAI Pro - Monthly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 22 }]}>
                      {displayMonthly.localizedPrice}/month
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Weekly Subscription */}
              <TouchableOpacity 
                style={[
                  styles.subscriptionButton,
                  {
                    minHeight: 65,
                    marginBottom: 10,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                  }
                ]} 
                onPress={() => handlePurchase(displayWeekly.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === displayWeekly.id ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={[styles.subscriptionTitle, { 
                      fontSize: 18,
                      marginBottom: 4
                    }]}>
                      SwipeAI Pro - Weekly
                    </Text>
                    <Text style={[styles.subscriptionPrice, { fontSize: 22 }]}>
                      {displayWeekly.localizedPrice}/week
                    </Text>
                    <Text style={[styles.subscriptionTrialText, { 
                      fontSize: 14,
                      marginTop: 2
                    }]}>
                      Perfect for trying out
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" />
      {limitReached && (
        <View style={styles.limitMessageContainer}>
          <Text style={styles.limitMessageText}>
            You have reached your daily swipe limit.
          </Text>
        </View>
      )}
      
      {isTablet ? renderTabletContent() : renderPhoneContent()}

      <TouchableOpacity
        style={[styles.restoreButton, {
          bottom: isTablet ? 50 : 30,
          paddingVertical: isTablet ? 15 : 10,
        }]}
        onPress={handleRestore}
        disabled={isLoading || purchasingProduct !== null}
      >
        <Text style={[styles.restoreButtonText, { fontSize: isTablet ? 18 : 16 }]}>
          Restore Purchases
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  limitMessageContainer: {
    backgroundColor: '#DFFF00', // Neon Yellow to grab attention
    padding: 10,
    alignItems: 'center',
  },
  limitMessageText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: '#8E8E93',
    textAlign: 'center',
  },
  featureText: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E93',
  },
  subscriptionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bestValueButton: {
    backgroundColor: '#DFFF00', // Neon Yellow for best value
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bestValueBadge: {
    position: 'absolute',
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
  },
  bestValueText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subscriptionTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  subscriptionPrice: {
    fontWeight: 'bold',
    color: '#000',
  },
  subscriptionSavings: {
    color: '#007AFF',
    fontWeight: '600',
  },
  subscriptionTrialText: {
    color: '#666',
  },
  restoreButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#8E8E93',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
}); 