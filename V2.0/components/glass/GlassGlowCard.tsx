// Liquid Glass card WITH gradient cyan→purple glow border (3D feel)
// Used for hero cards: balance card, project cards, drill-in panels.
// Technique: outer LinearGradient wrapper (1px) + inner blurred view.
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, blurIntensity, gradients } from '../../theme';

interface GlassGlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
}

export function GlassGlowCard({ children, style, innerStyle, intensity = blurIntensity.default, radius = radii.lg }: GlassGlowCardProps) {
  return (
    <View style={[styles.shadow, { borderRadius: radius + 1 }, style]}>
      <LinearGradient
        colors={gradients.glowBorder as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius + 1 }]}
      >
        <View style={[styles.inner, { borderRadius: radius }, innerStyle]}>
          <BlurView intensity={intensity} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.glassFallback, borderRadius: radius }]} />
          <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#00D9D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
      },
      android: { elevation: 12 },
      web: {
        // @ts-ignore — web-only
        boxShadow:
          '0 10px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,217,217,0.12), 0 0 28px rgba(0,217,217,0.08)',
      } as any,
    }),
  },
  gradient: { padding: 1.2 },
  inner: {
    overflow: 'hidden',
    backgroundColor: colors.bgPrimary,
  },
});
