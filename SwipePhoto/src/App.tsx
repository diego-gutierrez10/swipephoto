import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppState, type AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, type StackCardInterpolationProps } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor } from './store';
import { ThemeProvider } from './components/layout/ThemeProvider';
import {
  MainSwipeScreen,
  OnboardingScreen,
  SettingsScreen,
  CategoryListScreen,
  DeletionReviewScreen,
  SuccessScreen,
  AboutScreen,
  TermsOfServiceScreen,
  PrivacyPolicyScreen,
  UpgradeScreen,
  PrePermissionRationaleScreen,
  PermissionDeniedScreen,
  PermissionRequestScreen,
} from './screens';
import { RootStackParamList } from './types/navigation';
import { SessionManager } from './services/SessionManager';
import RecoveryDialog from './components/RecoveryDialog';
import PhotoPermissionsService from './services/PhotoPermissionsService';
import HapticFeedbackService from './services/HapticFeedbackService';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

const Stack = createStackNavigator<RootStackParamList>();
const sessionManager = SessionManager.getInstance();
const permissionsService = new PhotoPermissionsService();
type InitialRouteName = keyof RootStackParamList;

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<InitialRouteName | null>(null);

  const checkOnboardingAndPermissions = async () => {
    try {
      const hasOnboarded = await AsyncStorage.getItem('@hasOnboarded');
      if (!hasOnboarded) {
        setInitialRouteName('Onboarding');
        return;
      }

      const status = await permissionsService.checkPermissionStatus();
      if (status === 'granted') {
        setInitialRouteName('CategoryList');
      } else {
        setInitialRouteName('PrePermissionRationale');
      }
    } catch (e) {
      console.error('Failed to check onboarding or permissions', e);
      setInitialRouteName('Onboarding');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const { recoveryNeeded } = await sessionManager.initialize();
      if (recoveryNeeded) {
        setShowRecoveryDialog(true);
      } else {
        await checkOnboardingAndPermissions();
      }
    };

    initializeApp();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkOnboardingAndPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Initialize services on app startup
    HapticFeedbackService.initialize();
  }, []);

  const handleAttemptRecovery = async () => {
    await sessionManager.forceSessionRestore();
    setShowRecoveryDialog(false);
    await checkOnboardingAndPermissions();
  };

  const handleStartNewSession = async () => {
    await sessionManager.startNewSession();
    setShowRecoveryDialog(false);
    await checkOnboardingAndPermissions();
  };
  
  const renderContent = () => {
    if (isInitializing || !initialRouteName) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="PrePermissionRationale" component={PrePermissionRationaleScreen} />
        <Stack.Screen name="PermissionDenied" component={PermissionDeniedScreen} />
        <Stack.Screen name="CategoryList" component={CategoryListScreen} />
        <Stack.Screen name="MainSwipe" component={MainSwipeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="DeletionReview" component={DeletionReviewScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="Upgrade" component={UpgradeScreen} />
        <Stack.Screen name="PermissionRequest">
          {(props) => (
            <PermissionRequestScreen {...props} onCheckPermission={checkOnboardingAndPermissions} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SubscriptionProvider>
            <NavigationContainer>
              {renderContent()}
              <RecoveryDialog
                isVisible={showRecoveryDialog}
                onAttemptRecovery={handleAttemptRecovery}
                onStartNewSession={handleStartNewSession}
              />
            </NavigationContainer>
          </SubscriptionProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
