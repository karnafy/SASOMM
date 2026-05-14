// SASOMM Theme — V2.0 Liquid Glass
// Same shape as v1 theme so existing pages render without code changes.
import { Platform } from 'react-native';

export const colors = {
  // Backgrounds (deeper than v1, with ambient gradient overlay)
  bgPrimary: '#06070C',
  bgSecondary: '#0C0E16',
  bgTertiary: '#161A26',

  // Gradients
  gradientStart: '#0891B2',
  gradientMid: '#4A1D7A',
  gradientEnd: '#06070C',
  gradientColors: ['#0891B2', '#4A1D7A', '#161A26', '#06070C'] as const,
  gradientLocations: [0, 0.35, 0.75, 1] as const,

  // Brand
  primary: '#00D9D9',
  primaryDark: '#0891B2',
  primaryLight: '#5EEAD4',
  accent: '#B967FF',
  accentSoft: '#7C4DFF',

  // Status
  success: '#10E5A4',
  warning: '#FFB454',
  error: '#FF6B7A',
  info: '#5BA9FF',

  // Text
  textPrimary: '#F1F4FB',
  textSecondary: '#A8B3C7',
  textTertiary: '#6B7689',

  // Glass
  glassWhite: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderStrong: 'rgba(0,217,217,0.25)',
  subtleBorder: 'rgba(255,255,255,0.05)',
  glassFallback: 'rgba(22,26,38,0.55)',
  inputBg: 'rgba(15,17,25,0.7)',
  inputBorder: 'rgba(0,217,217,0.2)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Gradient stops for glow-border, glow-fill, heading text
export const gradients = {
  glowBorder: ['rgba(0,217,217,0.7)', 'rgba(94,234,212,0.5)', 'rgba(185,103,255,0.7)'] as const,
  glowFill: ['#00D9D9', '#5EEAD4', '#B967FF'] as const,
  heading: ['#FFFFFF', '#5EEAD4', '#B967FF'] as const,
  ambientCyan: ['rgba(0,217,217,0.08)', 'transparent'] as const,
  ambientPurple: ['rgba(185,103,255,0.08)', 'transparent'] as const,
  successFill: ['#10E5A4', '#5EEAD4'] as const,
  errorFill: ['#FF6B7A', '#FF9580'] as const,
} as const;

export const fonts = {
  regular: 'OpenSans_400Regular',
  medium: 'OpenSans_500Medium',
  semibold: 'OpenSans_600SemiBold',
  bold: 'OpenSans_700Bold',
  extrabold: 'OpenSans_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
} as const;

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, full: 9999,
} as const;

// Backdrop-filter blur intensity for expo-blur (0..100)
export const blurIntensity = {
  subtle: 12,
  default: 25,
  strong: 45,
} as const;

const buildShadow = (color: string, offsetY: number, opacity: number, radius: number, elevation: number) => {
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${offsetY}px ${radius * 2}px ${color}` } as any;
  }
  return Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: offsetY }, shadowOpacity: opacity, shadowRadius: radius },
    android: { elevation },
  })!;
};

export const glowButton = buildShadow('#00D9D9', 6, 0.35, 16, 12);
export const glowFab = buildShadow('#00D9D9', 8, 0.45, 22, 14);
export const glowDot = buildShadow('#00D9D9', 0, 0.7, 6, 4);
export const glowCard = buildShadow('#00D9D9', 4, 0.15, 12, 6);
export const glowPurple = buildShadow('#B967FF', 6, 0.3, 18, 10);
