import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { AppScreen, Currency, Project, Supplier, Debt } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { DarkCard } from '../components/ui/DarkCard';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};

interface SendReminderProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  suppliers: Supplier[];
  projects: Project[];
  debts: Debt[];
  globalCurrency: Currency;
}

interface ReminderItem {
  id: string;
  kind: 'expense' | 'income' | 'debt';
  title: string;
  amount: number;
  currency: Currency;
  projectName?: string;
  date?: string;
}

const CURRENCY_SYM: Record<Currency, string> = { ILS: '₪', USD: '$', EUR: '€' };

const SendReminder: React.FC<SendReminderProps> = ({
  goBack,
  suppliers,
  projects,
  debts,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = suppliers || [];
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const selectedSupplier = useMemo(
    () => suppliers?.find((s) => s.id === selectedId) || null,
    [suppliers, selectedId],
  );

  // Build the list of supplier-linked items (transactions + debts)
  const items = useMemo<ReminderItem[]>(() => {
    if (!selectedSupplier) return [];
    const out: ReminderItem[] = [];
    for (const p of projects) {
      for (const e of p.expenses || []) {
        if (e.supplierId === selectedSupplier.id) {
          out.push({
            id: `e-${e.id}`,
            kind: 'expense',
            title: e.title || t('send_reminder.expense'),
            amount: e.amount,
            currency: (e.currency as Currency) || 'ILS',
            projectName: p.name,
            date: e.date,
          });
        }
      }
      for (const i of p.incomes || []) {
        if (i.supplierId === selectedSupplier.id) {
          out.push({
            id: `i-${i.id}`,
            kind: 'income',
            title: i.title || t('send_reminder.income'),
            amount: i.amount,
            currency: (i.currency as Currency) || 'ILS',
            projectName: p.name,
            date: i.date,
          });
        }
      }
    }
    // Debts linked by name match — the debt table stores personName, not a
    // supplier FK, so we match on case-insensitive name.
    for (const d of debts || []) {
      if (d.isPaid) continue;
      if (d.personName.trim().toLowerCase() === selectedSupplier.name.trim().toLowerCase()) {
        out.push({
          id: `d-${d.id}`,
          kind: 'debt',
          title: t('send_reminder.debt'),
          amount: d.amount,
          currency: d.currency,
          projectName: d.projectName,
          date: d.dueDate,
        });
      }
    }
    return out;
  }, [selectedSupplier, projects, debts, t]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(items.map((i) => i.id)));
    }
  };

  const buildMessage = (): string => {
    if (!selectedSupplier) return '';
    const lines: string[] = [];
    lines.push(t('send_reminder.greeting', { name: selectedSupplier.name }));
    lines.push('');
    const picked = items.filter((i) => checkedIds.has(i.id));
    for (const it of picked) {
      const sym = CURRENCY_SYM[it.currency] || '';
      const amount = `${sym}${it.amount.toLocaleString()}`;
      const project = it.projectName ? ` (${it.projectName})` : '';
      const kindLabel =
        it.kind === 'debt'
          ? t('send_reminder.line_debt')
          : it.kind === 'income'
          ? t('send_reminder.line_income')
          : t('send_reminder.line_expense');
      lines.push(`• ${kindLabel}: ${amount}${project}`);
    }
    lines.push('');
    lines.push(t('send_reminder.footer'));
    return lines.join('\n');
  };

  const handleSend = () => {
    if (!selectedSupplier) return;
    if (!selectedSupplier.phone) {
      const title = t('send_reminder.no_phone_title');
      const body = t('send_reminder.no_phone_msg');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${title}\n\n${body}`);
      } else {
        Alert.alert(title, body);
      }
      return;
    }
    const cleanPhone = selectedSupplier.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '972' + cleanPhone.substring(1)
      : cleanPhone.startsWith('972')
      ? cleanPhone
      : '972' + cleanPhone;
    const text = encodeURIComponent(buildMessage());
    openExternalURL(`https://wa.me/${formattedPhone}?text=${text}`);
  };

  const canSend = !!selectedSupplier && checkedIds.size > 0;

  return (
    <View style={styles.container}>
      <GradientHeader>
        <ScreenTopBar title={t('send_reminder.page_title')} onBack={goBack} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!selectedSupplier ? (
          <>
            <Text style={styles.sectionLabel}>{t('send_reminder.pick_supplier')}</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t('contacts.search_placeholder')}
              placeholderTextColor={colors.textTertiary}
            />
            {filteredSuppliers.length === 0 ? (
              <DarkCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('contacts.no_suppliers')}</Text>
              </DarkCard>
            ) : (
              <View style={{ gap: 8 }}>
                {filteredSuppliers.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.supplierRow}
                    onPress={() => setSelectedId(s.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.supplierAvatar}>
                      <MaterialIcons name="store" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supplierName}>{s.name}</Text>
                      <Text style={styles.supplierMeta}>
                        {s.category}
                        {s.phone ? ` • ${s.phone}` : ''}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-left" size={22} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected supplier summary + change */}
            <DarkCard style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.supplierAvatar}>
                  <MaterialIcons name="store" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{selectedSupplier.name}</Text>
                  <Text style={styles.supplierMeta}>
                    {selectedSupplier.phone || t('send_reminder.no_phone_short')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedId(null);
                    setCheckedIds(new Set());
                  }}
                >
                  <Text style={styles.changeText}>{t('send_reminder.change')}</Text>
                </TouchableOpacity>
              </View>
            </DarkCard>

            {/* Items list */}
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionLabel}>{t('send_reminder.items_label')}</Text>
              {items.length > 0 && (
                <TouchableOpacity onPress={toggleAll}>
                  <Text style={styles.toggleAllText}>
                    {checkedIds.size === items.length
                      ? t('send_reminder.unselect_all')
                      : t('send_reminder.select_all')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {items.length === 0 ? (
              <DarkCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('send_reminder.no_items')}</Text>
              </DarkCard>
            ) : (
              <View style={{ gap: 8 }}>
                {items.map((it) => {
                  const checked = checkedIds.has(it.id);
                  const sym = CURRENCY_SYM[it.currency] || '';
                  const kindColor =
                    it.kind === 'debt'
                      ? colors.error
                      : it.kind === 'income'
                      ? colors.success
                      : colors.warning;
                  return (
                    <TouchableOpacity
                      key={it.id}
                      style={[styles.itemRow, checked && styles.itemRowChecked]}
                      onPress={() => toggleItem(it.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name={checked ? 'check-box' : 'check-box-outline-blank'}
                        size={22}
                        color={checked ? colors.primary : colors.textTertiary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{it.title}</Text>
                        <Text style={styles.itemMeta}>
                          {it.projectName ? `${it.projectName} • ` : ''}
                          {it.date || ''}
                        </Text>
                      </View>
                      <Text style={[styles.itemAmount, { color: kindColor }]}>
                        {sym}
                        {it.amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Preview */}
            {checkedIds.size > 0 && (
              <DarkCard style={styles.previewCard}>
                <Text style={styles.previewLabel}>{t('send_reminder.preview')}</Text>
                <Text style={styles.previewText}>{buildMessage()}</Text>
              </DarkCard>
            )}
          </>
        )}
      </ScrollView>

      {selectedSupplier && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={canSend ? handleSend : undefined}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            <MaterialIcons name="chat" size={20} color={colors.white} />
            <Text style={styles.sendBtnText}>
              {t('send_reminder.send_btn')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 140,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  searchInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    fontSize: 14,
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  supplierMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  selectedCard: {
    padding: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changeText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleAllText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  itemRowChecked: {
    borderColor: colors.primary,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  previewCard: {
    padding: 14,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  previewText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});

export default SendReminder;
