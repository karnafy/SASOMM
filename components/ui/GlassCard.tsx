import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function GlassCard({ children, style }: GlassCardProps) {
  const containerStyle = [styles.container, style];

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={40} tint="dark" style={containerStyle}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[containerStyle, styles.androidFallback]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: colors.glassFallback,
    opacity: 0.92,
  },
});
