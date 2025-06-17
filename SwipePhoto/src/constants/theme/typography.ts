import { Platform } from 'react-native';

export const fontFamilies = {
  // System fonts for best performance and native feel
  regular: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  // Monospace for technical content
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'monospace',
  }),
} as const;

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const fontSizes = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 22,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 36,
  '7xl': 40,
  '8xl': 48,
  '9xl': 56,
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const typography = {
  // Display text styles
  display: {
    '2xl': {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['8xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['8xl'] * lineHeights.tight,
    },
    xl: {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['7xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['7xl'] * lineHeights.tight,
    },
    lg: {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['6xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['6xl'] * lineHeights.tight,
    },
  },

  // Heading styles
  heading: {
    '4xl': {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['5xl'] * lineHeights.tight,
    },
    '3xl': {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['4xl'] * lineHeights.tight,
    },
    '2xl': {
      fontFamily: fontFamilies.bold,
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['3xl'] * lineHeights.normal,
    },
    xl: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: fontSizes['2xl'] * lineHeights.normal,
    },
    lg: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: fontSizes.xl * lineHeights.normal,
    },
    base: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: fontSizes.lg * lineHeights.normal,
    },
  },

  // Body text styles
  body: {
    xl: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xl * lineHeights.relaxed,
    },
    lg: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.lg * lineHeights.relaxed,
    },
    base: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.base * lineHeights.relaxed,
    },
    sm: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    xs: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xs * lineHeights.normal,
    },
  },

  // Component-specific typography
  button: {
    lg: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.lg * lineHeights.tight,
    },
    base: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.base * lineHeights.tight,
    },
    sm: {
      fontFamily: fontFamilies.medium,
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.sm * lineHeights.tight,
    },
  },

  caption: {
    lg: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    base: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xs * lineHeights.normal,
    },
    sm: {
      fontFamily: fontFamilies.regular,
      fontSize: fontSizes['2xs'],
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes['2xs'] * lineHeights.normal,
    },
  },

  // Code and monospace
  code: {
    lg: {
      fontFamily: fontFamilies.mono,
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.base * lineHeights.normal,
    },
    base: {
      fontFamily: fontFamilies.mono,
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    sm: {
      fontFamily: fontFamilies.mono,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xs * lineHeights.normal,
    },
  },
} as const;

export type Typography = typeof typography;
export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights; 