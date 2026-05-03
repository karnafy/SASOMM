import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppScreen, Project, Currency, MAIN_CATEGORIES, MainCategory } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { FilterPills } from '../components/ui/FilterPills';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface ProjectsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const ICON_MAP: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  folder: 'folder',
  work: 'work',
  home: 'home',
  build: 'build',
  brush: 'brush',
  landscape: 'landscape',
  apartment: 'apartment',
  engineering: 'engineering',
  construction: 'construction',
  handyman: 'handyman',
  plumbing: 'plumbing',
  electrical_services: 'electrical-services',
  roofing: 'roofing',
  foundation: 'foundation',
  fence: 'fence',
  deck: 'deck',
  garage: 'garage',
  pool: 'pool',
  solar_power: 'solar-power',
  ac_unit: 'ac-unit',
};

function getMaterialIconName(webIcon: string | undefined): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (!webIcon) return 'folder';
  // Convert underscore to hyphen for RN icon naming
  const rnName = webIcon.replace(/_/g, '-');
  if (ICON_MAP[webIcon]) return ICON_MAP[webIcon];
  // Try the hyphenated version directly
  return rnName as React.ComponentProps<typeof MaterialIcons>['name'];
}

const Projects: React.FC<ProjectsProps> = ({
  onNavigate,
  goBack,
  projects,
  globalCurrency,
  convertAmount,
}) => {
  const { t } = useTranslation();
  const ALL = t('projects_page.filter_all');
  const [filter, setFilter] = useState(ALL);

  const filterCategories = useMemo(() => {
    const filters = [ALL];
    const presentMains = new Set(projects.map((p) => p.mainCategory));
    (['projects', 'personal', 'other'] as MainCategory[]).forEach((cat) => {
      if (presentMains.has(cat)) filters.push(t(`main_categories.${cat}`));
    });
    return filters;
  }, [projects, t, ALL]);

  const lastActivityAt = (p: Project): number => {
    const dates: number[] = [];
    const pushDate = (raw: string | undefined): void => {
      if (!raw) return;
      const t = new Date(raw).getTime();
      if (!Number.isNaN(t)) dates.push(t);
    };
    pushDate((p as any).updated_at);
    pushDate((p as any).created_at);
    (p.expenses || []).forEach((e: any) => pushDate(e.created_at));
    (p.incomes || []).forEach((i: any) => pushDate(i.created_at));
    (p.history || []).forEach((a: any) => pushDate(a.date));
    return dates.length > 0 ? Math.max(...dates) : 0;
  };

  const filteredProjects = useMemo(() => {
    let list: Project[];
    if (filter === ALL) {
      list = projects;
    } else if (filter === t('main_categories.personal')) {
      list = projects.filter((p) => p.mainCategory === 'personal');
    } else if (filter === t('main_categories.other')) {
      list = projects.filter((p) => p.mainCategory === 'other');
    } else if (filter === t('main_categories.projects')) {
      list = projects.filter((p) => p.mainCategory === 'projects');
    } else {
      list = projects;
    }
    return [...list].sort((a, b) => lastActivityAt(b) - lastActivityAt(a));
  }, [projects, filter, t, ALL]);

  const formatAmount = (amount: number): string => {
    return convertAmount(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const totals = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const totalIncome = projects.reduce(
      (sum, p) => sum + (p.incomes || []).reduce((s, i) => s + i.amount, 0),
      0,
    );
    return {
      budget: totalBudget,
      spent: totalSpent,
      income: totalIncome,
      remaining: totalIncome - totalSpent,
    };
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

  const getStatusColors = (status: Project['status']) => {
    switch (status) {
      case 'over':
        return { bg: colors.error + '1A', text: colors.error };
      case 'warning':
        return { bg: colors.warning + '1A', text: colors.warning };
      default:
        return { bg: colors.primary + '1A', text: colors.primary };
    }
  };

  const getPercentColors = (percent: number) => {
    if (percent > 100) return { bg: colors.error + '1A', text: colors.error };
    if (percent > 90) return { bg: colors.warning + '1A', text: colors.warning };
    return { bg: colors.success + '1A', text: colors.success };
  };

  const sym = currencySymbols[globalCurrency];

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <GradientHeader style={styles.gradientHeader}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('projects_page.page_title')}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary Card - same layout as Dashboard */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('projects_page.card_balance')}</Text>
          <Text style={[styles.summaryAmount, { color: totals.remaining >= 0 ? colors.success : colors.error }]}>
            {totals.remaining < 0 ? '-' : ''}{sym}{formatAmount(Math.abs(totals.remaining))}
          </Text>

          <View style={styles.subCardsRow}>
            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{t('projects_page.card_budget')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.white }]}>
                {sym}{formatAmount(totals.budget)}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{t('projects_page.card_income')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.success }]}>
                {sym}{formatAmount(totals.income)}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{t('projects_page.card_expenses')}</Text>
              <Text style={[styles.subCardAmount, { color: colors.error }]}>
                {sym}{formatAmount(totals.spent)}
              </Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <FilterPills
            filters={filterCategories}
            activeFilter={filter}
            onSelect={setFilter}
          />
        </View>
      </GradientHeader>

      {/* Dark Zone - Category Cards + Project Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3 main category summary cards (matches Dashboard) */}
        <View style={styles.categoryRow}>
          {categoryTotals.map((cat) => {
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
                <Text style={styles.categoryCardName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.categoryCardCount} numberOfLines={1}>
                  {t(cat.projectCount === 1 ? 'category.project_count_one' : 'category.project_count_other', { count: cat.projectCount })}
                </Text>
                <Text style={styles.categoryCardAmount}>
                  {cat.remaining < 0 ? '-' : ''}{sym}{formatAmount(Math.abs(cat.remaining))}
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
                    {sym}{formatAmount(cat.budget)}
                  </Text>
                </View>
              </DarkCard>
            );
          })}
        </View>

        {filteredProjects.length === 0 ? (
          <DarkCard style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="folder-off" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{t('projects_page.no_projects')}</Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyAddButtonText}>{t('projects_page.create_new')}</Text>
            </TouchableOpacity>
          </DarkCard>
        ) : (
          filteredProjects.map((project) => {
            const projectIncome = (project.incomes || []).reduce(
              (s, i) => s + i.amount,
              0,
            );
            const percent =
              project.budget > 0
                ? Math.round((project.spent / project.budget) * 100)
                : 0;
            const remaining = projectIncome - project.spent;
            const statusColors = getStatusColors(project.status);
            const percentColors = getPercentColors(percent);

            // Map Project status type to StatusBadge status type
            const badgeStatus: 'ok' | 'warning' | 'over' =
              project.status === 'over' ? 'over'
              : project.status === 'warning' ? 'warning'
              : 'ok';

            return (
              <DarkCard
                key={project.id}
                style={styles.projectCard}
                onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
              >
                {/* Card Top Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.projectIconContainer,
                        { backgroundColor: statusColors.bg },
                      ]}
                    >
                      <MaterialIcons
                        name={getMaterialIconName(project.icon)}
                        size={20}
                        color={statusColors.text}
                      />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <Text style={styles.projectCategory}>{project.category}</Text>
                    </View>
                  </View>
                  <StatusBadge status={badgeStatus} size="sm" />
                </View>

                {/* Amounts Row */}
                <View style={styles.amountsRow}>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{t('projects_page.card_budget')}</Text>
                    <Text style={[styles.amountValue, { color: colors.textSecondary }]}>
                      {sym}{formatAmount(project.budget)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{t('projects_page.card_income')}</Text>
                    <Text style={[styles.amountValue, { color: colors.success }]}>
                      {sym}{formatAmount(projectIncome)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{t('projects_page.card_expenses')}</Text>
                    <Text style={[styles.amountValue, { color: colors.error }]}>
                      {sym}{formatAmount(project.spent)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{t('projects_page.card_balance')}</Text>
                    <Text style={[styles.amountValue, { color: remaining >= 0 ? colors.success : colors.error }]}>
                      {remaining < 0 ? '-' : ''}{sym}{formatAmount(Math.abs(remaining))}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <ProgressBar
                  percentage={percent}
                  status={badgeStatus}
                  style={styles.progressBar}
                />

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.percentBadge,
                      { backgroundColor: percentColors.bg },
                    ]}
                  >
                    <Text style={[styles.percentText, { color: percentColors.text }]}>
                      {percent}%
                    </Text>
                  </View>
                  <Text style={styles.updatedText}>
                    {project.expenses.length > 0
                      ? project.expenses[project.expenses.length - 1].date
                      : ''}
                  </Text>
                </View>
              </DarkCard>
            );
          })
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

  // Gradient Header
  gradientHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary Card (Dashboard style)
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

  // Filter Row
  filterRow: {
    marginBottom: spacing.sm,
  },

  // Category cards (3 main categories — same look as Dashboard)
  categoryRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 150,
  },
  categoryCardName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    marginBottom: 2,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  categoryCardCount: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },

  // Empty State
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: radii['2xl'],
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    marginBottom: spacing['2xl'],
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  emptyAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  emptyAddButtonText: {
    color: colors.black,
    fontFamily: fonts.semibold,
    fontSize: 14,
    writingDirection: 'rtl',
  },

  // Project Card
  projectCard: {
    borderRadius: radii['2xl'],
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  projectIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  projectCategory: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },

  // Amounts
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  amountCol: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 3,
    writingDirection: 'rtl',
  },
  amountValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },

  // Progress Bar
  progressBar: {
    marginBottom: spacing.md,
    height: 6,
    borderRadius: 3,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  percentText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  updatedText: {
    fontSize: 9,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
});

export default Projects;
