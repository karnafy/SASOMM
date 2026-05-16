// Admin Overview — REAL KPIs from admin_kpi_view + projects/expenses/incomes aggregates.
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAdminKPIs } from '../../shared/hooks/admin/useAdminKPIs';
import { colors, fonts, radii, spacing } from '../../theme';

function formatCurrency(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  const valueColor =
    tone === 'success' ? colors.success :
    tone === 'error'   ? colors.error :
    tone === 'warning' ? colors.warning :
    tone === 'info'    ? colors.info :
    colors.textPrimary;
  return (
    <GlassCard glow style={styles.kpi}>
      <View style={styles.kpiInner}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color: valueColor }]}>
          {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
        </Text>
        {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
      </View>
    </GlassCard>
  );
}

export default function AdminOverview() {
  const { data: k, loading, error } = useAdminKPIs();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>טוען נתוני סקירה...</Text>
      </View>
    );
  }
  if (error || !k) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>שגיאה בטעינה: {error ?? 'no data'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>סקירה</Text>
        <Text style={styles.subtitle}>
          תמונת מצב בזמן אמת · {k.totalUsers} משתמשים · {k.totalProjects} פרויקטים · {k.totalExpenses + k.totalIncomes} תנועות
        </Text>
      </View>

      <Text style={styles.sectionTitle}>משתמשים</Text>
      <View style={styles.grid}>
        <KpiCard label="סה״כ משתמשים"    value={k.totalUsers} />
        <KpiCard label="הרשמות 7 ימים"   value={k.newSignups7d}  tone={k.newSignups7d > 0 ? 'success' : 'default'} />
        <KpiCard label="הרשמות 30 ימים"  value={k.newSignups30d} />
        <KpiCard label="פעילים 30 ימים"  value={k.activeLast30d} hint={`מתוך ${k.totalUsers}`} />
      </View>

      <Text style={styles.sectionTitle}>פעילות במערכת</Text>
      <View style={styles.grid}>
        <KpiCard label="פרויקטים"        value={k.totalProjects} />
        <KpiCard label="הוצאות"          value={k.totalExpenses} />
        <KpiCard label="הכנסות"          value={k.totalIncomes} />
        <KpiCard label="פעולות החודש"    value={k.actionsThisMonth} hint={`היום: ${k.actionsToday}`} />
      </View>

      <Text style={styles.sectionTitle}>סכומים מצרפיים (ILS)</Text>
      <View style={styles.grid}>
        <KpiCard label="סה״כ תקציב"      value={formatCurrency(k.totalBudgetIls)} />
        <KpiCard label="סה״כ הוצאות"     value={formatCurrency(k.totalSpentIls)}  tone="error" />
        <KpiCard label="סה״כ הכנסות"     value={formatCurrency(k.totalIncomeIls)} tone="success" />
        <KpiCard label="נטו (הכנסה ‑ הוצאה)" value={formatCurrency(k.netIls)} tone={k.netIls >= 0 ? 'success' : 'error'} />
      </View>

      <Text style={styles.sectionTitle}>שירות לקוחות</Text>
      <View style={styles.grid}>
        <KpiCard label="משוב פתוח"       value={k.openFeedback} tone={k.openFeedback > 0 ? 'warning' : 'default'} hint="מהאפליקציה" />
        <KpiCard label="משימות פתוחות"   value={k.openTodos}    tone={k.openTodos > 0 ? 'info' : 'default'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { padding: spacing['3xl'], alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.medium },
  errorText: { color: colors.error, fontFamily: fonts.bold, fontSize: 16, textAlign: 'right' },
  heading: { gap: spacing.sm },
  h1: {
    fontSize: 30, fontWeight: '800', textAlign: 'right',
    fontFamily: fonts.extrabold, color: colors.textPrimary, letterSpacing: -0.5,
  },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  sectionTitle: {
    fontSize: 14, fontFamily: fonts.bold, fontWeight: '700',
    color: colors.textPrimary, textAlign: 'right',
    marginTop: spacing.md, marginBottom: -spacing.xs,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md,
  },
  kpi: { minWidth: 200, flexGrow: 1, flexBasis: 200, padding: 1.2 },
  kpiInner: { padding: spacing.lg, gap: spacing.xs },
  kpiLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 28, fontFamily: fonts.extrabold, fontWeight: '800', color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  kpiHint: { fontSize: 11, color: colors.textTertiary, textAlign: 'right' },
});
