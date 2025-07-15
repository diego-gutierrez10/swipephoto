import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../components/common';
import { colors, spacing, typography } from '../constants/theme';
import PhotoPermissionsService from '../services/PhotoPermissionsService';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

const permissionsService = PhotoPermissionsService.getInstance();

type PrePermissionNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PrePermissionRationale'
>;

const PrePermissionRationaleScreen = () => {
  const navigation = useNavigation<PrePermissionNavigationProp>();

  const handleRequestPermission = async () => {
    const { status } = await permissionsService.requestPermissions();
    if (status === 'granted') {
      navigation.replace('CategoryList');
    } else {
      navigation.replace('PermissionDenied');
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="images-outline" size={120} color={colors.primary} style={styles.icon} />
      <Text style={styles.title}>One Last Step!</Text>
      <Text style={styles.message}>
        To get started, we need your permission to access your photo library.
        This allows SwipePhoto to help you organize everything.
      </Text>
      <Button title="Grant Access" onPress={handleRequestPermission} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    ...typography.heading['2xl'],
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginBottom: spacing.xl,
  },
});

export default PrePermissionRationaleScreen; 