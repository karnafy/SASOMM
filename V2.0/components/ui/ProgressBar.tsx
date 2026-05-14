import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

type Status = 'ok' | 'warning' | 'over';

interface ProgressBarProps {
  /**
   * Progress percentage:
   * - With `signed=false` (default): 0..100, capped. Fills from left.
   * - With `signed=true`: can be negative (deficit) or positive (surplus toward budget).
   *     Positive → green fill from left, capped at 100%.
   *     Negative → red fill from right, abs() capped at 100%.
   */
  percentage: number;
  status?: Status;
  signed?: boolean;
  style?: ViewStyle;
}

const STATUS_COLOR: Record<Status, string> = {
  ok: colors.success,
  warning: colors.warning,
  over: colors.error,
};

export function ProgressBar({ percentage, status, signed, style }: ProgressBarProps) {
  if (signed) {
    if (percentage >= 0) {
      const pct = Math.min(100, percentage);
      return (
        <View style={[styles.track, style]}>
          <View
            style={[
              styles.fill,
              { width: `${pct}%`, backgroundColor: colors.success, alignSelf: 'flex-start' },
            ]}
          />
        </View>
      );
    }
    const pct = Math.min(100, Math.abs(percentage));
    return (
      <View style={[styles.track, style]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: colors.error, alignSelf: 'flex-end' },
          ]}
        />
      </View>
    );
  }

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
