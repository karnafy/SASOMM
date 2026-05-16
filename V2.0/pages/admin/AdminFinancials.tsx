// Financials — P&L from real data. Revenue = sum(incomes), Expenses = sum(expenses + business_expenses).
// Monthly breakdown of 12 trailing months.
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, fonts, spacing } from '../../theme';

interface MonthRow { year_month: string; revenue: number; expenses: number; }

function monthKey(d: Date): string { return d.toISOString().slice(0, 7); }
function formatCurrency(n: number): string { return `₪${Math.round(n).toLocaleString('he-IL')}`; }

export default function AdminFinancials() {
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: exp }, { data: inc }, { data: biz }] = await Promise.all([
        supabase.from('expenses').select('date, amount'),
        supabase.from('incomes').select('date, amount'),
        supabase.from('business_expenses').select('amount_ils, month'),
      ]);
      // build 12 trailing months
      const keys: string[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(monthKey(d));
      }
      const expMap = new Map<string, number>();
      const incMap = new Map<string, number>();
      keys.forEach(k => { expMap.set(k, 0); incMap.set(k, 0); });
      (exp ?? []).forEach((e: any) => {
        const k = (e.date ?? '').slice(0, 7);
        if (expMap.has(k)) expMap.set(k, (expMap.get(k) ?? 0) + Number(e.amount));
      });
      (inc ?? []).forEach((i: any) => {
        const k = (i.date ?? '').slice(0, 7);
        if (incMap.has(k)) incMap.set(k, (incMap.get(k) ?? 0) + Number(i.amount));
      });

      setMonths(keys.map(k => ({ year_month: k, revenue: incMap.get(k) ?? 0, expenses: expMap.get(k) ?? 0 })).reverse());
      setBusinessExpenses((biz ?? []).reduce((s: number, r: any) => s + Number(r.amount_ils ?? 0), 0));
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const currentMonth = months[0];
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>רווח והפסד</Text>
        <Text style={styles.subtitle}>תמונה חודשית · 12 חודשים אחרונים</Text>
      </View>

      <View style={styles.grid}>
        <GlassCard glow style={styles.kpi}>
          <View style={styles.kpiInner}>
            <Text style={styles.kpiLabel}>חודש נוכחי — הכנסות</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>{formatCurrency(currentMonth?.revenue ?? 0)}</Text>
          </View>
        </GlassCard>
        <GlassCard glow style={styles.kpi}>
          <View style={styles.kpiInner}>
            <Text style={styles.kpiLabel}>חודש נוכחי — הוצאות</Text>
            <Text style={[styles.kpiValue, { color: colors.error }]}>{formatCurrency(currentMonth?.expenses ?? 0)}</Text>
          </View>
        </GlassCard>
        <GlassCard glow style={styles.kpi}>
          <View style={styles.kpiInner}>
            <Text style={styles.kpiLabel}>חודש נוכחי — נטו</Text>
            <Text style={[styles.kpiValue, { color: (currentMonth?.revenue ?? 0) - (currentMonth?.expenses ?? 0) >= 0 ? colors.success : colors.error }]}>
              {formatCurrency((currentMonth?.revenue ?? 0) - (currentMonth?.expenses ?? 0))}
            </Text>
          </View>
        </GlassCard>
        <GlassCard glow style={styles.kpi}>
          <View style={styles.kpiInner}>
            <Text style={styles.kpiLabel}>12 ח׳ — נטו</Text>
            <Text style={[styles.kpiValue, { color: totalRevenue - totalExpenses >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(totalRevenue - totalExpenses)}
            </Text>
          </View>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>פירוט חודשי</Text>
      <GlassCard style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerText, { flex: 1.5 }]}>חודש</Text>
          <Text style={[styles.cell, styles.headerText]}>הכנסות</Text>
          <Text style={[styles.cell, styles.headerText]}>הוצאות</Text>
          <Text style={[styles.cell, styles.headerText]}>נטו</Text>
        </View>
        {months.map((m) => {
          const net = m.revenue - m.expenses;
          return (
            <View key={m.year_month} style={styles.row}>
              <Text style={[styles.cell, { flex: 1.5 }, styles.monthCell]}>{m.year_month}</Text>
              <Text style={[styles.cell, { color: colors.success }]}>{formatCurrency(m.revenue)}</Text>
              <Text style={[styles.cell, { color: colors.error }]}>{formatCurrency(m.expenses)}</Text>
              <Text style={[styles.cell, { color: net >= 0 ? colors.success : colors.error, fontFamily: fonts.bold, fontWeight: '700' }]}>
                {formatCurrency(net)}
              </Text>
            </View>
          );
        })}
      </GlassCard>

      <Text style={styles.note}>
        הערה: הנתונים מבוססים על הוצאות והכנסות שמשתמשים רושמים באפליקציה. עלויות תפעוליות של SASOMM עצמה (Supabase, GREEN API, וכו') נכנסות לטבלת business_expenses — סה״כ כרגע: {formatCurrency(businessExpenses)}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { padding: spacing['3xl'], alignItems: 'center' },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  kpi: { flexGrow: 1, flexBasis: 220, padding: 1.2 },
  kpiInner: { padding: spacing.lg, gap: spacing.xs, alignItems: 'flex-end' },
  kpiLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontFamily: fonts.extrabold, fontWeight: '800', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'right' },
  table: { overflow: 'hidden', padding: 0 },
  row: { flexDirection: 'row-reverse', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: 'center' },
  headerRow: { backgroundColor: 'rgba(255,255,255,0.03)' },
  cell: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.textPrimary, textAlign: 'right', paddingHorizontal: spacing.xs },
  headerText: { fontFamily: fonts.bold, fontWeight: '700', color: colors.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  monthCell: { fontFamily: fonts.bold, fontWeight: '700' },
  note: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.regular, textAlign: 'right', lineHeight: 18, marginTop: spacing.md },
});
