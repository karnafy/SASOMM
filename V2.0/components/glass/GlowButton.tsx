// Liquid Glass primary button — gradient fill + glow shadow + press animation
import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated, Platform, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, gradients, fonts } from '../../theme';

interface GlowButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'fill' | 'outline' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlowButton({ label, onPress, variant = 'fill', disabled, style }: GlowButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.timing(opacity, { toValue: 0.85, duration: 100, useNativeDriver: true }),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const animStyle = { transform: [{ scale }], opacity };

  if (variant === 'fill') {
    return (
      <Animated.View style={[styles.wrapper, style, animStyle, disabled && { opacity: 0.5 }]}>
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ borderRadius: radii.lg, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={gradients.glowFill as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fillContent}
          >
            <Text style={styles.fillLabel}>{label}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, style, disabled && { opacity: 0.5 }]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.outline, variant === 'danger' && styles.outlineDanger]}
      >
        <Text style={[styles.outlineLabel, variant === 'danger' && { color: colors.error }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    ...Platform.select({
      ios: { shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 18 },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 22px rgba(0,217,217,0.4)' } as any,
    }),
  },
  fillContent: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  fillLabel: {
    color: colors.bgPrimary,
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    fontSize: 14,
  },
  outline: {
    borderRadius: radii.lg,
    paddingVertical: 13,
    paddingHorizontal: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.4)',
    alignItems: 'center',
  },
  outlineDanger: { borderColor: 'rgba(255,107,122,0.4)' },
  outlineLabel: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 13,
  },
});
