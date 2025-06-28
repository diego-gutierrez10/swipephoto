import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation<AboutScreenNavigationProp>();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const supportEmail = 'support@swipephoto.app';

  const handlePress = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        'Unable to Open',
        `This action could not be completed. Please try again later.`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>About & Help</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <TouchableOpacity style={styles.item} onPress={() => handlePress(`mailto:${supportEmail}?subject=Support Request - SwipePhoto v${appVersion}`)}>
          <Ionicons name="mail-outline" size={24} color="#007AFF" style={styles.icon} />
          <Text style={styles.itemText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => handlePress('itms-apps://itunes.apple.com/app/your-app-id')}>
          <Ionicons name="star-outline" size={24} color="#FFD700" style={styles.icon} />
          <Text style={styles.itemText}>Rate on App Store</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Ionicons name="shield-checkmark-outline" size={24} color="gray" style={styles.icon} />
          <Text style={styles.itemText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('TermsOfService')}>
          <Ionicons name="document-text-outline" size={24} color="gray" style={styles.icon} />
          <Text style={styles.itemText}>Terms of Service</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version {appVersion}</Text>
        </View>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  icon: {
    marginRight: 20,
  },
  itemText: {
    color: '#fff',
    fontSize: 18,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  versionText: {
    color: '#8E8E93',
    fontSize: 14,
  },
}); 