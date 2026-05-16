// V2.0 GlassCard — Liquid Glass primitive used across the app.
// Same API as v1 so all existing imports work.
// New: backdrop blur on all platforms + gradient cyan→purple border + layered shadows.
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, gradients, blurIntensity } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** If true, renders cyan→purple gradient border (hero cards). Default false = plain glass. */
  glow?: boolean;
}

export function GlassCard({ children, style, glow = false }: GlassCardProps) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const radius =
    typeof flatStyle.borderRadius === 'number' ? flatStyle.borderRadius : radii.lg;

  // Inner blurred content — same for both variants
  const inner = (
    <>
      <BlurView
        intensity={blurIntensity.default}
        tint="dark"
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: colors.glassFallback, borderRadius: radius },
        ]}
      />
      <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
    </>
  );

  if (glow) {
    return (
      <View style={[styles.shadowGlow, { borderRadius: radius + 1 }, style]}>
        <LinearGradient
          colors={gradients.glowBorder as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: radius + 1 }]}
        >
          <View style={[styles.inner, { borderRadius: radius }]}>
            {inner}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderRadius: radius }, style]}>{inner}</View>
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
  shadowGlow: {
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
          '0 10px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,217,217,0.15), 0 0 28px rgba(0,217,217,0.1)',
      } as any,
    }),
  },
  gradient: { padding: 1.2 },
  inner: {
    overflow: 'hidden',
    backgroundColor: colors.bgPrimary,
  },
});
