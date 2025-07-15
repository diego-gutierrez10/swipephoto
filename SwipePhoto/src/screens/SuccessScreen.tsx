import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import LottieAnimation from '../components/common/LottieAnimation';
import { Button } from '../components/common';
import { colors, spacing, typography } from '../constants/theme';

type SuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Success'>;

export const SuccessScreen: React.FC = () => {
  const navigation = useNavigation<SuccessScreenNavigationProp>();

  const handleContinue = () => {
    // Navigate back to the main part of the app, e.g., the category list
    // The 'popToTop' action clears the navigation stack and goes to the first screen.
    navigation.popToTop();
    navigation.navigate('CategoryList');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LottieAnimation
          source={require('../assets/animations/success.json')}
          width={250}
          height={250}
          speed={0.8}
          color="#FFFFFF"
        />
        <Text style={styles.title}>¡Felicidades!</Text>
        <Text style={styles.subtitle}>
          Te has suscrito a SwipeAI Pro.
        </Text>
        <Text style={styles.featureText}>
          Ahora tienes swipes ilimitados y acceso a todas las funciones.
        </Text>
        <Button
          title="Comenzar a Organizar"
          onPress={handleContinue}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.heading['2xl'],
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing['4xl'],
  },
  subtitle: {
    ...typography.body.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 18,
    maxWidth: '85%',
  },
  featureText: {
    ...typography.body.base,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 16,
    maxWidth: '90%',
  },
  button: {
    marginTop: spacing['5xl'],
    width: '100%',
    backgroundColor: colors.primary,
  },
  buttonText: {
    ...typography.button.base,
    color: colors.background,
  },
});

export default SuccessScreen; 