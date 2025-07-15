import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Button } from '../components/common';
import { colors, spacing, typography } from '../constants/theme';

const PermissionDeniedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sadFace}>:(</Text>
      <Text style={styles.title}>Photo Access Required</Text>
      <Text style={styles.message}>
        This app needs access to your photos to function. Please enable permissions in your device settings.
      </Text>
      <Button title="Go to Settings" onPress={() => Linking.openSettings()} />
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
  sadFace: {
    fontSize: 80,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});

export default PermissionDeniedScreen; 