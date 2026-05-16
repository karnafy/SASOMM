// V2.0 GradientHeader — ambient cyan↔purple gradient + glow overlays.
// Same API as v1.
// New: 3-stop ambient gradient with subtle cyan glow top-right + purple glow bottom-left.
import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

interface GradientHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientHeader({ children, style }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }, style]}>
      {/* Deep base background */}
      <LinearGradient
        colors={[...colors.gradientColors] as unknown as [string, string, ...string[]]}
        locations={[...colors.gradientLocations] as unknown as [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Cyan ambient glow top-right */}
      <LinearGradient
        colors={['rgba(0,217,217,0.18)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Purple ambient glow bottom-left */}
      <LinearGradient
        colors={['transparent', 'rgba(185,103,255,0.14)']}
        start={{ x: 0.4, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
});
