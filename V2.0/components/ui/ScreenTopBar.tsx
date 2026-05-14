import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';

interface ScreenTopBarProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenTopBar({ title, onBack, rightAction }: ScreenTopBarProps) {
  return (
    <View style={styles.row}>
      {/* Back button — left side in RTL, uses arrow-forward which points right = "back" in RTL */}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        hitSlop={8}
      >
        <MaterialIcons name="arrow-forward" size={20} color={colors.textPrimary} />
      </Pressable>

      {/* Centered title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Right action slot — right side in RTL (leading side) */}
      <View style={styles.rightSlot}>
        {rightAction ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 16,
    textAlign: 'center',
  },
  rightSlot: {
    width: 34,
    alignItems: 'flex-end',
  },
});
