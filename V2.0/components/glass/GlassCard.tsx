// Liquid Glass card — blurred background + subtle layered shadow
// Used for activity rows, supplier rows, small content cards.
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, blurIntensity } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
}

export function GlassCard({ children, style, intensity = blurIntensity.default, radius = radii.lg }: GlassCardProps) {
  // On web, BlurView from expo-blur uses backdrop-filter under the hood (RN Web 0.21+).
  // On native, it uses platform-native UIVisualEffectView / BlurView.
  return (
    <View style={[styles.container, { borderRadius: radius }, style]}>
      <BlurView intensity={intensity} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.glassFallback, borderRadius: radius }]} />
      <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
      web: {
        // @ts-ignore — web-only
        boxShadow:
          '0 6px 18px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.25)',
      } as any,
    }),
  },
});
