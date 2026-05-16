// Admin Messages — composer + history. Saves to user_messages (Inbox channel works directly).
// Push/WhatsApp channels require Edge Functions (not yet built — disabled with tooltip).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAdminUsers } from '../../shared/hooks/admin/useAdminUsers';
import { colors, fonts, radii, spacing } from '../../theme';

interface MessageRow {
  id: string;
  user_id: string | null;
  channels: string[];
  title: string;
  body: string;
  sent_at: string;
  status: string;
}

export default function AdminMessages() {
  const { data: users } = useAdminUsers();
  const [recipient, setRecipient] = useState<'all' | string>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);
    setHistory((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('שגיאה', 'נא למלא נושא ותוכן');
      return;
    }
    setSending(true);
    try {
      const rows = recipient === 'all'
        ? [{ user_id: null, channels: ['inbox'], title: title.trim(), body: body.trim(), status: 'sent' }]
        : [{ user_id: recipient, channels: ['inbox'], title: title.trim(), body: body.trim(), status: 'sent' }];
      const { error } = await supabase.from('user_messages').insert(rows);
      if (error) throw new Error(error.message);
      setTitle(''); setBody(''); setRecipient('all');
      Alert.alert('נשלח', recipient === 'all' ? 'הודעה נשלחה לכל המשתמשים (Inbox)' : 'הודעה נשלחה');
      await loadHistory();
    } catch (e) {
      Alert.alert('שגיאה', (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>הודעות</Text>
        <Text style={styles.subtitle}>שלח Push/Inbox/WhatsApp למשתמשים · בשלב הזה רק Inbox פעיל</Text>
      </View>

      <GlassCard glow style={{ padding: 1.2 }}>
        <View style={styles.composerInner}>
          <Text style={styles.composerTitle}>הודעה חדשה</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>נמענים</Text>
            <View style={styles.pillRow}>
              <Pressable
                style={[styles.pill, recipient === 'all' && styles.pillActive]}
                onPress={() => setRecipient('all')}
              >
                <Text style={[styles.pillText, recipient === 'all' && styles.pillTextActive]}>כל המשתמשים ({users.length})</Text>
              </Pressable>
              {users.slice(0, 5).map((u) => (
                <Pressable
                  key={u.id}
                  style={[styles.pill, recipient === u.id && styles.pillActive]}
                  onPress={() => setRecipient(u.id)}
                >
                  <Text style={[styles.pillText, recipient === u.id && styles.pillTextActive]}>{u.email}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>נושא</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="לדוגמה: גרסה חדשה זמינה"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>תוכן (Markdown נתמך ב‑Inbox)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={body}
              onChangeText={setBody}
              placeholder="כתוב את ההודעה..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.composerActions}>
            <View style={styles.channelRow}>
              <View style={[styles.channelChip, styles.channelChipActive]}>
                <MaterialIcons name="inbox" size={14} color={colors.primary} />
                <Text style={[styles.channelText, { color: colors.primary }]}>Inbox</Text>
              </View>
              <View style={styles.channelChip}>
                <MaterialIcons name="notifications" size={14} color={colors.textTertiary} />
                <Text style={styles.channelText}>Push (בקרוב)</Text>
              </View>
              <View style={styles.channelChip}>
                <MaterialIcons name="chat" size={14} color={colors.textTertiary} />
                <Text style={styles.channelText}>WhatsApp (בקרוב)</Text>
              </View>
            </View>
            <Pressable style={[styles.sendBtn, sending && { opacity: 0.5 }]} onPress={handleSend} disabled={sending}>
              {sending ? <ActivityIndicator color={colors.bgPrimary} size="small" /> : (
                <>
                  <MaterialIcons name="send" size={16} color={colors.bgPrimary} />
                  <Text style={styles.sendText}>שלח</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>היסטוריית הודעות ({history.length})</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : history.length === 0 ? (
        <GlassCard style={{ padding: spacing.xl }}>
          <Text style={styles.empty}>טרם נשלחו הודעות</Text>
        </GlassCard>
      ) : (
        <GlassCard style={styles.list}>
          {history.map((m) => (
            <View key={m.id} style={styles.listRow}>
              <View style={styles.listMain}>
                <Text style={styles.listTitle}>{m.title}</Text>
                <Text style={styles.listBody} numberOfLines={1}>{m.body}</Text>
                <Text style={styles.listMeta}>
                  {new Date(m.sent_at).toLocaleString('he-IL')} · {m.user_id ? 'משתמש בודד' : 'שידור לכולם'} · {m.channels.join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  composerInner: { padding: spacing.lg, gap: spacing.md },
  composerTitle: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  fieldGroup: { gap: spacing.sm },
  label: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 14, color: colors.textPrimary, fontFamily: fonts.regular, textAlign: 'right',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: 'rgba(0,217,217,0.12)',
    borderColor: 'rgba(0,217,217,0.5)',
  },
  pillText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semibold, fontWeight: '600' },
  pillTextActive: { color: colors.primary, fontFamily: fonts.bold, fontWeight: '700' },
  composerActions: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  channelRow: { flexDirection: 'row-reverse', gap: 6 },
  channelChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  channelChipActive: { backgroundColor: 'rgba(0,217,217,0.08)', borderColor: 'rgba(0,217,217,0.4)' },
  channelText: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.bold, fontWeight: '700' },
  sendBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radii.full, backgroundColor: colors.primary,
  },
  sendText: { color: colors.bgPrimary, fontFamily: fonts.bold, fontWeight: '800', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'right' },
  list: { overflow: 'hidden', padding: 0 },
  listRow: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 2,
  },
  listMain: { alignItems: 'flex-end' },
  listTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'right' },
  listBody: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.regular, textAlign: 'right' },
  listMeta: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.regular, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.medium, fontSize: 13 },
});
