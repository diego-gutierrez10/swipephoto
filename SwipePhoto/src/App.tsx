import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './components/layout/ThemeProvider';
import PhotoLibraryTestScreen from './components/common/PhotoLibraryTestScreen';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider initialTheme="dark">
        <PhotoLibraryTestScreen />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
