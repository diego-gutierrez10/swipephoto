import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './components/layout/ThemeProvider';
import SwipeTestScreen from './screens/SwipeTestScreen';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider initialTheme="dark">
        <SwipeTestScreen />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
