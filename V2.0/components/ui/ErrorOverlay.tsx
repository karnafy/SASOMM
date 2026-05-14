import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '../../theme';

interface ErrorOverlayProps {
  message: string;
  onRetry: () => void;
}

export function ErrorOverlay({ message, onRetry }: ErrorOverlayProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="cloud-off" size={48} color={colors.error} />

      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Text style={styles.retryText}>נסה שוב</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  retryText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    textAlign: 'center',
  },
});
