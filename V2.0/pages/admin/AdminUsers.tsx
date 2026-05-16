// Real users list — pulled from admin_users_view (RLS-gated to admin only).
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAdminUsers, AdminUserRow } from '../../shared/hooks/admin/useAdminUsers';
import { colors, fonts, radii, spacing } from '../../theme';

interface Props {
  onSelectUser: (userId: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL');
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return new Date(iso).toLocaleDateString('he-IL');
}

export default function AdminUsers({ onSelectUser }: Props) {
  const { data, loading, error } = useAdminUsers();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.fullName?.toLowerCase().includes(q) ?? false),
    );
  }, [data, query]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }
  if (error) {
    return <Text style={styles.error}>שגיאה: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>משתמשים ({data.length})</Text>
        <Text style={styles.subtitle}>כל המשתמשים הרשומים במערכת · לחץ על שורה לפרטים</Text>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי אימייל או שם..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <GlassCard style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.cellEmail, styles.headerText]}>אימייל</Text>
          <Text style={[styles.cell, styles.cellName, styles.headerText]}>שם</Text>
          <Text style={[styles.cell, styles.cellSmall, styles.headerText]}>הצטרף</Text>
          <Text style={[styles.cell, styles.cellSmall, styles.headerText]}>פעיל אחרון</Text>
          <Text style={[styles.cell, styles.cellTiny, styles.headerText]}>פרוייקטים</Text>
          <Text style={[styles.cell, styles.cellTiny, styles.headerText]}>תנועות</Text>
        </View>
        {filtered.map((u) => (
          <Pressable key={u.id} style={styles.row} onPress={() => onSelectUser(u.id)}>
            <Text style={[styles.cell, styles.cellEmail, styles.emailText]} numberOfLines={1}>{u.email}</Text>
            <Text style={[styles.cell, styles.cellName]} numberOfLines={1}>{u.fullName ?? '—'}</Text>
            <Text style={[styles.cell, styles.cellSmall, styles.muted]}>{formatDate(u.signupAt)}</Text>
            <Text style={[styles.cell, styles.cellSmall, styles.muted]}>{formatRelative(u.lastSignInAt)}</Text>
            <Text style={[styles.cell, styles.cellTiny, styles.numCell]}>{u.projectCount}</Text>
            <Text style={[styles.cell, styles.cellTiny, styles.numCell]}>{u.transactionCount}</Text>
          </Pressable>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>{query ? 'לא נמצאו תוצאות' : 'אין משתמשים'}</Text>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { padding: spacing['3xl'], alignItems: 'center' },
  error: { color: colors.error, padding: spacing.lg, textAlign: 'right' },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginLeft: 0 },
  searchInput: {
    flex: 1, paddingVertical: spacing.md,
    color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 14,
    textAlign: 'right',
  },
  table: { overflow: 'hidden', padding: 0 },
  row: {
    flexDirection: 'row-reverse',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  headerRow: { backgroundColor: 'rgba(255,255,255,0.03)' },
  cell: { fontSize: 13, fontFamily: fonts.regular, color: colors.textPrimary, paddingHorizontal: spacing.sm },
  cellEmail: { flex: 2, textAlign: 'right' },
  cellName: { flex: 1.3, textAlign: 'right' },
  cellSmall: { flex: 1, textAlign: 'right' },
  cellTiny: { width: 80, textAlign: 'center' },
  headerText: { fontFamily: fonts.bold, fontWeight: '700', color: colors.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  emailText: { fontFamily: fonts.semibold, fontWeight: '600' },
  muted: { color: colors.textSecondary },
  numCell: { fontFamily: fonts.bold, fontWeight: '700' },
  empty: { padding: spacing.xl, textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.medium },
});
