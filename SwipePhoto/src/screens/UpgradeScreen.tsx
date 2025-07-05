import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import LottieAnimation from '../components/common/LottieAnimation';
import { useInAppPurchases } from '../hooks';
import { SUBSCRIPTION_SKUS } from '../services/InAppPurchaseService';

type UpgradeScreenRouteProp = RouteProp<RootStackParamList, 'Upgrade'>;

export const UpgradeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<UpgradeScreenRouteProp>();
  const { products, subscriptionStatus, isLoading, purchaseSubscription, restorePurchases } = useInAppPurchases();
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
      navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {limitReached && (
        <View style={styles.limitMessageContainer}>
          <Text style={styles.limitMessageText}>
            You have reached your daily swipe limit.
          </Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <LottieAnimation
          source={require('../assets/animations/rocket.json')}
          color="#DFFF00" // Neon Yellow
          width={150}
          height={150}
        />
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Unlock unlimited access and all features.</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featureText}>✓ Unlimited photo swipes</Text>
          <Text style={styles.featureText}>✓ Organize your entire gallery</Text>
          <Text style={styles.featureText}>✓ Ad-free experience</Text>
          <Text style={styles.featureText}>✓ Priority support</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DFFF00" />
            <Text style={styles.loadingText}>Loading subscription options...</Text>
          </View>
        ) : (
          <ScrollView style={styles.subscriptionOptions} showsVerticalScrollIndicator={false}>
            {/* Yearly Subscription (Best Value) */}
            {yearlyProduct && (
              <TouchableOpacity 
                style={[styles.subscriptionButton, styles.bestValueButton]} 
                onPress={() => handlePurchase(yearlyProduct.id)}
                disabled={purchasingProduct !== null}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                {purchasingProduct === yearlyProduct.id ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.subscriptionTitle}>SwipeAI Pro - Yearly</Text>
                    <Text style={styles.subscriptionPrice}>{yearlyProduct.localizedPrice}/year</Text>
                    <Text style={styles.subscriptionSavings}>Save over 70%</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Monthly Subscription */}
            {monthlyProduct && (
              <TouchableOpacity 
                style={styles.subscriptionButton} 
                onPress={() => handlePurchase(monthlyProduct.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === monthlyProduct.id ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.subscriptionTitle}>SwipeAI Pro - Monthly</Text>
                    <Text style={styles.subscriptionPrice}>{monthlyProduct.localizedPrice}/month</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Weekly Subscription */}
            {weeklyProduct && (
              <TouchableOpacity 
                style={styles.subscriptionButton} 
                onPress={() => handlePurchase(weeklyProduct.id)}
                disabled={purchasingProduct !== null}
              >
                {purchasingProduct === weeklyProduct.id ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.subscriptionTitle}>SwipeAI Pro - Weekly</Text>
                    <Text style={styles.subscriptionPrice}>{weeklyProduct.localizedPrice}/week</Text>
                    <Text style={styles.subscriptionTrialText}>Perfect for trying out</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={handleRestore}
          disabled={isLoading || purchasingProduct !== null}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
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
  header: {
    alignItems: 'flex-start',
    padding: 15,
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#DFFF00', // Neon Yellow
    paddingVertical: 15,
    borderRadius: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#DFFF00',
    shadowRadius: 15,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  upgradeButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  restoreButton: {
    marginTop: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 10,
  },
  subscriptionOptions: {
    maxHeight: 300,
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  subscriptionButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 70,
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
    top: -8,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  subscriptionSavings: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  subscriptionTrialText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
}); 