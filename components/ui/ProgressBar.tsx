import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

type Status = 'ok' | 'warning' | 'over';

interface ProgressBarProps {
  percentage: number;
  status?: Status;
  style?: ViewStyle;
}

const STATUS_COLOR: Record<Status, string> = {
  ok: colors.success,
  warning: colors.warning,
  over: colors.error,
};

export function ProgressBar({ percentage, status, style }: ProgressBarProps) {
  const fillColor = status ? STATUS_COLOR[status] : colors.primary;
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <View style={[styles.track, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedPct}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.bgTertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
