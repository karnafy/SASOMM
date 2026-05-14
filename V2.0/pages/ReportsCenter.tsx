import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};
import { AppScreen, Project, Supplier, Currency } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';

interface ReportsCenterProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  suppliers: Supplier[];
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const ReportsCenter: React.FC<ReportsCenterProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  globalCurrency,
  convertAmount,
}) => {
  const { t } = useTranslation();
  const symbol = currencySymbols[globalCurrency];

  const stats = useMemo(() => {
    // Budget is stored in each project's own currency — normalize to ILS for the sum.
    const totalBudget = projects.reduce(
      (sum, p) => sum + convertAmount(p.budget, p.budgetCurrency || 'ILS', 'ILS'),
      0
    );
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
  }, [projects, suppliers, convertAmount]);

  const generateWhatsAppReport = (type: 'summary' | 'projects' | 'suppliers') => {
    let text = '';

    if (type === 'summary') {
      text = `*דו"ח סיכום - SASOMM*
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
*סה"כ הכנסות:* ${symbol}${convertAmount(stats.totalIncome).toLocaleString()}
*סה"כ הוצאות:* ${symbol}${convertAmount(stats.totalSpent).toLocaleString()}
*יתרה נטו:* ${symbol}${convertAmount(stats.netBalance).toLocaleString()}
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
*פרויקטים:* ${stats.projectCount}
*ספקים:* ${stats.supplierCount}
*עסקאות:* ${stats.totalTransactions}
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
_הופק על ידי SASOMM_`;
    } else if (type === 'projects') {
      text = `*דו"ח פרויקטים - SASOMM*
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
${projects
        .map((p) => {
          const pIncome = (p.incomes || []).reduce((s, i) => s + i.amount, 0);
          return `*${p.name}*
תקציב: ${symbol}${convertAmount(p.budget, p.budgetCurrency || 'ILS', globalCurrency).toLocaleString()}
הכנסות: ${symbol}${convertAmount(pIncome).toLocaleString()}
הוצאות: ${symbol}${convertAmount(p.spent).toLocaleString()}
יתרה: ${symbol}${convertAmount(pIncome - p.spent).toLocaleString()}`;
        })
        .join('\n\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\n')}
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
_הופק על ידי SASOMM_`;
    } else {
      const debtSuppliers = suppliers.filter((s) => s.status === 'debt');
      const creditSuppliers = suppliers.filter((s) => s.status === 'credit');
      text = `*דו"ח ספקים - SASOMM*
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
*חובות (${debtSuppliers.length}):*
${
        debtSuppliers
          .map(
            (s) =>
              `\• ${s.name}: ${symbol}${convertAmount(s.amount).toLocaleString()}`
          )
          .join('\n') || 'אין חובות'
      }

*זכויות (${creditSuppliers.length}):*
${
        creditSuppliers
          .map(
            (s) =>
              `\• ${s.name}: ${symbol}${convertAmount(s.amount).toLocaleString()}`
          )
          .join('\n') || 'אין זכויות'
      }
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
_הופק על ידי SASOMM_`;
    }

    const encoded = encodeURIComponent(text);
    openExternalURL(`https://wa.me/?text=${encoded}`);
  };

  const reportTypes: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    desc: string;
    type: 'summary' | 'projects' | 'suppliers';
  }[] = [
    {
      icon: 'summarize',
      label: t('reports_center.report_summary'),
      desc: t('reports_center.report_summary_desc'),
      type: 'summary',
    },
    {
      icon: 'folder-special',
      label: t('reports_center.report_projects'),
      desc: t('reports_center.report_projects_desc'),
      type: 'projects',
    },
    {
      icon: 'groups',
      label: t('reports_center.report_suppliers'),
      desc: t('reports_center.report_suppliers_desc'),
      type: 'suppliers',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <GradientHeader>
        <ScreenTopBar title={t('reports_center.page_title')} onBack={goBack} />
      </GradientHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats - 2x2 GlassCard grid */}
        <View style={styles.overviewGrid}>
          <GlassCard style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>{t('reports_center.income')}</Text>
            <Text style={[styles.overviewValue, { color: colors.success }]}>
              {symbol}
              {convertAmount(stats.totalIncome).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </GlassCard>

          <GlassCard style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>{t('reports_center.expenses')}</Text>
            <Text style={[styles.overviewValue, { color: colors.error }]}>
              {symbol}
              {convertAmount(stats.totalSpent).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </GlassCard>

          <GlassCard style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>{t('reports_center.budget')}</Text>
            <Text style={[styles.overviewValue, { color: colors.info }]}>
              {symbol}
              {convertAmount(stats.totalBudget).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </GlassCard>

          <GlassCard style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>{t('reports_center.net_balance')}</Text>
            <Text
              style={[
                styles.overviewValue,
                { color: stats.netBalance >= 0 ? colors.success : colors.error },
              ]}
            >
              {symbol}
              {convertAmount(Math.abs(stats.netBalance)).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </GlassCard>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <DarkCard style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <MaterialIcons name="folder" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.projectCount}</Text>
            <Text style={styles.statLabel}>{t('reports_center.projects')}</Text>
          </DarkCard>

          <DarkCard style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <MaterialIcons name="groups" size={20} color={colors.accent} />
            </View>
            <Text style={styles.statNumber}>{stats.supplierCount}</Text>
            <Text style={styles.statLabel}>{t('reports_center.suppliers')}</Text>
          </DarkCard>

          <DarkCard style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <MaterialIcons name="receipt-long" size={20} color={colors.info} />
            </View>
            <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>{t('reports_center.transactions')}</Text>
          </DarkCard>
        </View>

        {/* Export / WhatsApp Buttons */}
        <DarkCard style={styles.exportCard}>
          <View style={styles.exportHeader}>
            <Text style={styles.exportHeaderText}>
              {t('reports_center.send_whatsapp')}
            </Text>
          </View>
          {reportTypes.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.exportItem,
                i < reportTypes.length - 1 && styles.exportItemBorder,
              ]}
              onPress={() => generateWhatsAppReport(item.type)}
              activeOpacity={0.7}
            >
              <View style={styles.exportIconWrapper}>
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.exportInfo}>
                <Text style={styles.exportLabel}>{item.label}</Text>
                <Text style={styles.exportDesc}>{item.desc}</Text>
              </View>
              <View style={styles.whatsappBadge}>
                <MaterialIcons name="chat" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          ))}
        </DarkCard>

        {/* Debt Summary */}
        {stats.debtCount > 0 && (
          <DarkCard style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtTitle}>{t('reports_center.debts_summary')}</Text>
              <View style={styles.debtBadge}>
                <Text style={styles.debtBadgeText}>
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
                  style={styles.debtRow}
                  onPress={() =>
                    onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)
                  }
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: supplier.avatar }}
                    style={styles.debtAvatar}
                  />
                  <View style={styles.debtInfo}>
                    <Text style={styles.debtName}>{supplier.name}</Text>
                    <Text style={styles.debtCategory}>
                      {supplier.category}
                    </Text>
                  </View>
                  <Text style={styles.debtAmount}>
                    {symbol}
                    {convertAmount(supplier.amount).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
          </DarkCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: 16,
  },

  // Overview 2x2 grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewItem: {
    width: '47.5%',
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  overviewLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    writingDirection: 'rtl',
    fontFamily: fonts.semibold,
  },
  overviewValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    marginTop: 2,
  },

  // Export card
  exportCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  exportHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  exportHeaderText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
  },
  exportItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  exportIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  exportLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  exportDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  whatsappBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,232,143,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Debt summary
  debtCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debtTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  debtBadge: {
    backgroundColor: 'rgba(255,77,106,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  debtBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.error,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    marginBottom: 8,
  },
  debtAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  debtCategory: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  debtAmount: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.error,
  },
});

export default ReportsCenter;
