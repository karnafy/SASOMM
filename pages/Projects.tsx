import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen, Project, Currency } from '@monn/shared';
import { colors, neuRaised, radii, spacing } from '../theme';

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
  const [filter, setFilter] = useState('הכל');

  const filterCategories = useMemo(() => {
    const projectCategories = Array.from(new Set(projects.map((p) => p.category)));
    const hasPersonal = projects.some((p) => p.mainCategory === 'personal');
    const hasOther = projects.some((p) => p.mainCategory === 'other');

    const filters = ['הכל', ...projectCategories];
    if (hasPersonal && !filters.includes('אישי')) filters.push('אישי');
    if (hasOther && !filters.includes('שונות')) filters.push('שונות');

    return filters;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filter === 'הכל') return projects;
    if (filter === 'אישי') return projects.filter((p) => p.mainCategory === 'personal');
    if (filter === 'שונות') return projects.filter((p) => p.mainCategory === 'other');
    return projects.filter((p) => p.category === filter);
  }, [projects, filter]);

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

  const getProgressBarColor = (status: Project['status']) => {
    switch (status) {
      case 'over':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-monny.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title Row */}
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={[styles.headerButton, neuRaised]}
            onPress={() => goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>כל הפרויקטים</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScroll}
        >
          {filterCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilter(cat)}
              style={[
                styles.filterPill,
                filter === cat ? styles.filterPillActive : [styles.filterPillInactive, neuRaised],
              ]}
              activeOpacity={0.7}
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
      </View>

      {/* Content */}
      <View style={styles.content}>
        {filteredProjects.length === 0 ? (
          <View style={[styles.emptyCard, neuRaised]}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="folder-off" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>אין פרויקטים להצגה</Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyAddButtonText}>צור פרויקט חדש</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const percent =
              project.budget > 0
                ? Math.round((project.spent / project.budget) * 100)
                : 0;
            const remaining = project.budget - project.spent;
            const statusColors = getStatusColors(project.status);
            const percentColors = getPercentColors(percent);

            return (
              <TouchableOpacity
                key={project.id}
                style={[styles.projectCard, neuRaised]}
                onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
                activeOpacity={0.85}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.projectIcon,
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
                  <View
                    style={[
                      styles.percentBadge,
                      { backgroundColor: percentColors.bg },
                    ]}
                  >
                    <Text
                      style={[styles.percentBadgeText, { color: percentColors.text }]}
                    >
                      {percent}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: getProgressBarColor(project.status),
                      },
                    ]}
                  />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statsLabel}>תקציב</Text>
                    <Text style={styles.statsValue}>
                      {currencySymbols[globalCurrency]}
                      {formatAmount(project.budget)}
                    </Text>
                  </View>
                  <View style={styles.statsRight}>
                    <Text style={styles.statsLabel}>יתרה</Text>
                    <Text
                      style={[
                        styles.statsValueBold,
                        { color: remaining >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {remaining < 0 && '-'}
                      {currencySymbols[globalCurrency]}
                      {formatAmount(Math.abs(remaining))}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },

  // Header
  header: {
    backgroundColor: colors.neuBg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    height: 80,
    width: 200,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter
  filterScroll: {
    marginBottom: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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

  // Content
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
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
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
    writingDirection: 'rtl',
  },

  // Project Card
  projectCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontWeight: '700',
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
  percentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    marginLeft: spacing.sm,
  },
  percentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress Bar
  progressBarBg: {
    height: 10,
    backgroundColor: colors.neuLight,
    borderRadius: 5,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRight: {
    alignItems: 'flex-start',
  },
  statsLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    writingDirection: 'rtl',
  },
  statsValue: {
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  statsValueBold: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
});

export default Projects;
