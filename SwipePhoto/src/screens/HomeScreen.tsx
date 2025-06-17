import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../components/layout/ThemeProvider';
import { Button } from '../components/common/Button';
import { shadows } from '@constants/theme/colors';

export const HomeScreen: React.FC = () => {
  const { colors, spacing, typography } = useTheme();

  const handleGetStarted = () => {
    console.log('Get Started pressed!');
  };

  const handleExplore = () => {
    console.log('Explore pressed!');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    titleContainer: {
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      // Neon glow effect
      textShadowColor: colors.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      ...typography.heading.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    description: {
      ...typography.body.base,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonContainer: {
      width: '100%',
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.medium,
    },
    themeDemo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
    },
    colorDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginHorizontal: spacing.xs,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
      />
      
      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.titleContainer}>
          <Text style={dynamicStyles.title}>SwipePhoto</Text>
          <Text style={dynamicStyles.subtitle}>
            Organiza tus fotos con gestos intuitivos
          </Text>
          <Text style={dynamicStyles.description}>
            Desliza para categorizar, toca para explorar, y mantén presionado para acciones rápidas.
            {'\n\n'}
            ¡Tu galería nunca se ha visto tan bien!
          </Text>
        </View>

        <View style={dynamicStyles.card}>
          <Text style={[typography.heading.base, { color: colors.text, marginBottom: spacing.md }]}>
            Dark Theme Demo
          </Text>
          
          <View style={dynamicStyles.themeDemo}>
            <View style={[dynamicStyles.colorDot, { backgroundColor: colors.primary }]} />
            <View style={[dynamicStyles.colorDot, { backgroundColor: colors.secondary }]} />
            <View style={[dynamicStyles.colorDot, { backgroundColor: colors.accent }]} />
          </View>
          
          <Text style={[typography.body.sm, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            Neon Green • Cyan • Pink
          </Text>
        </View>

        <View style={dynamicStyles.buttonContainer}>
          <Button
            title="Comenzar"
            onPress={handleGetStarted}
            variant="primary"
            size="lg"
            fullWidth
          />
          
          <Button
            title="Explorar Funciones"
            onPress={handleExplore}
            variant="outline"
            size="lg"
            fullWidth
          />
          
          <Button
            title="Demo Secundario"
            onPress={handleExplore}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen; 