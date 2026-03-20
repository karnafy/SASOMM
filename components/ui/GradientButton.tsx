import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glowButton, radii, fonts } from '../../theme';

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
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.outlineButton, disabled && styles.disabled, style]}
        disabled={disabled}
      >
        <Text style={[styles.outlineText, disabled && styles.disabledText]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.dangerButton, disabled && styles.disabled, style]}
        disabled={disabled}
      >
        <Text style={[styles.dangerText, disabled && styles.disabledText]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  // primary variant
  return (
    <Pressable onPress={handlePress} disabled={disabled} style={style}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, disabled && styles.disabled]}
      >
        <Text style={[styles.primaryText, disabled && styles.disabledText]}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
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
    fontFamily: fonts.semibold,
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
    backgroundColor: colors.transparent,
  },
  outlineText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
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
    backgroundColor: colors.transparent,
  },
  dangerText: {
    color: colors.error,
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
