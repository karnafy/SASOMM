import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, radii } from '../../theme';
import { DarkCard } from '../ui/DarkCard';
import { ProgressBar } from '../ui/ProgressBar';

interface OverBudgetProject {
  name: string;
  id: string;
  percentUsed: number;
  overspend: number;
}

interface BudgetHealthCardProps {
  overallUsage: number;
  overBudgetProjects: OverBudgetProject[];
  sym: string;
  convertAmount: (amount: number) => number;
  onNavigate: (screen: string, id: string) => void;
}

function getStatus(usage: number): 'ok' | 'warning' | 'over' {
  if (usage > 100) return 'over';
  if (usage >= 80) return 'warning';
  return 'ok';
}

function getStatusKey(usage: number): 'over_budget' | 'near_limit' | 'healthy' {
  if (usage > 100) return 'over_budget';
  if (usage >= 80) return 'near_limit';
  return 'healthy';
}

function getStatusColor(status: 'ok' | 'warning' | 'over'): string {
  switch (status) {
    case 'ok':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'over':
      return colors.error;
  }
}

export function BudgetHealthCard({
  overallUsage,
  overBudgetProjects,
  sym,
  convertAmount,
  onNavigate,
}: BudgetHealthCardProps) {
  const { t } = useTranslation();
  const status = useMemo(() => getStatus(overallUsage), [overallUsage]);
  const statusKey = useMemo(() => getStatusKey(overallUsage), [overallUsage]);
  const statusLabel = t(`budget_health.${statusKey}`);
  const statusColor = useMemo(() => getStatusColor(status), [status]);

  return (
    <DarkCard style={styles.card}>
      <Text style={styles.title}>{t('budget_health.title')}</Text>

      {/* Overall usage gauge */}
      <View style={styles.gaugeContainer}>
        <Text style={[styles.percentageText, { color: statusColor }]}>
          {Math.round(overallUsage)}%
        </Text>
        <ProgressBar
          percentage={overallUsage}
          status={status}
          style={styles.progressBar}
        />
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Over-budget projects list */}
      {overBudgetProjects.length > 0 && (
        <View style={styles.projectsSection}>
          <Text style={styles.sectionTitle}>{t('budget_health.projects_over')}</Text>
          {overBudgetProjects.map((project) => {
            const convertedOverspend = convertAmount(project.overspend);
            return (
              <Pressable
                key={project.id}
                style={styles.projectRow}
                onPress={() => onNavigate('ProjectDetail', project.id)}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <View style={styles.projectStats}>
                    <Text style={styles.projectPercent}>
                      {Math.round(project.percentUsed)}%
                    </Text>
                    <Text style={styles.projectOverspend}>
                      +{sym}
                      {convertedOverspend.toLocaleString('he-IL', {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  percentage={project.percentUsed}
                  status="over"
                  style={styles.projectProgressBar}
                />
              </Pressable>
            );
          })}
        </View>
      )}
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
    marginBottom: spacing.lg,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  percentageText: {
    fontFamily: fonts.bold,
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  projectsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  projectRow: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  projectHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  projectName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  projectStats: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  projectPercent: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.error,
  },
  projectOverspend: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.error,
  },
  projectProgressBar: {
    height: 4,
    borderRadius: 2,
  },
});
