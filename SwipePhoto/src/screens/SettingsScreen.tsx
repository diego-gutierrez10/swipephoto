import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UsageStats } from '../components/ui/UsageStats';
import { useSubscription } from '../contexts/SubscriptionContext';
import HapticFeedbackService from '../services/HapticFeedbackService';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [hapticFeedback, setHapticFeedback] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { subscriptionStatus, restorePurchases, isLoading } = useSubscription();

  useEffect(() => {
    const loadPreferences = async () => {
      const storedHapticFeedback = await AsyncStorage.getItem('@hapticFeedback');
      const storedNotifications = await AsyncStorage.getItem('@notificationsEnabled');
      if (storedHapticFeedback !== null) {
        setHapticFeedback(JSON.parse(storedHapticFeedback));
      }
      if (storedNotifications !== null) {
        setNotificationsEnabled(JSON.parse(storedNotifications));
      }
    };
    loadPreferences();
  }, []);

  const toggleHapticFeedback = async () => {
    const newValue = !hapticFeedback;
    setHapticFeedback(newValue);
    await HapticFeedbackService.setEnabled(newValue);
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('@notificationsEnabled', JSON.stringify(newValue));
  };

  const renderSubscriptionSection = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      );
    }
    
    if (subscriptionStatus.isSubscribed) {
      return (
        <View style={styles.premiumStatusContainer}>
          <View style={styles.premiumActiveContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#00C851" />
            <Text style={styles.premiumActiveText}>SwipeAI Pro Active</Text>
          </View>
          {subscriptionStatus.activeSubscription && (
            <Text style={styles.subscriptionTypeText}>
              {subscriptionStatus.activeSubscription.includes('Yearly') ? 'Yearly Plan' :
               subscriptionStatus.activeSubscription.includes('Monthly') ? 'Monthly Plan' :
               'Premium'}
            </Text>
          )}
          <TouchableOpacity style={styles.restorePurchasesButton} onPress={restorePurchases}>
            <Text style={styles.restorePurchasesText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.premiumButton} onPress={() => navigation.navigate('Upgrade', { limitReached: false })}>
        <Text style={styles.premiumButtonText}>Go Premium!</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {renderSubscriptionSection()}
        <UsageStats />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>General</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Haptic Feedback</Text>
          <Switch
            value={hapticFeedback}
            onValueChange={toggleHapticFeedback}
            thumbColor={hapticFeedback ? '#007AFF' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('About')}>
          <Ionicons name="information-circle-outline" size={24} color="gray" style={styles.icon} />
          <Text style={styles.settingText}>About & Help</Text>
        </TouchableOpacity>
        
        {/* Developer Section - COMMENTED OUT FOR PRODUCTION 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Developer Tools</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.developerButton} 
          onPress={async () => {
            try {
              // Toggle premium status for testing
              const currentStatus = await AsyncStorage.getItem('@dev_premium_override');
              const newStatus = currentStatus === 'true' ? 'false' : 'true';
              await AsyncStorage.setItem('@dev_premium_override', newStatus);
              
              Alert.alert(
                'Developer Override', 
                `Premium status ${newStatus === 'true' ? 'ENABLED' : 'DISABLED'} for testing.\n\nRestart the app to see changes.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to toggle premium status');
            }
          }}
        >
          <Ionicons name="construct-outline" size={24} color="#FFD700" style={styles.icon} />
          <Text style={styles.developerButtonText}>Toggle Premium Status (DEV)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={async () => {
            Alert.alert(
              'Reset Daily Usage',
              'This will reset your daily swipe count for testing. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await AsyncStorage.removeItem('@daily_usage');
                      await AsyncStorage.removeItem('@daily_usage_date');
                      Alert.alert('Success', 'Daily usage reset! You can now swipe again.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to reset daily usage');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="refresh-outline" size={24} color="#5bc0de" style={styles.icon} />
          <Text style={styles.resetButtonText}>Reset Daily Swipes (DEV)</Text>
        </TouchableOpacity>
        */}
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingText: {
    color: '#fff',
    fontSize: 18,
  },
  resetButton: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#5bc0de',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#d9534f',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumButton: {
    backgroundColor: '#FFD700', // Gold color
    paddingVertical: 15,
    borderRadius: 30,
    alignSelf: 'center',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 30,
    shadowColor: '#FFD700',
    shadowRadius: 15,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  premiumButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  icon: {
    marginRight: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#111',
  },
  sectionHeaderText: {
    color: 'gray',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  premiumStatusContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  premiumActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  premiumActiveText: {
    color: '#00C851',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subscriptionTypeText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  restorePurchasesButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  restorePurchasesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  developerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 0,
  },
  developerButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 