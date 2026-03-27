import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { DarkCard } from '../ui/DarkCard';
import { colors, fonts, spacing, radii } from '../../theme';

interface CategoryDonutProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  sym: string;
  convertAmount: (amount: number) => number;
}

const CHART_SIZE = 180;
const STROKE_WIDTH = 28;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CENTER = CHART_SIZE / 2;
const GAP_DEGREES = 3;

function formatNumber(n: number): string {
  return Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function CategoryDonut({ data, title, sym, convertAmount }: CategoryDonutProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const convertedTotal = convertAmount(total);

  const arcs = useMemo(() => {
    if (total === 0 || data.length === 0) return [];
    const totalGap = GAP_DEGREES * data.length;
    const available = 360 - totalGap;
    let currentAngle = 0;

    return data.map((item) => {
      const sweep = (item.value / total) * available;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle + GAP_DEGREES;
      return {
        ...item,
        path: describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle),
      };
    });
  }, [data, total]);

  if (data.length === 0) {
    return (
      <DarkCard style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>אין נתונים להצגה</Text>
      </DarkCard>
    );
  }

  return (
    <DarkCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={colors.bgTertiary}
            strokeWidth={STROKE_WIDTH}
          />
          {arcs.map((arc, i) => (
            <Path
              key={`${arc.label}-${i}`}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          ))}
        </Svg>

        <View style={styles.centerLabel}>
          <Text style={styles.centerAmount}>
            {sym}{formatNumber(convertedTotal)}
          </Text>
          <Text style={styles.centerSubtext}>סה״כ</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((item, index) => {
          const convertedValue = convertAmount(item.value);
          return (
            <View key={`${item.label}-${index}`} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
              <Text style={styles.legendAmount}>
                {sym}{formatNumber(convertedValue)}
              </Text>
            </View>
          );
        })}
      </View>
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    height: CHART_SIZE,
  },
  centerLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerAmount: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  centerSubtext: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  legend: { gap: spacing.sm },
  legendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  legendLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  legendAmount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
