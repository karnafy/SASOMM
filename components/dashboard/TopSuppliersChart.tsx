import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, radii } from '../../theme';
import { DarkCard } from '../ui/DarkCard';

interface TopSuppliersChartProps {
  suppliers: { name: string; total: number; id: string }[];
  sym: string;
  convertAmount: (amount: number) => number;
}

const MAX_BARS = 5;
const BAR_MAX_WIDTH_PERCENT = 55;

export function TopSuppliersChart({
  suppliers,
  sym,
  convertAmount,
}: TopSuppliersChartProps) {
  const topSuppliers = useMemo(() => {
    const sorted = [...suppliers].sort((a, b) => b.total - a.total);
    return sorted.slice(0, MAX_BARS);
  }, [suppliers]);

  const maxAmount = useMemo(() => {
    if (topSuppliers.length === 0) return 1;
    return Math.max(...topSuppliers.map((s) => s.total), 1);
  }, [topSuppliers]);

  if (topSuppliers.length === 0) {
    return (
      <DarkCard style={styles.card}>
        <Text style={styles.title}>ספקים מובילים</Text>
        <Text style={styles.emptyText}>אין נתונים להצגה</Text>
      </DarkCard>
    );
  }

  return (
    <DarkCard style={styles.card}>
      <Text style={styles.title}>ספקים מובילים</Text>
      <View style={styles.chartContainer}>
        {topSuppliers.map((supplier, index) => {
          const converted = convertAmount(supplier.total);
          const barWidthPercent =
            (supplier.total / maxAmount) * BAR_MAX_WIDTH_PERCENT;
          const opacity = 1 - index * 0.15;

          return (
            <View key={supplier.id} style={styles.row}>
              <Text style={styles.supplierName} numberOfLines={1}>
                {supplier.name}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.max(barWidthPercent, 2)}%`,
                      backgroundColor: colors.primary,
                      opacity: Math.max(opacity, 0.3),
                    },
                  ]}
                />
              </View>
              <Text style={styles.amount}>
                {sym}
                {converted.toLocaleString('he-IL', {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          );
        })}
      </View>
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  chartContainer: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  supplierName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
    width: 80,
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  bar: {
    height: '100%',
    borderRadius: radii.sm,
  },
  amount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    width: 75,
    textAlign: 'left',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
