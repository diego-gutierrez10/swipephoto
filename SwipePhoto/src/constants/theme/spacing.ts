export const spacing = {
  // Base spacing unit (4px)
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 20,   // 20px
  '2xl': 24, // 24px
  '3xl': 32, // 32px
  '4xl': 40, // 40px
  '5xl': 48, // 48px
  '6xl': 64, // 64px
  '7xl': 80, // 80px
  '8xl': 96, // 96px
} as const;

export const layout = {
  // Screen padding
  screenPadding: spacing.lg,
  screenPaddingHorizontal: spacing.lg,
  screenPaddingVertical: spacing.xl,

  // Component spacing
  componentSpacing: spacing.md,
  sectionSpacing: spacing['2xl'],
  itemSpacing: spacing.sm,

  // Card and component dimensions
  cardPadding: spacing.lg,
  cardRadius: 12,
  buttonHeight: 48,
  inputHeight: 48,
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },

  // Photo-specific dimensions
  photoCard: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    padding: spacing.sm,
  },

  swipeArea: {
    minHeight: 300,
    maxHeight: 600,
    horizontalPadding: spacing.lg,
  },

  // Category elements
  categoryChip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },

  categoryCard: {
    minHeight: 80,
    padding: spacing.lg,
    borderRadius: 12,
  },

  // Bottom sheets and modals
  bottomSheet: {
    borderRadius: 20,
    handleHeight: 4,
    handleWidth: 40,
    headerHeight: 60,
  },

  modal: {
    borderRadius: 16,
    padding: spacing['2xl'],
  },

  // Safe area offsets
  safeArea: {
    top: 44,    // iPhone status bar
    bottom: 34, // iPhone home indicator
  },
} as const;

export const hitSlop = {
  small: {
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
  },
  medium: {
    top: spacing.sm,
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
  },
  large: {
    top: spacing.md,
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
} as const;

export type Spacing = typeof spacing;
export type Layout = typeof layout;
export type HitSlop = typeof hitSlop; 