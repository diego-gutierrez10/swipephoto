import React, { createContext, useContext, ReactNode } from 'react';
import { darkTheme, lightTheme, ThemeColors } from '@constants/theme/colors';
import { spacing } from '@constants/theme/spacing';
import { typography } from '@constants/theme/typography';

type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  spacing: typeof spacing;
  typography: typeof typography;
};

type ThemeContextType = Theme & {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'dark', // Default to dark theme for SwipePhoto
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>(initialTheme);

  const theme: Theme = React.useMemo(() => {
    const selectedTheme = currentTheme === 'dark' ? darkTheme : lightTheme;
    return {
      colors: selectedTheme.colors,
      isDark: selectedTheme.isDark,
      spacing,
      typography,
    };
  }, [currentTheme]);

  const toggleTheme = React.useCallback(() => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = React.useCallback((theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
  }, []);

  const contextValue: ThemeContextType = React.useMemo(() => ({
    ...theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 