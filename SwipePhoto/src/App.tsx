import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, ActivityIndicator, View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './store';
import { 
  MainSwipeScreen,
  SwipeTestScreen,
  DeletionReviewScreen,
  SuccessScreen,
  UpgradeScreen,
  CategoryListScreen,
  OnboardingScreen,
  SettingsScreen,
  AboutScreen,
  PrivacyPolicyScreen,
  TermsOfServiceScreen,
  PermissionRequestScreen
} from './screens';
import { RootStackParamList } from './types/navigation';
import { SessionManager } from './services/SessionManager';
import PhotoPermissionsService from './services/PhotoPermissionsService';
import { PermissionStatus } from './types';
import RecoveryDialog from './components/RecoveryDialog';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator<RootStackParamList>();
const sessionManager = SessionManager.getInstance();
const permissionsService = PhotoPermissionsService.getInstance();

const App: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<'Onboarding' | 'CategoryList' | null>(null);

  const checkPermissionAndOnboarding = async () => {
    const status = await permissionsService.checkPermissionStatus();
    setPermissionStatus(status);

    if (status === 'granted') {
      const hasOnboarded = await AsyncStorage.getItem('@hasOnboarded');
      setInitialRouteName(hasOnboarded ? 'CategoryList' : 'Onboarding');
    }
    
    setIsInitializing(false);
    return status;
  };

  useEffect(() => {
    const initializeApp = async () => {
      const { recoveryNeeded } = await sessionManager.initialize();
      if (recoveryNeeded) {
        setShowRecoveryDialog(true);
      } else {
        await checkPermissionAndOnboarding();
      }
    };

    initializeApp();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        permissionsService.checkPermissionStatus().then(setPermissionStatus);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAttemptRecovery = async () => {
    await sessionManager.forceSessionRestore();
    setShowRecoveryDialog(false);
    await checkPermissionAndOnboarding();
  };

  const handleStartNewSession = async () => {
    await sessionManager.startNewSession();
    setShowRecoveryDialog(false);
    await checkPermissionAndOnboarding();
  };
  
  const renderContent = () => {
    if (isInitializing || !initialRouteName) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (permissionStatus === 'granted') {
      return (
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="CategoryList" component={CategoryListScreen} />
          <Stack.Screen name="MainSwipe" component={MainSwipeScreen} />
          <Stack.Screen name="SwipeTest" component={SwipeTestScreen} />
          <Stack.Screen name="DeletionReview" component={DeletionReviewScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
          <Stack.Screen name="Upgrade" component={UpgradeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      );
    }
    
    return <PermissionRequestScreen onCheckPermission={checkPermissionAndOnboarding} />;
  };

  return (
    <Provider store={store}>
      <NavigationContainer>
        {renderContent()}
        <RecoveryDialog
          isVisible={showRecoveryDialog}
          onAttemptRecovery={handleAttemptRecovery}
          onStartNewSession={handleStartNewSession}
        />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
