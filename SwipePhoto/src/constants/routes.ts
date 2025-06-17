export const ROUTES = {
  // Main navigation
  HOME: 'Home',
  SWIPE: 'Swipe',
  CATEGORIES: 'Categories',
  PHOTOS: 'Photos',
  SETTINGS: 'Settings',

  // Photo related screens
  PHOTO_DETAIL: 'PhotoDetail',
  PHOTO_GALLERY: 'PhotoGallery',
  PHOTO_VIEWER: 'PhotoViewer',

  // Category related screens
  CATEGORY_DETAIL: 'CategoryDetail',
  CATEGORY_CREATE: 'CategoryCreate',
  CATEGORY_EDIT: 'CategoryEdit',

  // Settings screens
  SETTINGS_GENERAL: 'SettingsGeneral',
  SETTINGS_SWIPE: 'SettingsSwipe',
  SETTINGS_PRIVACY: 'SettingsPrivacy',
  SETTINGS_ABOUT: 'SettingsAbout',

  // Auth screens (future)
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Modals
  PHOTO_PICKER: 'PhotoPicker',
  CATEGORY_SELECTOR: 'CategorySelector',
  CONFIRMATION: 'Confirmation',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES]; 