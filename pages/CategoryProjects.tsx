import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen, Project, Currency, MainCategory, MAIN_CATEGORIES } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { FilterPills } from '../components/ui/FilterPills';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface CategoryProjectsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
  selectedCategory: MainCategory;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const categoryIcons: Record<MainCategory, React.ComponentProps<typeof MaterialIcons>['name']> = {
  projects: 'work',
  personal: 'person',
  other: 'category',
};

const CategoryProjects: React.FC<CategoryProjectsProps> = ({
  onNavigate,
  goBack,
  projects,
  globalCurrency,
  convertAmount,
  selectedCategory,
}) => {
  const [filter, setFilter] = useState('הכל');

  const categoryProjects = useMemo(() => {
    return projects.filter((p) => p.mainCategory === selectedCategory);
  }, [projects, selectedCategory]);

  const subCategories = ['הכל', ...Array.from(new Set(categoryProjects.map((p) => p.category)))];

  const filteredProjects = categoryProjects.filter(
    (p) => filter === 'הכל' || p.category === filter
  );

  const categoryTotals = useMemo(() => {
    const totalBudget = categoryProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = categoryProjects.reduce((sum, p) => sum + p.spent, 0);
    const totalIncome = categoryProjects.reduce(
      (sum, p) => sum + (p.incomes || []).reduce((s, i) => s + i.amount, 0),
      0,
    );
    return {
      budget: totalBudget,
      spent: totalSpent,
      income: totalIncome,
      remaining: totalIncome - totalSpent,
    };
  }, [categoryProjects]);

  const symbol = currencySymbols[globalCurrency];

  const formatAmount = (amount: number): string => {
    return convertAmount(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

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
          <View style={styles.headerTitleRow}>
            <View style={styles.categoryIcon}>
              <MaterialIcons
                name={categoryIcons[selectedCategory]}
                size={20}
                color={colors.white}
              />
            </View>
            <Text style={styles.headerTitle}>{MAIN_CATEGORIES[selectedCategory]}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary Card - Dashboard style */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{'יתרה'}</Text>
          <Text style={[styles.summaryAmount, { color: categoryTotals.remaining >= 0 ? colors.success : colors.error }]}>
            {categoryTotals.remaining < 0 ? '-' : ''}{symbol}{formatAmount(Math.abs(categoryTotals.remaining))}
          </Text>

          <View style={styles.subCardsRow}>
            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'תקציב'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.white }]}>
                {symbol}{formatAmount(categoryTotals.budget)}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'הכנסות'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.success }]}>
                {symbol}{formatAmount(categoryTotals.income)}
              </Text>
            </GlassCard>

            <GlassCard style={styles.subCard}>
              <Text style={styles.subCardLabel}>{'הוצאות'}</Text>
              <Text style={[styles.subCardAmount, { color: colors.error }]}>
                {symbol}{formatAmount(categoryTotals.spent)}
              </Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Filter Pills */}
        {subCategories.length > 1 && (
          <View style={styles.filterRow}>
            <FilterPills
              filters={subCategories}
              activeFilter={filter}
              onSelect={setFilter}
            />
          </View>
        )}
      </GradientHeader>

      {/* Dark Zone - Project List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProjects.length === 0 ? (
          <DarkCard style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="folder-off" size={40} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{'אין פרויקטים בקטגוריה זו'}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>{'צור פרויקט חדש'}</Text>
            </TouchableOpacity>
          </DarkCard>
        ) : (
          filteredProjects.map((project) => {
            const projectIncome = (project.incomes || []).reduce(
              (s, i) => s + i.amount, 0,
            );
            const percent =
              project.budget > 0
                ? Math.round((project.spent / project.budget) * 100)
                : 0;
            const remaining = projectIncome - project.spent;

            const statusColors = getStatusColors(project.status);
            const percentColors = getPercentColors(percent);

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
                      style={[styles.projectIconContainer, { backgroundColor: statusColors.bg }]}
                    >
                      <MaterialIcons
                        name="folder"
                        size={22}
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
                    <Text style={styles.amountLabel}>{'תקציב'}</Text>
                    <Text style={[styles.amountValue, { color: colors.textSecondary }]}>
                      {symbol}{formatAmount(project.budget)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{'הכנסות'}</Text>
                    <Text style={[styles.amountValue, { color: colors.success }]}>
                      {symbol}{formatAmount(projectIncome)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{'הוצאות'}</Text>
                    <Text style={[styles.amountValue, { color: colors.error }]}>
                      {symbol}{formatAmount(project.spent)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>{'יתרה'}</Text>
                    <Text style={[styles.amountValue, { color: remaining >= 0 ? colors.success : colors.error }]}>
                      {remaining < 0 ? '-' : ''}{symbol}{formatAmount(Math.abs(remaining))}
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
                  <View style={[styles.percentBadge, { backgroundColor: percentColors.bg }]}>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
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
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: spacing['2xl'],
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.black,
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
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
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

export default CategoryProjects;
