// Reports — CSV exports of users / projects / expenses / incomes / suppliers / debts.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, fonts, radii, spacing } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface ReportDef {
  key: string;
  title: string;
  desc: string;
  icon: IconName;
  fetch: () => Promise<{ rows: any[]; filename: string }>;
}

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default function AdminReports() {
  const [busy, setBusy] = useState<string | null>(null);

  const reports: ReportDef[] = [
    {
      key: 'users', title: 'משתמשים (CSV)', desc: 'רשימת כל המשתמשים עם פרטי הצטרפות וכניסה אחרונה.',
      icon: 'people',
      fetch: async () => {
        const { data } = await supabase.from('admin_users_view').select('*').order('signup_at', { ascending: false });
        return { rows: data ?? [], filename: `sasomm-users-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
    {
      key: 'projects', title: 'פרויקטים (CSV)', desc: 'כל הפרויקטים — שם, תקציב, הוצאות, סטטוס, קטגוריה.',
      icon: 'folder',
      fetch: async () => {
        const { data } = await supabase.from('projects').select('id,name,budget,spent,income,status,main_category,category,created_at,updated_at').order('created_at', { ascending: false });
        return { rows: data ?? [], filename: `sasomm-projects-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
    {
      key: 'expenses', title: 'הוצאות (CSV)', desc: 'כל ההוצאות עם תאריך, סכום, קטגוריה, אמצעי תשלום.',
      icon: 'trending-down',
      fetch: async () => {
        const { data } = await supabase.from('expenses').select('id,title,amount,currency,date,tag,payment_method,includes_vat,created_at').order('date', { ascending: false });
        return { rows: data ?? [], filename: `sasomm-expenses-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
    {
      key: 'incomes', title: 'הכנסות (CSV)', desc: 'כל ההכנסות עם תאריך, סכום, קטגוריה.',
      icon: 'trending-up',
      fetch: async () => {
        const { data } = await supabase.from('incomes').select('id,title,amount,currency,date,tag,payment_method,created_at').order('date', { ascending: false });
        return { rows: data ?? [], filename: `sasomm-incomes-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
    {
      key: 'suppliers', title: 'ספקים (CSV)', desc: 'רשימת ספקים — שם, יתרה, סטטוס, פעילות אחרונה.',
      icon: 'business',
      fetch: async () => {
        const { data } = await supabase.from('suppliers').select('id,name,category,phone,status,amount,last_active,created_at').order('name');
        return { rows: data ?? [], filename: `sasomm-suppliers-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
    {
      key: 'debts', title: 'חובות (CSV)', desc: 'כל החובות — direction, סכום, מצב תשלום, תזכורות.',
      icon: 'account-balance-wallet',
      fetch: async () => {
        const { data } = await supabase.from('debts').select('id,person_name,amount,currency,direction,is_paid,reminder_interval,next_reminder_date,due_date,notes,created_at').order('created_at', { ascending: false });
        return { rows: data ?? [], filename: `sasomm-debts-${new Date().toISOString().slice(0,10)}.csv` };
      },
    },
  ];

  const handleExport = async (r: ReportDef) => {
    setBusy(r.key);
    try {
      const { rows, filename } = await r.fetch();
      if (rows.length === 0) { Alert.alert('אין נתונים', 'הטבלה ריקה'); return; }
      const csv = toCsv(rows);
      downloadCsv(csv, filename);
      if (Platform.OS !== 'web') Alert.alert('הצלחה', `${rows.length} שורות יוצאו`);
    } catch (e) {
      Alert.alert('שגיאה', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>דוחות וייצוא</Text>
        <Text style={styles.subtitle}>ייצוא נתונים אמיתיים מ‑DB ל‑CSV · נפתח בדפדפן עם BOM ל‑UTF-8</Text>
      </View>

      <View style={styles.grid}>
        {reports.map((r) => (
          <Pressable key={r.key} onPress={() => handleExport(r)} style={styles.cardWrap}>
            <GlassCard glow style={styles.card}>
              <View style={styles.cardInner}>
                <MaterialIcons name={r.icon} size={28} color={colors.primary} />
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardDesc}>{r.desc}</Text>
                <View style={styles.cardCta}>
                  <MaterialIcons name="file-download" size={14} color={colors.primary} />
                  <Text style={styles.cardCtaText}>{busy === r.key ? 'מייצא...' : 'הורד CSV'}</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>
        דוחות מתקדמים נוספים בקרוב: דוח רואה חשבון שנתי (ZIP עם P&L + חשבוניות + הוצאות), דוח מע"מ חודשי בפורמט Open Format, ZIP של חשבוניות מס בטווח תאריכים.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  cardWrap: { flexGrow: 1, flexBasis: 260 },
  card: { padding: 1.2 },
  cardInner: { padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-end' },
  cardTitle: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  cardDesc: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.regular, textAlign: 'right', lineHeight: 18 },
  cardCta: { flexDirection: 'row-reverse', gap: 4, alignItems: 'center', marginTop: spacing.sm },
  cardCtaText: { color: colors.primary, fontFamily: fonts.bold, fontWeight: '700', fontSize: 12 },
  note: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.regular, textAlign: 'right', lineHeight: 18, marginTop: spacing.md },
});
