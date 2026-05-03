import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { DarkCard } from '../ui/DarkCard';
import { colors, fonts, spacing, radii } from '../../theme';

interface PaymentPieChartProps {
  data: { label: string; value: number; color: string }[];
  sym: string;
  convertAmount: (amount: number) => number;
}

const CHART_SIZE = 180;
const RADIUS = CHART_SIZE / 2;
const CENTER = CHART_SIZE / 2;
const GAP_DEGREES = 2;

function formatNumber(n: number): string {
  return Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSector(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export function PaymentPieChart({ data, sym, convertAmount }: PaymentPieChartProps) {
  const { t } = useTranslation();
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const sectors = useMemo(() => {
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
        path: describeSector(CENTER, CENTER, RADIUS - 4, startAngle, endAngle),
      };
    });
  }, [data, total]);

  if (data.length === 0) {
    return (
      <DarkCard style={styles.card}>
        <Text style={styles.title}>{t('payment.distribution_title')}</Text>
        <Text style={styles.emptyText}>{t('empty.no_data')}</Text>
      </DarkCard>
    );
  }

  return (
    <DarkCard style={styles.card}>
      <Text style={styles.title}>{t('payment.distribution_title')}</Text>

      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {sectors.map((sector, i) => (
            <Path
              key={`${sector.label}-${i}`}
              d={sector.path}
              fill={sector.color}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.legend}>
        {data.map((item, index) => {
          const convertedValue = convertAmount(item.value);
          const percent = formatPercent(item.value, total);
          return (
            <View key={`${item.label}-${index}`} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendPercent}>{percent}</Text>
                <Text style={styles.legendAmount}>
                  {sym}{formatNumber(convertedValue)}
                </Text>
              </View>
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
    marginBottom: spacing.lg,
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
  legendRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendPercent: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
    minWidth: 36,
    textAlign: 'left',
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
