import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './components/layout/ThemeProvider';
import SwipeTestScreen from './screens/SwipeTestScreen';
import { ProgressManager } from './services/ProgressManager';

const AppContent: React.FC = () => {
  // Initialize ProgressManager with store
  useEffect(() => {
    const progressManager = ProgressManager.getInstance();
    progressManager.initialize(store);
    
    return () => {
      progressManager.dispose();
    };
  }, []);

  return <SwipeTestScreen />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider initialTheme="dark">
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
