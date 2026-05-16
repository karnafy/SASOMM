// V2.0 GradientButton — cyan→mint→purple gradient with press animation.
// Same API as v1.
// New: 3-stop gradient (was 2-stop), press scale animation, layered glow shadow.
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, glowButton, radii, fonts } from '../../theme';

type Variant = 'primary' | 'outline' | 'danger';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  const handlePress = () => { if (!disabled) onPress(); };

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.outlineButton, disabled && styles.disabled]}
          disabled={disabled}
        >
          <Text style={[styles.outlineText, disabled && styles.disabledText]}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'danger') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.dangerButton, disabled && styles.disabled]}
          disabled={disabled}
        >
          <Text style={[styles.dangerText, disabled && styles.disabledText]}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  // primary — full gradient + glow
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <LinearGradient
          colors={gradients.glowFill as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, disabled && styles.disabled]}
        >
          <Text style={[styles.primaryText, disabled && styles.disabledText]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowButton,
  },
  primaryText: {
    color: colors.bgPrimary,
    fontFamily: fonts.bold,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,217,217,0.05)',
  },
  outlineText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  dangerButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,122,0.05)',
  },
  dangerText: {
    color: colors.error,
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  disabled: { opacity: 0.5 },
  disabledText: { opacity: 0.5 },
});
