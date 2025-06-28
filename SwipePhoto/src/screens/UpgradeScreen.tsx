import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import LottieAnimation from '../components/common/LottieAnimation';

type UpgradeScreenRouteProp = RouteProp<RootStackParamList, 'Upgrade'>;

export const UpgradeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<UpgradeScreenRouteProp>();

  const limitReached = route.params?.limitReached;

  const handleUpgrade = () => {
    // TODO: Implement in-app purchase logic
    console.log('Upgrade button pressed');
  };

  const handleRestore = () => {
    // TODO: Implement restore purchases logic
    console.log('Restore purchases button pressed');
  };

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

        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade Now - $8.99/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
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
}); 