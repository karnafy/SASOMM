// Drill-in view for a single user — projects, recent transactions, totals.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAdminUsers } from '../../shared/hooks/admin/useAdminUsers';
import { colors, fonts, radii, spacing } from '../../theme';

interface Props {
  userId: string;
  onBack: () => void;
}

interface ProjectRow { id: string; name: string; budget: number; spent: number; income: number; status: string; main_category: string; }
interface ExpenseRow { id: string; title: string; amount: number; date: string; tag: string; }
interface IncomeRow  { id: string; title: string; amount: number; date: string; tag: string; }

export default function AdminUserDetail({ userId, onBack }: Props) {
  const { data: users } = useAdminUsers();
  const user = users.find(u => u.id === userId);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [{ data: p, error: e1 }, { data: e, error: e2 }, { data: i, error: e3 }] = await Promise.all([
          supabase.from('projects').select('id,name,budget,spent,income,status,main_category').eq('user_id', userId).order('updated_at', { ascending: false }),
          supabase.from('expenses').select('id,title,amount,date,tag').eq('user_id', userId).order('date', { ascending: false }).limit(20),
          supabase.from('incomes').select('id,title,amount,date,tag').eq('user_id', userId).order('date', { ascending: false }).limit(20),
        ]);
        if (e1) throw new Error(e1.message);
        if (e2) throw new Error(e2.message);
        if (e3) throw new Error(e3.message);
        if (cancelled) return;
        setProjects((p ?? []) as any);
        setExpenses((e ?? []) as any);
        setIncomes((i ?? []) as any);
        setErr(null);
      } catch (ex) {
        if (!cancelled) setErr((ex as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const sym = (n: number) => `₪${Math.round(n).toLocaleString('he-IL')}`;

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (err) return <Text style={styles.error}>{err}</Text>;
  if (!user) return <Text style={styles.error}>משתמש לא נמצא</Text>;

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
  const totalSpent = projects.reduce((s, p) => s + Number(p.spent), 0);
  const totalIncome = projects.reduce((s, p) => s + Number(p.income ?? 0), 0);

  const handleSendEmail = () => {
    Alert.alert('בקרוב', 'שליחת מייל תופעל בשלב הבא (דורש Edge Function + Resend)');
  };
  const handleResetPassword = () => {
    Alert.alert('בקרוב', 'איפוס סיסמה דורש Edge Function עם Supabase Admin API');
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
        <Text style={styles.backText}>חזור לרשימה</Text>
      </Pressable>

      <GlassCard glow style={styles.headerCard}>
        <View style={styles.headerInner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.fullName ?? user.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user.fullName ?? user.email}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.actionPrimary]} onPress={handleSendEmail}>
              <MaterialIcons name="email" size={16} color={colors.bgPrimary} />
              <Text style={styles.actionTextPrimary}>שלח מייל</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleResetPassword}>
              <MaterialIcons name="lock-reset" size={16} color={colors.primary} />
              <Text style={styles.actionText}>אפס סיסמה</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      <View style={styles.grid}>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>פרויקטים</Text>
            <Text style={styles.statValue}>{projects.length}</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>הוצאות</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>הכנסות</Text>
            <Text style={styles.statValue}>{incomes.length}</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>תקציב כולל</Text>
            <Text style={[styles.statValue, { fontSize: 18 }]}>{sym(totalBudget)}</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>סך הוצאות</Text>
            <Text style={[styles.statValue, { color: colors.error, fontSize: 18 }]}>{sym(totalSpent)}</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.statInner}>
            <Text style={styles.statLabel}>סך הכנסות</Text>
            <Text style={[styles.statValue, { color: colors.success, fontSize: 18 }]}>{sym(totalIncome)}</Text>
          </View>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>פרויקטים ({projects.length})</Text>
      <GlassCard style={styles.list}>
        {projects.length === 0 && <Text style={styles.empty}>אין פרויקטים</Text>}
        {projects.map((p) => (
          <View key={p.id} style={styles.listRow}>
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{p.name}</Text>
              <Text style={styles.listMeta}>{p.main_category} · סטטוס: {p.status}</Text>
            </View>
            <Text style={styles.listAmount}>{sym(p.budget)}</Text>
          </View>
        ))}
      </GlassCard>

      <Text style={styles.sectionTitle}>הוצאות אחרונות ({expenses.length})</Text>
      <GlassCard style={styles.list}>
        {expenses.length === 0 && <Text style={styles.empty}>אין הוצאות</Text>}
        {expenses.map((e) => (
          <View key={e.id} style={styles.listRow}>
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{e.title}</Text>
              <Text style={styles.listMeta}>{e.tag} · {e.date}</Text>
            </View>
            <Text style={[styles.listAmount, { color: colors.error }]}>−{sym(Number(e.amount))}</Text>
          </View>
        ))}
      </GlassCard>

      <Text style={styles.sectionTitle}>הכנסות אחרונות ({incomes.length})</Text>
      <GlassCard style={styles.list}>
        {incomes.length === 0 && <Text style={styles.empty}>אין הכנסות</Text>}
        {incomes.map((i) => (
          <View key={i.id} style={styles.listRow}>
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{i.title}</Text>
              <Text style={styles.listMeta}>{i.tag} · {i.date}</Text>
            </View>
            <Text style={[styles.listAmount, { color: colors.success }]}>+{sym(Number(i.amount))}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { padding: spacing['3xl'], alignItems: 'center' },
  error: { color: colors.error, padding: spacing.lg, textAlign: 'right' },
  backBtn: {
    flexDirection: 'row-reverse', alignSelf: 'flex-end',
    alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm,
  },
  backText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  headerCard: { padding: 1.2 },
  headerInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,217,217,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,217,217,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontFamily: fonts.extrabold, fontWeight: '800', color: colors.primary },
  headerInfo: { flex: 1, alignItems: 'flex-end' },
  userName: { fontSize: 22, fontFamily: fonts.extrabold, fontWeight: '800', color: colors.textPrimary, textAlign: 'right' },
  userEmail: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.medium, marginTop: 2 },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1, borderColor: 'rgba(0,217,217,0.4)',
    backgroundColor: 'rgba(0,217,217,0.05)',
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { color: colors.primary, fontFamily: fonts.bold, fontWeight: '700', fontSize: 12 },
  actionTextPrimary: { color: colors.bgPrimary, fontFamily: fonts.bold, fontWeight: '800', fontSize: 12 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, flexBasis: 160 },
  statInner: { padding: spacing.md, gap: 4, alignItems: 'flex-end' },
  statLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontFamily: fonts.extrabold, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'right', marginTop: spacing.md },
  list: { overflow: 'hidden', padding: 0 },
  listRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  listMain: { flex: 1, alignItems: 'flex-end' },
  listTitle: { fontSize: 13, fontFamily: fonts.semibold, fontWeight: '600', color: colors.textPrimary },
  listMeta: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.regular, marginTop: 2 },
  listAmount: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: colors.textPrimary },
  empty: { padding: spacing.lg, textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.medium },
});
