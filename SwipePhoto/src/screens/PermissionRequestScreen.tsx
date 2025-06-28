import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieAnimation from '../components/common/LottieAnimation';
import { MainStackNavigationProp } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';
import PhotoPermissionsService from '../services/PhotoPermissionsService';
import { PermissionStatus } from '../types';

interface PermissionRequestScreenProps {
  onCheckPermission: () => void;
}

export const PermissionRequestScreen: React.FC<PermissionRequestScreenProps> = ({ onCheckPermission }) => {
  const navigation = useNavigation<MainStackNavigationProp>();

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open settings', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LottieAnimation
          source={require('../assets/animations/rocket.json')}
          width={200}
          height={200}
        />
        <Text style={styles.title}>Photo Library Access Needed</Text>
        <Text style={styles.description}>
          To help you organize your photos, we need access to your photo library. 
          Please enable permissions in your device settings.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Go to Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkButton} onPress={onCheckPermission}>
          <Text style={styles.checkButtonText}>I've enabled permissions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkButton: {
    padding: 10,
  },
  checkButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 