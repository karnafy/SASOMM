import { Platform } from 'react-native';

export const colors = {
  // Neumorphic Base
  neuBg: '#E8EEF5',
  neuBgAlt: '#F1F3F6',
  neuShadow: '#C8D0E0',
  neuLight: '#FFFFFF',

  // Primary (Cyan/Teal)
  primary: '#00D9D9',
  primaryDark: '#0891B2',
  primaryLight: '#5EEAD4',

  // Accent (Purple)
  accent: '#8B5CF6',
  accentDark: '#6D28D9',
  accentLight: '#C4B5FD',

  // Status
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  warningDark: '#D97706',
  error: '#EF4444',
  errorDark: '#DC2626',
  info: '#3B82F6',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const fonts = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif' })!,
  bold: Platform.select({ ios: 'System', android: 'sans-serif-medium' })!,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace' })!,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Neumorphic shadow helpers
export const neuRaised = Platform.select({
  ios: {
    shadowColor: colors.neuShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
})!;

export const neuRaisedLg = Platform.select({
  ios: {
    shadowColor: colors.neuShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  android: {
    elevation: 6,
  },
})!;

export const neuPressed = Platform.select({
  ios: {
    shadowColor: colors.neuShadow,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  android: {
    elevation: 1,
  },
})!;
