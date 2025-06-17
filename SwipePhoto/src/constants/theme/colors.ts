// SwipePhoto Dark Theme Color Palette
export const colors = {
  // SwipePhoto Brand Colors - Neon Dark Theme
  primary: '#00FF41',     // Neon green - main brand color
  secondary: '#00FFFF',   // Cyan - secondary brand color  
  accent: '#FF0080',      // Pink/Magenta - accent color

  // Background colors for dark theme
  background: '#000000',      // Pure black
  backgroundSecondary: '#0D0D0D', // Off-black
  surface: '#1A1A1A',        // Card/surface background
  surfaceSecondary: '#262626', // Secondary surface

  // Text colors optimized for dark theme
  text: '#FFFFFF',           // Primary text - white
  textSecondary: '#CCCCCC',  // Secondary text - light gray
  textTertiary: '#999999',   // Tertiary text - medium gray
  textDisabled: '#666666',   // Disabled text - dark gray

  // Semantic colors with neon theme
  success: '#00FF41',        // Success (same as primary)
  warning: '#FFD700',        // Warning - gold
  error: '#FF3366',          // Error - bright red
  info: '#00FFFF',           // Info (same as secondary)

  // Interactive states
  border: '#333333',         // Border color
  borderFocus: '#00FF41',    // Focused border
  shadow: 'rgba(0, 255, 65, 0.2)', // Neon glow shadow

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  backdrop: 'rgba(0, 0, 0, 0.5)',

  // Gradient colors for special effects
  gradientStart: '#000000',
  gradientEnd: '#0D0D0D',
  
  // Category colors (bright colors for dark theme)
  categories: {
    red: '#FF4757',
    orange: '#FF7F50',
    yellow: '#FFD700',
    green: '#00FF41',
    blue: '#00BFFF',
    purple: '#DA70D6',
    pink: '#FF0080',
    cyan: '#00FFFF',
  },
} as const;

// Light theme colors (for future toggle functionality)
export const lightColors = {
  primary: '#00CC34',        // Darker green for light theme
  secondary: '#00CCCC',      // Darker cyan for light theme
  accent: '#CC0066',         // Darker pink for light theme

  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F8F8',

  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',

  success: '#00CC34',
  warning: '#FF9900',
  error: '#CC2244',
  info: '#00AACC',

  border: '#E0E0E0',
  borderFocus: '#00CC34',
  shadow: 'rgba(0, 0, 0, 0.1)',

  overlay: 'rgba(255, 255, 255, 0.9)',
  backdrop: 'rgba(0, 0, 0, 0.3)',

  gradientStart: '#FFFFFF',
  gradientEnd: '#F5F5F5',

  categories: {
    red: '#E53E3E',
    orange: '#DD6B20',
    yellow: '#D69E2E',
    green: '#38A169',
    blue: '#3182CE',
    purple: '#805AD5',
    pink: '#D53F8C',
    cyan: '#00B5D8',
  },
} as const;

// Union type for theme colors
export type ThemeColors = typeof colors | typeof lightColors;

// Main theme export (dark theme by default)
export const darkTheme = {
  colors,
  isDark: true,
} as const;

export const lightTheme = {
  colors: lightColors,
  isDark: false,
} as const;

// Shadows for dark theme with neon glow effect
export const shadows = {
  small: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  neonGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
} as const;

export type ThemeShadows = typeof shadows; 