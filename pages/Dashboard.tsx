import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};
import { MaterialIcons } from '@expo/vector-icons';
import {
  AppScreen,
  Project,
  Currency,
  MainCategory,
  MAIN_CATEGORIES,
  Supplier,
} from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { CurrencyToggle } from '../components/ui/CurrencyToggle';
import { SectionHeader } from '../components/ui/SectionHeader';
import { TransactionRow } from '../components/ui/TransactionRow';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AvatarCircle } from '../components/ui/AvatarCircle';
import { EmptyState } from '../components/ui/EmptyState';

// Dashboard analytics widgets
import { KpiCards } from '../components/dashboard/KpiCards';
import { MonthlyBarChart } from '../components/dashboard/MonthlyBarChart';
import { CategoryDonut } from '../components/dashboard/CategoryDonut';
import { PaymentPieChart } from '../components/dashboard/PaymentPieChart';
import { TopSuppliersChart } from '../components/dashboard/TopSuppliersChart';
import { BudgetHealthCard } from '../components/dashboard/BudgetHealthCard';
import { InsightsCard } from '../components/dashboard/InsightsCard';
import {
  getMonthlyBreakdown,
  getMonthlyAverages,
  getMonthlyTrend,
  getExpensesByCategory,
  getIncomesByCategory,
  getPaymentMethodBreakdown,
  getTopSuppliers,
  getOverBudgetProjects,
  getOverallBudgetUsage,
  getVatSummary,
  getIncomeExpenseRatio,
  getBusiestMonth,
} from '../shared/lib/dashboardAnalytics';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface DashboardProps {
  onNavigate: (screen: AppScreen, id?: string, scan?: boolean, txType?: 'expense' | 'income') => void;
  goBack: () => void;
  projects: Project[];
  suppliers: Supplier[];
  totals: { budget: number; income: number; expenses: number; net: number };
  globalCurrency: Currency;
  setGlobalCurrency: (c: Currency) => void;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
  onLogout: () => void;
  userName?: string;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const categoryIcons: Record<MainCategory, IconName> = {
  projects: 'work',
  personal: 'person',
  other: 'category',
};

const formatNumber = (n: number): string =>
  Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  totals,
  globalCurrency,
  setGlobalCurrency,
  convertAmount,
  onLogout,
  userName,
}) => {
  const sym = currencySymbols[globalCurrency];

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  const allActivities = useMemo(() => {
    return projects
      .flatMap((p) => {
        const remaining = p.budget - p.spent;
        return [
          ...p.expenses.map((e) => ({
            ...e,
            projectName: p.name,
            projectId: p.id,
            projectRemaining: remaining,
            type: 'expense' as const,
          })),
          ...(p.incomes || []).map((i) => ({
            ...i,
            projectName: p.name,
            projectId: p.id,
            projectRemaining: remaining,
            type: 'income' as const,
          })),
        ];
      })
      .sort((a, b) => {
        const parseDate = (item: any) => {
          const dStr = item.date;
          if (!dStr) return 0;
          const dotParts = dStr.split('.');
          if (dotParts.length === 3) {
            const [day, month, year] = dotParts.map(Number);
            return new Date(year, month - 1, day).getTime();
          }
          const isoDate = new Date(dStr);
          if (!isNaN(isoDate.getTime())) return isoDate.getTime();
          return 0;
        };
        return parseDate(b) - parseDate(a);
      })
      .slice(0, 8);
  }, [projects]);

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return null;
    return suppliers.find((s) => s.id === supplierId)?.name || null;
  };

  const recentProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.expenses.length > 0 || (p.incomes || []).length > 0)
      .sort((a, b) => {
        const aLastId =
          [...a.expenses, ...(a.incomes || [])].sort((x, y) =>
            y.id.localeCompare(x.id),
          )[0]?.id || '';
        const bLastId =
          [...b.expenses, ...(b.incomes || [])].sort((x, y) =>
            y.id.localeCompare(x.id),
          )[0]?.id || '';
        return bLastId.localeCompare(aLastId);
      })
      .slice(0, 5);
  }, [projects]);

  const categoryTotals = useMemo(() => {
    const categories: MainCategory[] = ['projects', 'personal', 'other'];
    return categories.map((cat) => {
      const catProjects = projects.filter((p) => p.mainCategory === cat);
      const totalBudget = catProjects.reduce((sum, p) => sum + p.budget, 0);
      const totalSpent = catProjects.reduce((sum, p) => sum + p.spent, 0);
      const totalIncome = catProjects.reduce(
        (sum, p) => sum + (p.incomes || []).reduce((s, i) => s + i.amount, 0),
        0,
      );
      const remaining = totalBudget - totalSpent;
      return {
        category: cat,
        name: MAIN_CATEGORIES[cat],
        budget: totalBudget,
        spent: totalSpent,
        income: totalIncome,
        remaining,
        projectCount: catProjects.length,
      };
    });
  }, [projects]);

  // ---------------------------------------------------------------------------
  // Analytics data
  // ---------------------------------------------------------------------------

  const monthlyBreakdown = useMemo(() => getMonthlyBreakdown(projects), [projects]);
  const monthlyAverages = useMemo(() => getMonthlyAverages(projects), [projects]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(projects), [projects]);
  const expenseCategories = useMemo(() => getExpensesByCategory(projects), [projects]);
  const incomeCategories = useMemo(() => getIncomesByCategory(projects), [projects]);
  const paymentMethods = useMemo(() => getPaymentMethodBreakdown(projects), [projects]);
  const topSuppliersList = useMemo(() => getTopSuppliers(projects, suppliers, 5), [projects, suppliers]);
  const overBudgetProjects = useMemo(() => getOverBudgetProjects(projects), [projects]);
  const overallBudgetUsage = useMemo(() => getOverallBudgetUsage(projects), [projects]);
  const vatSummary = useMemo(() => getVatSummary(projects), [projects]);
  const incomeExpenseRatio = useMemo(() => getIncomeExpenseRatio(projects), [projects]);
  const busiestMonth = useMemo(() => getBusiestMonth(projects), [projects]);

  const totalTransactions = useMemo(() => {
    return projects.reduce(
      (sum, p) => sum + p.expenses.length + (p.incomes || []).length,
      0,
    );
  }, [projects]);

  const convertForWidget = useMemo(
    () => (amount: number) => convertAmount(amount),
    [convertAmount],
  );

  // ---------------------------------------------------------------------------
  // Menu items
  // ---------------------------------------------------------------------------

  const quickAccessItems: { id: string; label: string; icon: IconName; screen: AppScreen }[] = [
    { id: 'proj', label: 'פרויקט חדש', icon: 'create-new-folder', screen: AppScreen.ADD_PROJECT },
    { id: 'supp', label: 'ספק חדש', icon: 'person-add', screen: AppScreen.ADD_SUPPLIER },
    { id: 'all', label: 'כל הפרויקטים', icon: 'folder-open', screen: AppScreen.PROJECTS },
    { id: 'contacts', label: 'אנשי קשר', icon: 'contacts', screen: AppScreen.SUPPLIERS },
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const sendReminder = () => {
    const debtSuppliers = suppliers.filter((s) => s.status === 'debt' && s.phone);
    if (debtSuppliers.length === 0) {
      Alert.alert('', 'אין ספקים עם חובות לשליחת תזכורת');
      return;
    }
    const message = encodeURIComponent(
      'שלום, זוהי תזכורת ידידותית לגבי יתרת החוב שלך. אשמח לסגור את החשבון בהקדם. תודה!',
    );
    const firstSupplier = debtSuppliers[0];
    const cleanPhone = firstSupplier.phone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
    openExternalURL(`https://wa.me/972${phone}?text=${message}`);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>
      {/* ===== GRADIENT ZONE ===== */}
      <GradientHeader style={styles.gradientZone}>
        {/* Header row: greeting + currency toggle */}
        <View style={styles.headerRow}>
          <CurrencyToggle selected={globalCurrency} onSelect={setGlobalCurrency} />
          <Text style={styles.greeting}>
            {userName ? `שלום, ${userName}` : 'שלום,'}
          </Text>
        </View>

        {/* Summary GlassCard */}
        <GlassCard style={styles.summaryCard}>
          {/* Balance label + big amount */}
          <Text style={styles.summaryLabel}>{'יתרה'}</Text>
          <Text style={[styles.summaryAmount, { color: totals.net >= 0 ? colors.success : colors.error }]}>
            {totals.net < 0 ? '-' : ''}{sym}{formatNumber(convertAmount(Math.abs(totals.net)))}
          </Text>

          {/* Sub-cards row: budget + income + expenses */}
          <View style={styles.subCardsRow}>
            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'תקציב'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.white }]}>
                {sym}{formatNumber(convertAmount(totals.budget))}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'הכנסות'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.success }]}>
                {sym}{formatNumber(convertAmount(totals.income))}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'הוצאות'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.error }]}>
                {sym}{formatNumber(convertAmount(totals.expenses))}
              </Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigate(AppScreen.ADD_EXPENSE)}
            activeOpacity={0.85}
          >
            <GlassCard style={styles.quickActionCard}>
              <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(255,77,106,0.18)' }]}>
                <MaterialIcons name="remove-circle" size={26} color={colors.error} />
              </View>
              <View style={styles.quickActionTextWrap}>
                <Text style={styles.quickActionSmall}>{'הוספת'}</Text>
                <Text style={[styles.quickActionBig, { color: colors.error }]}>{'הוצאה'}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigate(AppScreen.ADD_INCOME)}
            activeOpacity={0.85}
          >
            <GlassCard style={styles.quickActionCard}>
              <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(0,232,143,0.18)' }]}>
                <MaterialIcons name="add-circle" size={26} color={colors.success} />
              </View>
              <View style={styles.quickActionTextWrap}>
                <Text style={styles.quickActionSmall}>{'הוספת'}</Text>
                <Text style={[styles.quickActionBig, { color: colors.success }]}>{'הכנסה'}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GradientHeader>

      {/* ===== DARK ZONE ===== */}
      <View style={styles.darkZone}>

        {/* ===== Categories – 3 cards in a row ===== */}
        <View style={styles.section}>
          <SectionHeader title={'קטגוריות'} />
          <View style={styles.categoryRow}>
            {categoryTotals.map((cat) => {
              const percentSpent =
                cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
              const status: 'ok' | 'warning' | 'over' =
                percentSpent > 100 ? 'over' : percentSpent > 80 ? 'warning' : 'ok';

              return (
                <DarkCard
                  key={cat.category}
                  style={styles.categoryCard}
                  onPress={() => onNavigate(AppScreen.CATEGORY_PROJECTS, cat.category)}
                >
                  <Text style={styles.categoryCardName} numberOfLines={1}>{cat.name}</Text>
                  <Text style={styles.categoryCardAmount}>
                    {cat.remaining < 0 ? '-' : ''}{sym}{formatNumber(convertAmount(Math.abs(cat.remaining)))}
                  </Text>
                  <StatusBadge status={status} size="sm" />
                  <ProgressBar
                    percentage={percentSpent}
                    status={status}
                    style={styles.categoryProgressBar}
                  />
                  <View style={styles.categoryCardFooter}>
                    <Text style={styles.categoryCardFooterPct}>{percentSpent}%</Text>
                    <Text style={styles.categoryCardFooterTotal}>
                      {sym}{formatNumber(convertAmount(cat.budget))}
                    </Text>
                  </View>
                </DarkCard>
              );
            })}
          </View>
        </View>

        {/* ===== Quick Access ===== */}
        <View style={styles.section}>
          <SectionHeader title={'גישה מהירה'} />
          <View style={styles.quickAccessRow}>
            {quickAccessItems.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAccessItem}
                onPress={() => onNavigate(action.screen)}
              >
                <DarkCard style={styles.quickAccessIconCard}>
                  <MaterialIcons name={action.icon} size={24} color={colors.primary} />
                </DarkCard>
                <Text style={styles.quickAccessLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Send reminder */}
            <TouchableOpacity style={styles.quickAccessItem} onPress={sendReminder}>
              <DarkCard style={styles.quickAccessIconCard}>
                <MaterialIcons name="notifications-active" size={24} color={colors.warning} />
              </DarkCard>
              <Text style={styles.quickAccessLabel}>{'שלח תזכורת'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Recent Activity ===== */}
        <View style={styles.section}>
          <SectionHeader title={'פעילות אחרונה'} />

          {allActivities.length === 0 ? (
            <DarkCard style={styles.emptyCard}>
              <EmptyState
                icon="history"
                message={'אין פעילות עדיין'}
              />
            </DarkCard>
          ) : (
            <DarkCard style={styles.activityCard}>
              {allActivities.slice(0, 5).map((act: any) => {
                const supplierName = getSupplierName(act.supplierId);
                const isIncome = act.type === 'income';
                const metaParts = [act.projectName];
                if (supplierName) metaParts.push(supplierName);
                return (
                  <TransactionRow
                    key={act.id}
                    icon={isIncome ? 'arrow-downward' : 'arrow-upward'}
                    iconColor={isIncome ? colors.success : colors.error}
                    title={act.title}
                    meta={metaParts.join(' \• ')}
                    amount={`${isIncome ? '+' : '-'}${sym}${formatNumber(convertAmount(act.amount))}`}
                    isIncome={isIncome}
                    onPress={() => onNavigate(AppScreen.ACTIVITY_DETAIL, act.id)}
                  />
                );
              })}
            </DarkCard>
          )}
        </View>

        {/* ===== Recent Projects ===== */}
        {recentProjects.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={'פרויקטים אחרונים'}
              linkText={'הצג הכל'}
              onLinkPress={() => onNavigate(AppScreen.PROJECTS)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.projectsScroll}
            >
              {recentProjects.map((project) => {
                const remaining = project.budget - project.spent;
                const percentUsed =
                  project.budget > 0
                    ? Math.round((project.spent / project.budget) * 100)
                    : 0;

                const badgeColor =
                  percentUsed > 100
                    ? colors.error
                    : percentUsed > 90
                      ? colors.warning
                      : colors.success;
                const badgeBg =
                  percentUsed > 100
                    ? 'rgba(255,77,106,0.15)'
                    : percentUsed > 90
                      ? 'rgba(255,176,32,0.15)'
                      : 'rgba(0,232,143,0.15)';

                return (
                  <DarkCard
                    key={project.id}
                    style={styles.projectCard}
                    onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
                  >
                    <View style={styles.projectCardTop}>
                      <View style={styles.projectIconWrap}>
                        <MaterialIcons
                          name={(project.icon as IconName) || 'folder'}
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={[styles.projectBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.projectBadgeText, { color: badgeColor }]}>
                          {percentUsed}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </Text>
                    <Text style={styles.projectCategory}>{project.category}</Text>

                    <View style={styles.projectBottom}>
                      <Text style={styles.tinyLabel}>{'יתרה'}</Text>
                      <Text
                        style={[
                          styles.projectRemainingValue,
                          { color: remaining >= 0 ? colors.success : colors.error },
                        ]}
                      >
                        {remaining < 0 ? '-' : ''}
                        {sym}
                        {formatNumber(convertAmount(Math.abs(remaining)))}
                      </Text>
                    </View>
                  </DarkCard>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ===== Suppliers Quick View ===== */}
        {suppliers.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={'ספקים'}
              linkText={'הצג הכל'}
              onLinkPress={() => onNavigate(AppScreen.SUPPLIERS)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suppliersScroll}
            >
              {suppliers.slice(0, 8).map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  style={styles.supplierItem}
                  onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)}
                >
                  <AvatarCircle name={supplier.name} size={44} />
                  <Text style={styles.supplierName} numberOfLines={1}>
                    {supplier.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ===== Analytics: KPI Cards ===== */}
        <View style={styles.section}>
          <SectionHeader title={'תובנות'} />
          <KpiCards
            avgExpenses={monthlyAverages.avgExpenses}
            avgIncome={monthlyAverages.avgIncome}
            avgSavings={monthlyAverages.avgSavings}
            ratio={incomeExpenseRatio}
            expenseTrend={monthlyTrend.expenseTrend}
            incomeTrend={monthlyTrend.incomeTrend}
            sym={sym}
            convertAmount={convertForWidget}
          />
        </View>

        {/* ===== Analytics: Monthly Bar Chart ===== */}
        <View style={styles.section}>
          <MonthlyBarChart
            data={monthlyBreakdown}
            sym={sym}
            convertAmount={convertForWidget}
          />
        </View>

        {/* ===== Analytics: Expense Categories ===== */}
        {expenseCategories.length > 0 && (
          <View style={styles.section}>
            <CategoryDonut
              data={expenseCategories}
              title={'פילוח הוצאות'}
              sym={sym}
              convertAmount={convertForWidget}
            />
          </View>
        )}

        {/* ===== Analytics: Income Categories ===== */}
        {incomeCategories.length > 0 && (
          <View style={styles.section}>
            <CategoryDonut
              data={incomeCategories}
              title={'פילוח הכנסות'}
              sym={sym}
              convertAmount={convertForWidget}
            />
          </View>
        )}

        {/* ===== Analytics: Payment Methods ===== */}
        {paymentMethods.length > 0 && (
          <View style={styles.section}>
            <PaymentPieChart
              data={paymentMethods}
              sym={sym}
              convertAmount={convertForWidget}
            />
          </View>
        )}

        {/* ===== Analytics: Top Suppliers ===== */}
        {topSuppliersList.length > 0 && (
          <View style={styles.section}>
            <TopSuppliersChart
              suppliers={topSuppliersList}
              sym={sym}
              convertAmount={convertForWidget}
            />
          </View>
        )}

        {/* ===== Analytics: Budget Health ===== */}
        <View style={styles.section}>
          <BudgetHealthCard
            overallUsage={overallBudgetUsage}
            overBudgetProjects={overBudgetProjects}
            sym={sym}
            convertAmount={convertForWidget}
            onNavigate={(screen, id) => onNavigate(AppScreen.PROJECT_DETAIL, id)}
          />
        </View>

        {/* ===== Analytics: Smart Insights ===== */}
        <View style={styles.section}>
          <InsightsCard
            vatSummary={vatSummary}
            busiestMonth={busiestMonth}
            totalTransactions={totalTransactions}
            sym={sym}
            convertAmount={convertForWidget}
          />
        </View>

        {/* Bottom spacing for BottomNav */}
        <View style={{ height: 32 }} />
      </View>
    </View>
  );
};

export default Dashboard;

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  /* ---- Gradient Zone ---- */
  gradientZone: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  /* ---- Summary GlassCard ---- */
  summaryCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    marginBottom: spacing.xs,
    writingDirection: 'rtl',
  },
  summaryAmount: {
    fontSize: 34,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  subCardsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  subCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  subCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: fonts.medium,
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  subCardAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    writingDirection: 'rtl',
  },

  /* ---- Quick Action Buttons (in gradient) ---- */
  quickActionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
  },
  quickActionCard: {
    padding: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickActionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTextWrap: {
    alignItems: 'flex-end',
  },
  quickActionSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    writingDirection: 'rtl',
  },
  quickActionBig: {
    fontSize: 15,
    fontFamily: fonts.bold,
    writingDirection: 'rtl',
  },

  /* ---- Dark Zone ---- */
  darkZone: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },

  /* ---- Category Cards (3 in a row) ---- */
  categoryRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  categoryCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 140,
  },
  categoryCardName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  categoryCardAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  categoryProgressBar: {
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
  },
  categoryCardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 2,
  },
  categoryCardFooterPct: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.semibold,
  },
  categoryCardFooterTotal: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
  },

  /* ---- Quick Access ---- */
  quickAccessRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  quickAccessItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickAccessIconCard: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
  },
  quickAccessLabel: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'center',
    maxWidth: 64,
  },

  /* ---- Activity ---- */
  emptyCard: {
    padding: spacing['2xl'],
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },

  /* ---- Recent Projects ---- */
  projectsScroll: {
    gap: spacing.md,
    paddingHorizontal: 2,
  },
  projectCard: {
    width: 130,
    padding: spacing.md,
  },
  projectCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  projectIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  projectBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  projectName: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 12,
    marginBottom: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  projectCategory: {
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  projectBottom: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
    alignItems: 'flex-end',
  },
  tinyLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  projectRemainingValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },

  /* ---- Suppliers ---- */
  suppliersScroll: {
    gap: spacing.xl,
    paddingHorizontal: 2,
  },
  supplierItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 56,
  },
  supplierName: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
