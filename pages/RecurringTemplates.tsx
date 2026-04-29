import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  AppScreen,
  Currency,
  Project,
  Supplier,
  RecurringTransaction,
  useAuth,
  useRecurringTransactions,
  confirmDialog,
} from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { DarkCard } from '../components/ui/DarkCard';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';

interface RecurringTemplatesProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
  projects: Project[];
  suppliers: Supplier[];
  onPause: (templateId: string, isActive: boolean) => Promise<void>;
  onDelete: (templateId: string, alsoDeleteRows: boolean) => Promise<void>;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '₪', USD: '$', EUR: '€' };

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function formatDateLabel(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${HEBREW_MONTHS[m - 1]} ${y}`;
}

const RecurringTemplates: React.FC<RecurringTemplatesProps> = ({
  goBack,
  globalCurrency,
  convertAmount,
  projects,
  suppliers,
  onPause,
  onDelete,
}) => {
  const { user } = useAuth();
  const { templates, loading, refetch } = useRecurringTransactions(user?.id);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleTogglePause = useCallback(
    async (template: RecurringTransaction) => {
      setPendingId(template.id);
      try {
        await onPause(template.id, !template.isActive);
        await refetch();
      } catch (e) {
        Alert.alert('שגיאה', 'לא ניתן לעדכן את התבנית');
      } finally {
        setPendingId(null);
      }
    },
    [onPause, refetch]
  );

  const handleDelete = useCallback(
    async (template: RecurringTransaction) => {
      const wantsDelete = await confirmDialog({
        title: 'מחיקת תבנית',
        message: `האם למחוק את התבנית "${template.title}"?`,
        confirmText: 'מחק',
        destructive: true,
      });
      if (!wantsDelete) return;

      const alsoDeleteHistory = await confirmDialog({
        title: 'מחיקת היסטוריה',
        message: 'למחוק גם את כל הרשומות הקיימות שנוצרו מהתבנית? לחץ "מחק" כדי למחוק גם היסטוריה, "ביטול" כדי להשאיר אותן.',
        confirmText: 'מחק היסטוריה',
        cancelText: 'השאר היסטוריה',
        destructive: true,
      });

      try {
        await onDelete(template.id, alsoDeleteHistory);
        await refetch();
      } catch {
        Alert.alert('שגיאה', 'מחיקה נכשלה');
      }
    },
    [onDelete, refetch]
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="event-repeat" size={42} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>{'אין תבניות חוזרות'}</Text>
      <Text style={styles.emptyDesc}>
        {'יוצרים תבנית מתוך מסך ההוצאה / ההכנסה — סמן "הוצאה קבועה" ובחר יום בחודש.'}
      </Text>
    </View>
  );

  const renderTemplate = (tpl: RecurringTransaction) => {
    const project = projects.find((p) => p.id === tpl.projectId);
    const supplier = suppliers.find((s) => s.id === tpl.supplierId);
    const sym = CURRENCY_SYMBOLS[globalCurrency] || CURRENCY_SYMBOLS.ILS;
    const amountDisplay = convertAmount(tpl.amount, 'ILS', globalCurrency);
    const accent = tpl.type === 'expense' ? colors.error : colors.success;
    const typeLabel = tpl.type === 'expense' ? 'הוצאה' : 'הכנסה';

    return (
      <DarkCard key={tpl.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typePill, { backgroundColor: accent + '22', borderColor: accent }]}>
            <Text style={[styles.typePillText, { color: accent }]}>{typeLabel}</Text>
          </View>
          <Text style={[styles.amount, { color: accent }]} numberOfLines={1}>
            {sym}{amountDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>

        <Text style={styles.title}>{tpl.title}</Text>
        {tpl.tag ? <Text style={styles.subtitle}>{tpl.tag}</Text> : null}

        <View style={styles.metaRow}>
          <MaterialIcons name="folder-special" size={16} color={colors.accent} />
          <Text style={styles.metaText}>{project?.name || '—'}</Text>
        </View>
        {supplier && (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={16} color={colors.textTertiary} />
            <Text style={styles.metaText}>{supplier.name}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={16} color={colors.textTertiary} />
          <Text style={styles.metaText}>
            {`כל ${tpl.dayOfMonth} בחודש`}
            {tpl.endDate ? ` • עד ${formatDateLabel(tpl.endDate)}` : ' • ללא תאריך סיום'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={16} color={colors.textTertiary} />
          <Text style={styles.metaText}>{`התחלה: ${formatDateLabel(tpl.startDate)}`}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <View style={styles.activeRow}>
            <ToggleSwitch
              value={tpl.isActive}
              onToggle={() => {
                if (pendingId !== tpl.id) handleTogglePause(tpl);
              }}
            />
            <Text style={styles.activeLabel}>
              {tpl.isActive ? 'פעילה' : 'מושהית'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(tpl)}
          >
            <MaterialIcons name="delete-outline" size={18} color={colors.error} />
            <Text style={styles.deleteBtnText}>{'מחק'}</Text>
          </TouchableOpacity>
        </View>
      </DarkCard>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenTopBar title="תבניות חוזרות" onBack={goBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {templates.length === 0 ? renderEmpty() : templates.map(renderTemplate)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  amount: {
    fontSize: 22,
    fontFamily: fonts.extrabold,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: colors.subtleBorder,
    marginVertical: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  deleteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,77,106,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,106,0.30)',
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.error,
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecurringTemplates;
