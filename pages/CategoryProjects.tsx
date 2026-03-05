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
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

interface CategoryProjectsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
  selectedCategory: MainCategory;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
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
  const [filter, setFilter] = useState('\u05D4\u05DB\u05DC');

  const categoryProjects = useMemo(() => {
    return projects.filter((p) => p.mainCategory === selectedCategory);
  }, [projects, selectedCategory]);

  const subCategories = ['\u05D4\u05DB\u05DC', ...Array.from(new Set(categoryProjects.map((p) => p.category)))];

  const filteredProjects = categoryProjects.filter(
    (p) => filter === '\u05D4\u05DB\u05DC' || p.category === filter
  );

  const categoryTotals = useMemo(() => {
    const totalBudget = categoryProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = categoryProjects.reduce((sum, p) => sum + p.spent, 0);
    return {
      budget: totalBudget,
      spent: totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }, [categoryProjects]);

  const symbol = currencySymbols[globalCurrency];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.headerBtn, neuRaised]}
            onPress={() => goBack()}
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
            style={[styles.addBtn]}
            onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
          >
            <MaterialIcons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, neuRaised]}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{'\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA'}</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {symbol}
                {convertAmount(categoryTotals.spent).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryItemBorder]}>
              <Text style={styles.summaryLabel}>{'\u05EA\u05E7\u05E6\u05D9\u05D1'}</Text>
              <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                {symbol}
                {convertAmount(categoryTotals.budget).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      categoryTotals.remaining >= 0 ? colors.success : colors.error,
                  },
                ]}
              >
                {categoryTotals.remaining < 0 && '-'}
                {symbol}
                {convertAmount(Math.abs(categoryTotals.remaining)).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        {subCategories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {subCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterPill,
                  filter === cat ? styles.filterPillActive : [neuRaised, styles.filterPillInactive],
                ]}
                onPress={() => setFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filter === cat
                      ? styles.filterPillTextActive
                      : styles.filterPillTextInactive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Project List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProjects.length === 0 ? (
          <View style={[styles.emptyCard, neuRaised]}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="folder-off" size={40} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{'\u05D0\u05D9\u05DF \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05D1\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4 \u05D6\u05D5'}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
            >
              <Text style={styles.emptyBtnText}>{'\u05E6\u05D5\u05E8 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05D7\u05D3\u05E9'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const percent =
              project.budget > 0
                ? Math.round((project.spent / project.budget) * 100)
                : 0;
            const remaining = project.budget - project.spent;

            const statusColor =
              project.status === 'over'
                ? colors.error
                : project.status === 'warning'
                ? colors.warning
                : colors.primary;

            const statusBg =
              project.status === 'over'
                ? 'rgba(239,68,68,0.1)'
                : project.status === 'warning'
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(0,217,217,0.1)';

            const percentBg =
              percent > 100
                ? 'rgba(239,68,68,0.1)'
                : percent > 90
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(16,185,129,0.1)';

            const percentColor =
              percent > 100 ? colors.error : percent > 90 ? colors.warning : colors.success;

            return (
              <TouchableOpacity
                key={project.id}
                style={[styles.projectCard, neuRaised]}
                onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
                activeOpacity={0.85}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectTitleRow}>
                    <View
                      style={[styles.projectIcon, { backgroundColor: statusBg }]}
                    >
                      <MaterialIcons
                        name="folder"
                        size={22}
                        color={statusColor}
                      />
                    </View>
                    <View style={styles.projectTitleInfo}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <Text style={styles.projectCategory}>{project.category}</Text>
                    </View>
                  </View>
                  <View style={[styles.percentBadge, { backgroundColor: percentBg }]}>
                    <Text style={[styles.percentText, { color: percentColor }]}>
                      {percent}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>

                {/* Stats */}
                <View style={styles.projectStats}>
                  <View>
                    <Text style={styles.statLabel}>{'\u05EA\u05E7\u05E6\u05D9\u05D1'}</Text>
                    <Text style={styles.statValue}>
                      {symbol}
                      {convertAmount(project.budget).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                  <View style={styles.statRight}>
                    <Text style={styles.statLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
                    <Text
                      style={[
                        styles.statValueBold,
                        { color: remaining >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {remaining < 0 && '-'}
                      {symbol}
                      {convertAmount(Math.abs(remaining)).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
    backgroundColor: colors.neuBg,
  },
  header: {
    backgroundColor: colors.neuBg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summaryCard: {
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Filters
  filterContainer: {
    paddingBottom: spacing.sm,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterPillInactive: {
    backgroundColor: colors.neuBg,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  filterPillTextActive: {
    color: colors.white,
  },
  filterPillTextInactive: {
    color: colors.textTertiary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 120,
    gap: 16,
  },

  // Empty
  emptyCard: {
    borderRadius: radii['2xl'],
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.neuBg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.lg,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    writingDirection: 'rtl',
  },

  // Project Card
  projectCard: {
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectTitleInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  projectCategory: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Stats
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    writingDirection: 'rtl',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statRight: {
    alignItems: 'flex-start',
  },
  statValueBold: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default CategoryProjects;
