/**
 * MonthlyBarChart - Grouped bar chart showing income vs expenses by month.
 *
 * Implemented as a pure React Native component rather than using victory-native,
 * because the installed victory-native v41 (Skia-based) requires peer dependencies
 * (@shopify/react-native-skia, react-native-reanimated, react-native-gesture-handler)
 * that are not present in this project. This custom implementation provides the same
 * visual result with zero additional dependencies.
 */
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing } from '../../theme';
import { DarkCard } from '../ui/DarkCard';

interface MonthlyBarChartProps {
  data: { month: string; expenses: number; income: number }[];
  sym: string;
  convertAmount: (amount: number) => number;
}

interface ConvertedDatum {
  readonly month: string;
  readonly expenses: number;
  readonly income: number;
}

const CHART_HEIGHT = 180;
const BAR_GROUP_GAP = 2;
const CHART_PADDING_LEFT = 48;
const CHART_PADDING_RIGHT = 8;
const Y_TICK_COUNT = 4;

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
}

/**
 * Determine which x-axis indices should display a label.
 * Shows up to 6 evenly-spaced labels to avoid crowding.
 */
function getVisibleLabelIndices(total: number, maxLabels: number): ReadonlySet<number> {
  if (total <= maxLabels) {
    return new Set(Array.from({ length: total }, (_, i) => i));
  }
  const step = (total - 1) / (maxLabels - 1);
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    indices.add(Math.round(i * step));
  }
  return indices;
}

function YAxisLabels({
  maxValue,
  height,
}: {
  readonly maxValue: number;
  readonly height: number;
}) {
  const ticks = useMemo(() => {
    const result: { label: string; top: number }[] = [];
    for (let i = 0; i <= Y_TICK_COUNT; i++) {
      const value = (maxValue / Y_TICK_COUNT) * i;
      const top = height - (i / Y_TICK_COUNT) * height;
      result.push({ label: formatCompact(value), top });
    }
    return result;
  }, [maxValue, height]);

  return (
    <View style={[styles.yAxis, { height }]}>
      {ticks.map((tick) => (
        <Text
          key={tick.label}
          style={[styles.yLabel, { top: tick.top - 7 }]}
          numberOfLines={1}
        >
          {tick.label}
        </Text>
      ))}
    </View>
  );
}

function GridLines({ height, count }: { readonly height: number; readonly count: number }) {
  const lines = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i <= count; i++) {
      result.push(height - (i / count) * height);
    }
    return result;
  }, [height, count]);

  return (
    <>
      {lines.map((top) => (
        <View
          key={top}
          style={[styles.gridLine, { top }]}
        />
      ))}
    </>
  );
}

export function MonthlyBarChart({ data, sym, convertAmount }: MonthlyBarChartProps) {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const chartOuterWidth = screenWidth - 56;

  const converted: readonly ConvertedDatum[] = useMemo(
    () =>
      data.map((d) => ({
        month: d.month,
        expenses: convertAmount(d.expenses),
        income: convertAmount(d.income),
      })),
    [data, convertAmount],
  );

  const maxValue = useMemo(() => {
    let max = 0;
    for (const d of converted) {
      if (d.expenses > max) max = d.expenses;
      if (d.income > max) max = d.income;
    }
    // Round up to a nice number
    if (max === 0) return 1000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [converted]);

  const barsAreaWidth = chartOuterWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const barGroupCount = converted.length || 1;
  const groupWidth = barsAreaWidth / barGroupCount;
  const barWidth = Math.max((groupWidth - BAR_GROUP_GAP * 2) / 2 - 1, 2);

  const visibleLabels = useMemo(
    () => getVisibleLabelIndices(converted.length, 6),
    [converted.length],
  );

  const barsAreaHeight = CHART_HEIGHT;

  return (
    <DarkCard style={styles.wrapper}>
      <Text style={styles.title}>{t('chart.income_vs_expenses')}</Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>{t('chart.income')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>{t('chart.expenses')}</Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={[styles.chartContainer, { width: chartOuterWidth }]}>
        {/* Y Axis */}
        <YAxisLabels maxValue={maxValue} height={barsAreaHeight} />

        {/* Bars area */}
        <View style={[styles.barsArea, { height: barsAreaHeight }]}>
          <GridLines height={barsAreaHeight} count={Y_TICK_COUNT} />

          {converted.map((datum, index) => {
            const expenseHeight =
              maxValue > 0 ? (datum.expenses / maxValue) * barsAreaHeight : 0;
            const incomeHeight =
              maxValue > 0 ? (datum.income / maxValue) * barsAreaHeight : 0;

            return (
              <View key={datum.month} style={[styles.barGroup, { width: groupWidth }]}>
                <View style={styles.barPair}>
                  {/* Income bar (right in RTL) */}
                  <View
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        height: Math.max(incomeHeight, 1),
                        backgroundColor: colors.success,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                      },
                    ]}
                  />
                  {/* Expense bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        height: Math.max(expenseHeight, 1),
                        backgroundColor: colors.error,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* X Axis labels */}
      <View
        style={[
          styles.xAxisContainer,
          { width: chartOuterWidth, paddingLeft: CHART_PADDING_LEFT },
        ]}
      >
        {converted.map((datum, index) => (
          <View key={datum.month} style={[styles.xLabelWrapper, { width: groupWidth }]}>
            {visibleLabels.has(index) && (
              <Text style={styles.xLabel} numberOfLines={1}>
                {datum.month}
              </Text>
            )}
          </View>
        ))}
      </View>
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  yAxis: {
    width: CHART_PADDING_LEFT - 4,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: colors.subtleBorder,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.subtleBorder,
  },
  barGroup: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GROUP_GAP,
  },
  bar: {
    minHeight: 1,
  },
  xAxisContainer: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  xLabelWrapper: {
    alignItems: 'center',
  },
  xLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
