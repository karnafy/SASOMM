// Feedback + TODO — Kanban for feedback (from feedback table) + personal TODO list (admin_todos).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@monn/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, fonts, radii, spacing } from '../../theme';

interface FeedbackRow { id: string; user_id: string | null; screen: string | null; message: string; status: 'new' | 'in_progress' | 'closed'; created_at: string; }
interface TodoRow { id: string; title: string; status: 'pending' | 'in_progress' | 'completed'; priority: 'low' | 'med' | 'high'; created_at: string; }

export default function AdminFeedbackTodo() {
  const [tab, setTab] = useState<'feedback' | 'todo'>('feedback');
  const [fb, setFb] = useState<FeedbackRow[]>([]);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'med' | 'high'>('med');

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: t }] = await Promise.all([
      supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('admin_todos').select('*').order('created_at', { ascending: false }),
    ]);
    setFb((f ?? []) as any);
    setTodos((t ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const moveFeedback = async (id: string, status: FeedbackRow['status']) => {
    await supabase.from('feedback').update({ status }).eq('id', id);
    load();
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await supabase.from('admin_todos').insert({ title: newTodo.trim(), priority: newPriority, status: 'pending' });
    setNewTodo(''); setNewPriority('med');
    load();
  };
  const toggleTodo = async (t: TodoRow) => {
    await supabase.from('admin_todos').update({ status: t.status === 'completed' ? 'pending' : 'completed', completed_at: t.status === 'completed' ? null : new Date().toISOString() }).eq('id', t.id);
    load();
  };

  const cols: { key: FeedbackRow['status']; title: string; color: string }[] = [
    { key: 'new', title: 'חדש', color: colors.info },
    { key: 'in_progress', title: 'בטיפול', color: colors.warning },
    { key: 'closed', title: 'נסגר', color: colors.success },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.h1}>משוב ומשימות</Text>
        <Text style={styles.subtitle}>{fb.filter(f => f.status !== 'closed').length} פניות פתוחות · {todos.filter(t => t.status !== 'completed').length} משימות פתוחות</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'feedback' && styles.tabActive]} onPress={() => setTab('feedback')}>
          <Text style={[styles.tabText, tab === 'feedback' && styles.tabTextActive]}>משוב ({fb.length})</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'todo' && styles.tabActive]} onPress={() => setTab('todo')}>
          <Text style={[styles.tabText, tab === 'todo' && styles.tabTextActive]}>משימות שלי ({todos.length})</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} /> : tab === 'feedback' ? (
        <View style={styles.kanban}>
          {cols.map((c) => {
            const items = fb.filter(f => f.status === c.key);
            return (
              <View key={c.key} style={styles.kCol}>
                <View style={[styles.kHeader, { borderColor: c.color }]}>
                  <Text style={[styles.kHeaderText, { color: c.color }]}>{c.title} ({items.length})</Text>
                </View>
                {items.length === 0 ? (
                  <Text style={styles.kEmpty}>—</Text>
                ) : items.map((f) => (
                  <GlassCard key={f.id} style={styles.kCard}>
                    <View style={styles.kCardInner}>
                      <Text style={styles.kCardMeta}>{f.screen ?? '—'} · {new Date(f.created_at).toLocaleDateString('he-IL')}</Text>
                      <Text style={styles.kCardBody} numberOfLines={3}>{f.message}</Text>
                      <View style={styles.kCardActions}>
                        {c.key !== 'new' && <Pressable onPress={() => moveFeedback(f.id, 'new')}><Text style={styles.kAction}>← חדש</Text></Pressable>}
                        {c.key !== 'in_progress' && <Pressable onPress={() => moveFeedback(f.id, 'in_progress')}><Text style={styles.kAction}>בטיפול</Text></Pressable>}
                        {c.key !== 'closed' && <Pressable onPress={() => moveFeedback(f.id, 'closed')}><Text style={styles.kAction}>סגור →</Text></Pressable>}
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <GlassCard glow style={{ padding: 1.2 }}>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                value={newTodo}
                onChangeText={setNewTodo}
                placeholder="הוסף משימה חדשה..."
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={addTodo}
              />
              <View style={styles.priorityRow}>
                {(['low','med','high'] as const).map(p => (
                  <Pressable key={p} style={[styles.prioPill, newPriority === p && styles.prioPillActive]} onPress={() => setNewPriority(p)}>
                    <Text style={[styles.prioText, newPriority === p && styles.prioTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.addBtn} onPress={addTodo}>
                <MaterialIcons name="add" size={20} color={colors.bgPrimary} />
              </Pressable>
            </View>
          </GlassCard>

          {todos.length === 0 ? (
            <GlassCard style={{ padding: spacing.xl }}>
              <Text style={styles.empty}>אין משימות. הוסף את הראשונה למעלה.</Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.list}>
              {todos.map(t => (
                <Pressable key={t.id} style={styles.todoRow} onPress={() => toggleTodo(t)}>
                  <MaterialIcons
                    name={t.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={t.status === 'completed' ? colors.success : colors.textTertiary}
                  />
                  <Text style={[styles.todoTitle, t.status === 'completed' && styles.todoDone]}>{t.title}</Text>
                  <View style={[styles.prioPill, styles[`prio_${t.priority}` as 'prio_low']]}>
                    <Text style={styles.prioText}>{t.priority}</Text>
                  </View>
                </Pressable>
              ))}
            </GlassCard>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  heading: { gap: spacing.sm },
  h1: { fontSize: 30, fontWeight: '800', fontFamily: fonts.extrabold, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right' },
  tabs: { flexDirection: 'row-reverse', gap: 4 },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabActive: { backgroundColor: 'rgba(0,217,217,0.12)', borderColor: 'rgba(0,217,217,0.5)' },
  tabText: { color: colors.textSecondary, fontFamily: fonts.bold, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: colors.primary },
  kanban: { flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'flex-start' },
  kCol: { flex: 1, gap: spacing.sm },
  kHeader: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1 },
  kHeaderText: { fontSize: 12, fontFamily: fonts.bold, fontWeight: '700', textAlign: 'right' },
  kEmpty: { textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.regular, padding: spacing.md, fontSize: 13 },
  kCard: { },
  kCardInner: { padding: spacing.md, gap: 6 },
  kCardMeta: { fontSize: 10, color: colors.textTertiary, textAlign: 'right' },
  kCardBody: { fontSize: 13, color: colors.textPrimary, fontFamily: fonts.regular, textAlign: 'right' },
  kCardActions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.xs },
  kAction: { fontSize: 11, color: colors.primary, fontFamily: fonts.bold, fontWeight: '700' },
  addRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  input: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.md, color: colors.textPrimary, textAlign: 'right' },
  priorityRow: { flexDirection: 'row-reverse', gap: 4 },
  prioPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  prioPillActive: { borderColor: colors.primary, backgroundColor: 'rgba(0,217,217,0.12)' },
  prio_low: { borderColor: 'rgba(91,169,255,0.4)', backgroundColor: 'rgba(91,169,255,0.1)' },
  prio_med: { borderColor: 'rgba(255,180,84,0.4)', backgroundColor: 'rgba(255,180,84,0.1)' },
  prio_high: { borderColor: 'rgba(255,107,122,0.4)', backgroundColor: 'rgba(255,107,122,0.1)' },
  prioText: { fontSize: 10, fontFamily: fonts.bold, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  prioTextActive: { color: colors.primary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  list: { overflow: 'hidden', padding: 0 },
  todoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  todoTitle: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.textPrimary, textAlign: 'right' },
  todoDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
  empty: { textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.medium },
});
