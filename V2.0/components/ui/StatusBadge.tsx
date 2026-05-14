import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

type Status = 'ok' | 'warning' | 'over';
type Size = 'sm' | 'md';

interface StatusBadgeProps {
  status: Status;
  size?: Size;
}

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  ok: { color: colors.success, label: 'תקין' },
  warning: { color: colors.warning, label: 'אזהרה' },
  over: { color: colors.error, label: 'חריגה' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { color, label } = STATUS_CONFIG[status];
  const dotSize = size === 'sm' ? 5 : 6;
  const fontSize = size === 'sm' ? 9 : 11;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    // size and color applied inline
  },
  label: {
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
});
