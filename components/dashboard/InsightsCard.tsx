import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, radii } from '../../theme';
import { DarkCard } from '../ui/DarkCard';

interface InsightsCardProps {
  vatSummary: {
    totalWithVat: number;
    estimatedVat: number;
    totalWithoutVat: number;
  };
  busiestMonth: { month: string; amount: number } | null;
  totalTransactions: number;
  sym: string;
  convertAmount: (amount: number) => number;
}

interface InsightTile {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}

function formatAmount(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

export function InsightsCard({
  vatSummary,
  busiestMonth,
  totalTransactions,
  sym,
  convertAmount,
}: InsightsCardProps) {
  const tiles: InsightTile[] = useMemo(() => {
    const convertedVat = convertAmount(vatSummary.estimatedVat);
    const convertedWithoutVat = convertAmount(vatSummary.totalWithoutVat);

    return [
      {
        icon: 'receipt-long',
        iconColor: colors.warning,
        value: formatAmount(convertedVat, sym),
        label: 'מע"מ משוער',
      },
      {
        icon: 'swap-horiz',
        iconColor: colors.primary,
        value: totalTransactions.toLocaleString('he-IL'),
        label: 'סה"כ עסקאות',
      },
      {
        icon: 'whatshot',
        iconColor: colors.error,
        value: busiestMonth ? busiestMonth.month : '-',
        label: 'חודש יקר',
      },
      {
        icon: 'money-off',
        iconColor: colors.info,
        value: formatAmount(convertedWithoutVat, sym),
        label: 'ללא מע"מ',
      },
    ];
  }, [vatSummary, busiestMonth, totalTransactions, sym, convertAmount]);

  return (
    <DarkCard style={styles.card}>
      <Text style={styles.title}>תובנות</Text>
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tileWrapper}>
            <View style={styles.tile}>
              <View style={styles.tileIconRow}>
                <MaterialIcons
                  name={tile.icon}
                  size={20}
                  color={tile.iconColor}
                />
              </View>
              <Text
                style={styles.tileValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {tile.value}
              </Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          </View>
        ))}
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
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  tileWrapper: {
    width: '50%',
    padding: spacing.xs,
  },
  tile: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  tileIconRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  tileValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  tileLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
