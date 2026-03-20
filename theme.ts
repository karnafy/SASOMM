import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  bgPrimary: '#0D0B1A',
  bgSecondary: '#161427',
  bgTertiary: '#1E1B33',

  // Gradients
  gradientStart: '#6B2FA0',
  gradientMid: '#4A1D7A',
  gradientEnd: '#1A1040',
  gradientColors: ['#6B2FA0', '#4A1D7A', '#2A1050', '#0D0B1A'] as const,
  gradientLocations: [0, 0.4, 0.75, 1] as const,

  // Brand
  primary: '#00D9D9',
  primaryDark: '#0891B2',
  primaryLight: '#5EEAD4',
  accent: '#8B6BAB',

  // Status
  success: '#00E88F',
  warning: '#FFB020',
  error: '#FF4D6A',
  info: '#5B9BFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textTertiary: '#6B6B82',

  // Glass
  glassWhite: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  subtleBorder: 'rgba(255,255,255,0.06)',
  glassFallback: '#1E1A35',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
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

// Glow shadow helpers - with web support
const createGlowShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius * 2}px ${color}`,
    } as any;
  }
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
  })!;
};

export const glowButton = createGlowShadow('#00D9D9', 4, 0.3, 10, 8);
export const glowFab = createGlowShadow('#00D9D9', 4, 0.35, 8, 8);
export const glowDot = createGlowShadow('#00D9D9', 0, 0.6, 4, 4);
export const glowCard = createGlowShadow('#00D9D9', 2, 0.15, 6, 4);
