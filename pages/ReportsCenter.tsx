import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { AppScreen, Project, Supplier, Currency } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

interface ReportsCenterProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  suppliers: Supplier[];
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const ReportsCenter: React.FC<ReportsCenterProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  globalCurrency,
  convertAmount,
}) => {
  const symbol = currencySymbols[globalCurrency];

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const totalIncome = projects.reduce((sum, p) => sum + (p.income || 0), 0);
    const totalTransactions = projects.reduce(
      (sum, p) => sum + p.expenses.length + (p.incomes || []).length,
      0
    );
    const suppliersWithDebt = suppliers.filter((s) => s.status === 'debt');
    const suppliersWithCredit = suppliers.filter((s) => s.status === 'credit');
    const totalDebt = suppliersWithDebt.reduce((sum, s) => sum + s.amount, 0);
    const totalCredit = suppliersWithCredit.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalBudget,
      totalSpent,
      totalIncome,
      totalTransactions,
      projectCount: projects.length,
      supplierCount: suppliers.length,
      debtCount: suppliersWithDebt.length,
      creditCount: suppliersWithCredit.length,
      totalDebt,
      totalCredit,
      netBalance: totalIncome - totalSpent,
    };
  }, [projects, suppliers]);

  const generateWhatsAppReport = (type: 'summary' | 'projects' | 'suppliers') => {
    let text = '';

    if (type === 'summary') {
      text = `*\u05D3\u05D5"\u05D7 \u05E1\u05D9\u05DB\u05D5\u05DD - MONNY*
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
*\u05E1\u05D4"\u05DB \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA:* ${symbol}${convertAmount(stats.totalIncome).toLocaleString()}
*\u05E1\u05D4"\u05DB \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA:* ${symbol}${convertAmount(stats.totalSpent).toLocaleString()}
*\u05D9\u05EA\u05E8\u05D4 \u05E0\u05D8\u05D5:* ${symbol}${convertAmount(stats.netBalance).toLocaleString()}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
*\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD:* ${stats.projectCount}
*\u05E1\u05E4\u05E7\u05D9\u05DD:* ${stats.supplierCount}
*\u05E2\u05E1\u05E7\u05D0\u05D5\u05EA:* ${stats.totalTransactions}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_\u05D4\u05D5\u05E4\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 MONNY_`;
    } else if (type === 'projects') {
      text = `*\u05D3\u05D5"\u05D7 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD - MONNY*
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${projects
        .map(
          (p) => `*${p.name}*
\u05EA\u05E7\u05E6\u05D9\u05D1: ${symbol}${convertAmount(p.budget).toLocaleString()}
\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA: ${symbol}${convertAmount(p.spent).toLocaleString()}
\u05D9\u05EA\u05E8\u05D4: ${symbol}${convertAmount(p.budget - p.spent).toLocaleString()}`
        )
        .join('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n')}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_\u05D4\u05D5\u05E4\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 MONNY_`;
    } else {
      const debtSuppliers = suppliers.filter((s) => s.status === 'debt');
      const creditSuppliers = suppliers.filter((s) => s.status === 'credit');
      text = `*\u05D3\u05D5"\u05D7 \u05E1\u05E4\u05E7\u05D9\u05DD - MONNY*
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
*\u05D7\u05D5\u05D1\u05D5\u05EA (${debtSuppliers.length}):*
${
        debtSuppliers
          .map(
            (s) =>
              `\u2022 ${s.name}: ${symbol}${convertAmount(s.amount).toLocaleString()}`
          )
          .join('\n') || '\u05D0\u05D9\u05DF \u05D7\u05D5\u05D1\u05D5\u05EA'
      }

*\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA (${creditSuppliers.length}):*
${
        creditSuppliers
          .map(
            (s) =>
              `\u2022 ${s.name}: ${symbol}${convertAmount(s.amount).toLocaleString()}`
          )
          .join('\n') || '\u05D0\u05D9\u05DF \u05D6\u05DB\u05D5\u05D9\u05D5\u05EA'
      }
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_\u05D4\u05D5\u05E4\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 MONNY_`;
    }

    const encoded = encodeURIComponent(text);
    Linking.openURL(`https://wa.me/?text=${encoded}`);
  };

  const reportTypes: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    desc: string;
    type: 'summary' | 'projects' | 'suppliers';
  }[] = [
    {
      icon: 'summarize',
      label: '\u05D3\u05D5"\u05D7 \u05E1\u05D9\u05DB\u05D5\u05DD',
      desc: '\u05E1\u05E7\u05D9\u05E8\u05D4 \u05DB\u05DC\u05DC\u05D9\u05EA \u05E9\u05DC \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD',
      type: 'summary',
    },
    {
      icon: 'folder-special',
      label: '\u05D3\u05D5"\u05D7 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD',
      desc: '\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DB\u05DC \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD',
      type: 'projects',
    },
    {
      icon: 'groups',
      label: '\u05D3\u05D5"\u05D7 \u05E1\u05E4\u05E7\u05D9\u05DD',
      desc: '\u05D7\u05D5\u05D1\u05D5\u05EA \u05D5\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA',
      type: 'suppliers',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerBtn, neuRaised]}
          onPress={() => goBack()}
        >
          <MaterialIcons name="arrow-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'\u05DE\u05E8\u05DB\u05D6 \u05D4\u05D3\u05D5"\u05D7\u05D5\u05EA'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={[styles.overviewCard, neuRaised]}>
          <Text style={styles.overviewTitle}>{'\u05E1\u05E7\u05D9\u05E8\u05D4 \u05DB\u05DC\u05DC\u05D9\u05EA'}</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{'\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA'}</Text>
              <Text style={[styles.overviewValue, { color: colors.success }]}>
                {symbol}
                {convertAmount(stats.totalIncome).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{'\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA'}</Text>
              <Text style={[styles.overviewValue, { color: colors.error }]}>
                {symbol}
                {convertAmount(stats.totalSpent).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
              <Text
                style={[
                  styles.overviewValue,
                  {
                    color: stats.netBalance >= 0 ? colors.success : colors.error,
                  },
                ]}
              >
                {symbol}
                {convertAmount(Math.abs(stats.netBalance)).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{'\u05E2\u05E1\u05E7\u05D0\u05D5\u05EA'}</Text>
              <Text style={[styles.overviewValue, { color: colors.primary }]}>
                {stats.totalTransactions}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, neuRaised]}>
            <View style={styles.quickStatIcon}>
              <MaterialIcons name="folder" size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickStatNumber}>{stats.projectCount}</Text>
            <Text style={styles.quickStatLabel}>{'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD'}</Text>
          </View>
          <View style={[styles.quickStatCard, neuRaised]}>
            <View style={styles.quickStatIcon}>
              <MaterialIcons name="warning" size={22} color={colors.error} />
            </View>
            <Text style={[styles.quickStatNumber, { color: colors.error }]}>
              {stats.debtCount}
            </Text>
            <Text style={styles.quickStatLabel}>{'\u05D7\u05D5\u05D1\u05D5\u05EA'}</Text>
          </View>
          <View style={[styles.quickStatCard, neuRaised]}>
            <View style={styles.quickStatIcon}>
              <MaterialIcons name="check-circle" size={22} color={colors.success} />
            </View>
            <Text style={[styles.quickStatNumber, { color: colors.success }]}>
              {stats.creditCount}
            </Text>
            <Text style={styles.quickStatLabel}>{'\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA'}</Text>
          </View>
        </View>

        {/* Report Types */}
        <View style={[styles.reportTypesCard, neuRaised]}>
          <View style={styles.reportTypesHeader}>
            <Text style={styles.reportTypesHeaderText}>
              {'\u05E9\u05DC\u05D7 \u05D3\u05D5"\u05D7 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4'}
            </Text>
          </View>
          {reportTypes.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.reportTypeItem,
                i < reportTypes.length - 1 && styles.reportTypeItemBorder,
              ]}
              onPress={() => generateWhatsAppReport(item.type)}
              activeOpacity={0.7}
            >
              <View style={styles.reportTypeIcon}>
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.reportTypeInfo}>
                <Text style={styles.reportTypeLabel}>{item.label}</Text>
                <Text style={styles.reportTypeDesc}>{item.desc}</Text>
              </View>
              <View style={styles.whatsappIcon}>
                <MaterialIcons name="chat" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Debt Summary */}
        {stats.debtCount > 0 && (
          <View style={[styles.debtSummaryCard, neuRaised]}>
            <View style={styles.debtSummaryHeader}>
              <Text style={styles.debtSummaryTitle}>{'\u05E1\u05D9\u05DB\u05D5\u05DD \u05D7\u05D5\u05D1\u05D5\u05EA'}</Text>
              <View style={styles.debtSummaryBadge}>
                <Text style={styles.debtSummaryBadgeText}>
                  {symbol}
                  {convertAmount(stats.totalDebt).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>
            </View>
            {suppliers
              .filter((s) => s.status === 'debt')
              .slice(0, 3)
              .map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  style={styles.debtSupplierRow}
                  onPress={() =>
                    onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)
                  }
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: supplier.avatar }}
                    style={styles.debtSupplierAvatar}
                  />
                  <View style={styles.debtSupplierInfo}>
                    <Text style={styles.debtSupplierName}>{supplier.name}</Text>
                    <Text style={styles.debtSupplierCategory}>
                      {supplier.category}
                    </Text>
                  </View>
                  <Text style={styles.debtSupplierAmount}>
                    {symbol}
                    {convertAmount(supplier.amount).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    gap: 20,
  },

  // Overview
  overviewCard: {
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewItem: {
    width: '47%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: radii.lg,
    padding: 16,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.neuBg,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickStatLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // Report Types
  reportTypesCard: {
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.neuBg,
  },
  reportTypesHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reportTypesHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  reportTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
  },
  reportTypeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  reportTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTypeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reportTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  reportTypeDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  whatsappIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Debt Summary
  debtSummaryCard: {
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  debtSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debtSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  debtSummaryBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  debtSummaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  debtSupplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginBottom: 8,
  },
  debtSupplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  debtSupplierInfo: {
    flex: 1,
  },
  debtSupplierName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  debtSupplierCategory: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  debtSupplierAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
});

export default ReportsCenter;
