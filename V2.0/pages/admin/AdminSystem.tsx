// System — business_info editor (single-row form) + DB row counts + recent audit log.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, fonts, radii, spacing } from '../../theme';

interface BusinessInfo {
  id?: string;
  company_name?: string;
  company_number?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  accountant_email?: string;
  invoice_prefix?: string;
}

const COUNTABLE = ['profiles','projects','expenses','incomes','suppliers','debts','project_activities','recurring_transactions','feedback','admin_todos','user_messages','business_expenses','leads','user_sessions'] as const;

export default function AdminSystem() {
  const [info, setInfo] = useState<BusinessInfo>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: bi }, ...countResults] = await Promise.all([
        supabase.from('business_info').select('*').limit(1).maybeSingle(),
        ...COUNTABLE.map(t => supabase.from(t).select('*', { head: true, count: 'exact' })),
      ] as any);
      setInfo((bi as any) ?? {});
      const c: Record<string, number> = {};
      COUNTABLE.forEach((t, i) => { c[t] = (countResults[i] as any)?.count ?? 0; });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload: any = {
      company_name: info.company_name ?? null,
      company_number: info.company_number ?? null,
      vat_number: info.vat_number ?? null,
      address: info.address ?? null,
      phone: info.phone ?? null,
      email: info.email ?? null,
      accountant_email: info.accountant_email ?? null,
      invoice_prefix: info.invoice_prefix ?? 'INV-',
    };
    const { error } = info.id
      ? await supabase.from('business_info').update(payload).eq('id', info.id)
      : await supabase.from('business_info').insert(payload).select('*').single();
    setSaving(false);
    if (error) Alert.alert('שגיאה', error.message);
    else Alert.alert('נשמר', 'פרטי העסק עודכנו');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const field = (label: string, key: keyof BusinessInfo, placeholder = '') => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={(info[key] as string) ?? ''}
        onChangeText={(v) => setInfo({ ...info, [key]: v })}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>מערכת</Text>
        <Text style={styles.subtitle}>פרטי העסק לחשבוניות · סטטיסטיקות DB · audit log</Text>
      </View>

      <Text style={styles.sectionTitle}>פרטי העסק (יופיעו על חשבוניות)</Text>
      <GlassCard glow style={{ padding: 1.2 }}>
        <View style={styles.formInner}>
          <View style={styles.row2}>
            {field('שם החברה', 'company_name', 'SASOMM Studio בע״מ')}
            {field('מספר חברה (ח.פ)', 'company_number', '516XXXXXX')}
          </View>
          <View style={styles.row2}>
            {field('מספר עוסק מורשה', 'vat_number')}
            {field('כתובת', 'address')}
          </View>
          <View style={styles.row2}>
            {field('טלפון', 'phone')}
            {field('מייל', 'email')}
          </View>
          <View style={styles.row2}>
            {field('מייל רואה חשבון', 'accountant_email')}
            {field('קידומת חשבוניות', 'invoice_prefix', 'INV-')}
          </View>
          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            <MaterialIcons name="save" size={16} color={colors.bgPrimary} />
            <Text style={styles.saveText}>{saving ? 'שומר...' : 'שמור'}</Text>
          </Pressable>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>סטטיסטיקות DB</Text>
      <View style={styles.grid}>
        {COUNTABLE.map(t => (
          <GlassCard key={t} style={styles.statCard}>
            <View style={styles.statInner}>
              <Text style={styles.statLabel}>{t}</Text>
              <Text style={styles.statValue}>{(counts[t] ?? 0).toLocaleString('he-IL')}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { padding: spacing['3xl'], alignItems: 'center' },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'right', marginTop: spacing.md },
  formInner: { padding: spacing.lg, gap: spacing.md },
  row2: { flexDirection: 'row-reverse', gap: spacing.md, flexWrap: 'wrap' },
  fieldGroup: { flex: 1, minWidth: 200, gap: spacing.xs },
  label: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 14, color: colors.textPrimary, fontFamily: fonts.regular, textAlign: 'right',
  },
  saveBtn: {
    alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.primary, borderRadius: radii.full,
  },
  saveText: { color: colors.bgPrimary, fontFamily: fonts.bold, fontWeight: '800', fontSize: 13 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flexGrow: 1, flexBasis: 150 },
  statInner: { padding: spacing.md, alignItems: 'flex-end' },
  statLabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary, textAlign: 'right' },
  statValue: { fontSize: 22, fontFamily: fonts.extrabold, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
});
