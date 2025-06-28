import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UsageStats } from '../components/ui/UsageStats';
import { SessionManager } from '../services/SessionManager';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [hapticFeedback, setHapticFeedback] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const sessionManager = SessionManager.getInstance();

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
      const premiumStatus = sessionManager.isPremium();
      setIsPremium(premiumStatus);
    };
    loadPreferences();
  }, []);

  const toggleHapticFeedback = async () => {
    const newValue = !hapticFeedback;
    setHapticFeedback(newValue);
    await AsyncStorage.setItem('@hapticFeedback', JSON.stringify(newValue));
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('@notificationsEnabled', JSON.stringify(newValue));
  };

  const togglePremiumStatus = async () => {
    const newValue = !isPremium;
    setIsPremium(newValue);
    await sessionManager.setPremiumStatus(newValue);
    Alert.alert('Premium Status', `You are now ${newValue ? 'a premium user' : 'a regular user'}. Please restart the app for full effect.`);
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem('@hasOnboarded');
      Alert.alert('Tutorial Reset', 'The tutorial will be shown again on next app launch.');
    } catch (e) {
      console.error('Failed to reset tutorial', e);
    }
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
        <TouchableOpacity style={styles.premiumButton} onPress={() => navigation.navigate('Upgrade', { limitReached: false })}>
          <Text style={styles.premiumButtonText}>Go Premium!</Text>
        </TouchableOpacity>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Developer</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Premium Status (Dev)</Text>
          <Switch
            value={isPremium}
            onValueChange={togglePremiumStatus}
            thumbColor={isPremium ? '#FFD700' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#FFD700' }}
          />
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={resetTutorial}>
          <Text style={styles.resetButtonText}>Reset Tutorial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => {/* Placeholder for logout logic */}}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
}); 