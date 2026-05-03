import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, radii } from '../../theme';
import { DarkCard } from '../ui/DarkCard';

interface KpiCardsProps {
  avgExpenses: number;
  avgIncome: number;
  avgSavings: number;
  ratio: number;
  expenseTrend: number;
  incomeTrend: number;
  sym: string;
  convertAmount: (amount: number) => number;
}

interface KpiCardData {
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly sym: string;
  readonly trend?: number;
  /** For expenses, a negative trend (decrease) is good. For income, a positive trend is good. */
  readonly invertTrend?: boolean;
  readonly isRatio?: boolean;
}

function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function TrendBadge({
  trend,
  invertTrend = false,
}: {
  readonly trend: number;
  readonly invertTrend?: boolean;
}) {
  const isPositiveChange = trend > 0;
  // For expenses: decrease is good (green). For income: increase is good (green).
  const isGood = invertTrend ? !isPositiveChange : isPositiveChange;
  const trendColor = isGood ? colors.success : colors.error;
  const iconName = isPositiveChange ? 'trending-up' : 'trending-down';
  const displayValue = Math.abs(trend).toFixed(1);

  return (
    <View style={styles.trendBadge}>
      <MaterialIcons name={iconName} size={14} color={trendColor} />
      <Text style={[styles.trendText, { color: trendColor }]}>
        {displayValue}%
      </Text>
    </View>
  );
}

function SingleKpiCard({ card }: { readonly card: KpiCardData }) {
  const displayValue = card.isRatio
    ? card.value.toFixed(2)
    : formatNumber(card.value);

  return (
    <DarkCard style={styles.kpiCard}>
      <View style={styles.cardTopRow}>
        {card.trend != null ? (
          <TrendBadge trend={card.trend} invertTrend={card.invertTrend} />
        ) : (
          <View style={styles.trendPlaceholder} />
        )}
      </View>
      <Text style={[styles.kpiValue, { color: card.color }]}>
        {displayValue}
        {!card.isRatio && <Text style={styles.kpiSymbol}> {card.sym}</Text>}
      </Text>
      <Text style={styles.kpiLabel}>{card.label}</Text>
    </DarkCard>
  );
}

export function KpiCards({
  avgExpenses,
  avgIncome,
  avgSavings,
  ratio,
  expenseTrend,
  incomeTrend,
  sym,
  convertAmount,
}: KpiCardsProps) {
  const { t } = useTranslation();
  const cards: readonly KpiCardData[] = useMemo(() => {
    const convertedExpenses = convertAmount(avgExpenses);
    const convertedIncome = convertAmount(avgIncome);
    const convertedSavings = convertAmount(avgSavings);

    return [
      {
        label: t('kpi.avg_monthly_expenses'),
        value: convertedExpenses,
        color: colors.error,
        sym,
        trend: expenseTrend,
        invertTrend: true,
      },
      {
        label: t('kpi.avg_monthly_income'),
        value: convertedIncome,
        color: colors.success,
        sym,
        trend: incomeTrend,
        invertTrend: false,
      },
      {
        label: t('kpi.monthly_savings'),
        value: convertedSavings,
        color: colors.primary,
        sym,
      },
      {
        label: t('kpi.income_expense_ratio'),
        value: ratio,
        color: colors.info,
        sym,
        isRatio: true,
      },
    ] as const;
  }, [
    t,
    avgExpenses,
    avgIncome,
    avgSavings,
    ratio,
    expenseTrend,
    incomeTrend,
    sym,
    convertAmount,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SingleKpiCard card={cards[0]!} />
        <SingleKpiCard card={cards[1]!} />
      </View>
      <View style={styles.row}>
        <SingleKpiCard card={cards[2]!} />
        <SingleKpiCard card={cards[3]!} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  trendPlaceholder: {
    height: 22,
  },
  trendText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  kpiValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  kpiSymbol: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  kpiLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
