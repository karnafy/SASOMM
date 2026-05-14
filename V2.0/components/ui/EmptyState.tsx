import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface EmptyStateProps {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon as IconName} size={32} color={colors.textTertiary} />
      </View>

      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    textAlign: 'center',
  },
});
