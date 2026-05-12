import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const sym = currencySymbols[globalCurrency];

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  const allActivities = useMemo(() => {
    return projects
      .flatMap((p) => {
        const pIncome = (p.incomes || []).reduce((s, i) => s + i.amount, 0);
        const remaining = pIncome - p.spent;
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
      const remaining = totalIncome - totalSpent;

      // Last activity timestamp across all transactions in this category
      let lastActivity = 0;
      catProjects.forEach((p) => {
        (p.expenses || []).forEach((e: any) => {
          const t = new Date(e.created_at || 0).getTime();
          if (!Number.isNaN(t) && t > lastActivity) lastActivity = t;
        });
        (p.incomes || []).forEach((i: any) => {
          const t = new Date(i.created_at || 0).getTime();
          if (!Number.isNaN(t) && t > lastActivity) lastActivity = t;
        });
      });

      return {
        category: cat,
        name: t(`main_categories.${cat}`),
        budget: totalBudget,
        spent: totalSpent,
        income: totalIncome,
        remaining,
        projectCount: catProjects.length,
        lastActivity, // ms timestamp; 0 if no activity
      };
    });
  }, [projects]);

  const overallLastActivity = useMemo(() => {
    let latest = 0;
    projects.forEach((p) => {
      (p.expenses || []).forEach((e: any) => {
        const t = new Date(e.created_at || 0).getTime();
        if (!Number.isNaN(t) && t > latest) latest = t;
      });
      (p.incomes || []).forEach((i: any) => {
        const t = new Date(i.created_at || 0).getTime();
        if (!Number.isNaN(t) && t > latest) latest = t;
      });
    });
    return latest;
  }, [projects]);

  const formatLastActivity = (ts: number): string => {
    if (!ts) return '';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mn = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mn} ${dd}.${mm}.${yyyy}`;
  };

  // ---------------------------------------------------------------------------
  // Analytics data
  // ---------------------------------------------------------------------------

  const monthlyBreakdown = useMemo(() => {
    // getMonthlyBreakdown returns Hebrew month names by default.
    // Re-map them to the active locale via the months_full array.
    const raw = getMonthlyBreakdown(projects);
    const localized = (t('months_full', { returnObjects: true }) as string[]) || [];
    return raw.map((row) => {
      const [, mm] = row.monthKey.split('-');
      const idx = parseInt(mm, 10) - 1;
      const localizedMonth = localized[idx] || row.month;
      return { ...row, month: localizedMonth };
    });
  }, [projects, t]);
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
    { id: 'proj', label: t('quick.new_project'), icon: 'create-new-folder', screen: AppScreen.ADD_PROJECT },
    { id: 'supp', label: t('quick.new_supplier'), icon: 'person-add', screen: AppScreen.ADD_SUPPLIER },
    { id: 'debt', label: t('quick.new_debt'), icon: 'receipt-long', screen: AppScreen.ADD_DEBT },
    { id: 'contacts', label: t('quick.contacts'), icon: 'contacts', screen: AppScreen.SUPPLIERS },
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const sendReminder = () => {
    onNavigate(AppScreen.SEND_REMINDER);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>
      {/* ===== GRADIENT ZONE ===== */}
      <GradientHeader style={styles.gradientZone}>
        {/* Currency toggle row (above greeting) */}
        <View style={styles.currencyRow}>
          <CurrencyToggle selected={globalCurrency} onSelect={setGlobalCurrency} />
        </View>

        {/* Greeting row (below currency) */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>
            {userName ? t('greeting.with_name', { name: userName }) : t('greeting.no_name')}
          </Text>
        </View>

        {/* System message banner — last activity */}
        {overallLastActivity > 0 && (
          <View style={styles.systemBanner}>
            <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.65)" />
            <Text style={styles.systemBannerText}>
              {t('system.last_activity_at', { when: formatLastActivity(overallLastActivity) })}
            </Text>
          </View>
        )}

        {/* Summary GlassCard */}
        <GlassCard style={styles.summaryCard}>
          {/* Balance label + big amount */}
          <Text style={styles.summaryLabel}>{t('summary.balance')}</Text>
          <Text style={[styles.summaryAmount, { color: totals.net >= 0 ? colors.success : colors.error }]}>
            {totals.net < 0 ? '-' : ''}{sym}{formatNumber(convertAmount(Math.abs(totals.net)))}
          </Text>

          {/* Sub-cards row: budget + income + expenses */}
          <View style={styles.subCardsRow}>
            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel} numberOfLines={1}>{t('summary.budget')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {sym}{formatNumber(convertAmount(totals.budget))}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel} numberOfLines={1}>{t('summary.income')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {sym}{formatNumber(convertAmount(totals.income))}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel} numberOfLines={1}>{t('summary.expenses')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.error }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {sym}{formatNumber(convertAmount(totals.expenses))}
              </Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Big Action Buttons — full-width income/expense buttons (per design) */}
        <View style={styles.bigActionRow}>
          <TouchableOpacity
            style={[styles.bigActionBtn, styles.bigActionExpense]}
            onPress={() => onNavigate(AppScreen.ADD_EXPENSE)}
            activeOpacity={0.8}
          >
            <Text style={styles.bigActionLabel}>{t('actions.expense')}</Text>
            <MaterialIcons name="remove-circle-outline" size={28} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigActionBtn, styles.bigActionIncome]}
            onPress={() => onNavigate(AppScreen.ADD_INCOME)}
            activeOpacity={0.8}
          >
            <Text style={styles.bigActionLabel}>{t('actions.income')}</Text>
            <MaterialIcons name="add-circle-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
      </GradientHeader>

      {/* ===== DARK ZONE ===== */}
      <View style={styles.darkZone}>

        {/* ===== Categories – 3 cards in a row ===== */}
        <View style={styles.section}>
          <SectionHeader title={t('sections.projects')} />
          <View style={styles.categoryRow}>
            {categoryTotals.map((cat) => {
              // Bar shows balance vs budget: positive = how close to budget (green from left),
              // negative = deficit (red from right).
              const percentOfBudget =
                cat.budget > 0 ? Math.round((cat.remaining / cat.budget) * 100) : 0;
              const isDeficit = percentOfBudget < 0;
              const pctColor = isDeficit ? colors.error : colors.success;

              return (
                <DarkCard
                  key={cat.category}
                  style={styles.categoryCard}
                  onPress={() => onNavigate(AppScreen.CATEGORY_PROJECTS, cat.category)}
                >
                  <Text style={styles.categoryCardName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t(`main_categories.${cat.category}`)}</Text>
                  <Text style={styles.categoryCardAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                    {cat.remaining < 0 ? '-' : ''}{sym}{formatNumber(convertAmount(Math.abs(cat.remaining)))}
                  </Text>
                  <ProgressBar
                    percentage={percentOfBudget}
                    signed
                    style={styles.categoryProgressBar}
                  />
                  <View style={styles.categoryCardFooter}>
                    <Text style={[styles.categoryCardFooterPct, { color: pctColor }]}>
                      {percentOfBudget > 0 ? '+' : ''}{percentOfBudget}%
                    </Text>
                    <Text style={styles.categoryCardFooterTotal}>
                      {sym}{formatNumber(convertAmount(cat.budget))}
                    </Text>
                  </View>
                  {cat.lastActivity > 0 && (
                    <Text style={styles.categoryCardLastActivity} numberOfLines={1}>
                      {t('category.last_activity', { when: formatLastActivity(cat.lastActivity) })}
                    </Text>
                  )}
                </DarkCard>
              );
            })}
          </View>
        </View>

        {/* ===== Quick Access ===== */}
        <View style={styles.section}>
          <SectionHeader title={t('sections.quick_access')} />
          <View style={styles.quickAccessRow}>
            {quickAccessItems.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAccessItem}
                onPress={() => onNavigate(action.screen)}
              >
                <DarkCard style={styles.quickAccessIconCard}>
                  <MaterialIcons
                    name={action.icon}
                    size={26}
                    color={action.id === 'debt' ? colors.warning : colors.primary}
                  />
                </DarkCard>
                <Text style={styles.quickAccessLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Send reminder */}
            <TouchableOpacity style={styles.quickAccessItem} onPress={sendReminder}>
              <DarkCard style={styles.quickAccessIconCard}>
                <MaterialIcons name="notifications-active" size={26} color={colors.primary} />
              </DarkCard>
              <Text style={styles.quickAccessLabel}>{t('quick.send_reminder')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Recent Activity ===== */}
        <View style={styles.section}>
          <SectionHeader title={t('sections.recent_activity')} />

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
                // Prefer the supplier name (who was paid) as the primary
                // title — that's what the user actually scans for. Fall
                // back to the entry's own title only when no supplier is
                // linked.
                const primaryTitle = supplierName || act.title || '—';
                // Meta line: project • category (tag). Skip blanks.
                const metaParts: string[] = [];
                if (act.projectName) metaParts.push(act.projectName);
                if (act.tag && act.tag !== primaryTitle) metaParts.push(act.tag);
                // If we promoted the supplier into the title, the original
                // title (e.g. "מיסים" / "כללי") still carries useful info —
                // append it as a tail meta token unless it duplicates the
                // tag we already added.
                if (
                  supplierName &&
                  act.title &&
                  act.title !== act.tag &&
                  act.title !== supplierName
                ) {
                  metaParts.push(act.title);
                }
                return (
                  <TransactionRow
                    key={act.id}
                    icon={isIncome ? 'arrow-downward' : 'arrow-upward'}
                    iconColor={isIncome ? colors.success : colors.error}
                    title={primaryTitle}
                    meta={metaParts.join(' \• ')}
                    amount={`${isIncome ? '+' : '-'}${sym}${formatNumber(convertAmount(act.amount))}${act.originalCurrency && act.originalCurrency !== 'ILS' ? ` (${currencySymbols[act.originalCurrency as Currency]}${act.originalAmount?.toLocaleString()})` : ''}`}
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
                const pIncome = (project.incomes || []).reduce((s, i) => s + i.amount, 0);
                const remaining = pIncome - project.spent;
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
              title={t('chart.expense_breakdown')}
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
              title={t('chart.income_breakdown')}
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
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  currencyRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  greetingRow: {
    marginBottom: spacing.sm,
  },
  systemBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.sm,
  },
  systemBannerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
  greeting: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },

  /* ---- Summary GlassCard ---- */
  summaryCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    alignItems: 'stretch',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    marginBottom: spacing.xs,
    // Visually right in both LTR and RTL — RN auto-flips 'left'/'right'
    // in RTL native, so we pick the value that resolves to right.
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  summaryAmount: {
    fontSize: 34,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: spacing.lg,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  subCardsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  subCard: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'stretch',
    minWidth: 0,
  },
  subCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: fonts.medium,
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  subCardAmount: {
    fontSize: 13,
    fontFamily: fonts.bold,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
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

  /* ---- Big income/expense buttons (per design) ---- */
  bigActionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  bigActionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 22,
    borderRadius: radii['2xl'],
    borderWidth: 1.5,
  },
  bigActionIncome: {
    backgroundColor: 'rgba(0,232,143,0.85)',
    borderColor: 'rgba(0,232,143,0.95)',
    shadowColor: '#00E88F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  bigActionExpense: {
    backgroundColor: 'rgba(255,77,106,0.85)',
    borderColor: 'rgba(255,77,106,0.95)',
    shadowColor: '#FF4D6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  bigActionLabel: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
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
    fontSize: 22,
    color: colors.white,
    fontFamily: fonts.extrabold,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.3,
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
  categoryCardLastActivity: {
    fontSize: 9,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    marginTop: 6,
    writingDirection: 'rtl',
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  /* ---- Quick Access ---- */
  quickAccessRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  quickAccessItem: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  // Semi-transparent icon card with primary glow (per design).
  // Sized so 5 tiles fit on a ~360-380px wide phone without overlap.
  quickAccessIconCard: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: 'rgba(0,217,217,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.30)',
    shadowColor: '#00D9D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAccessLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 70,
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
