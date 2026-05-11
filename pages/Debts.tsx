import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { useTranslation } from 'react-i18next';
import { AppScreen, Debt, Currency, ReminderInterval, Project, DebtDirection, Supplier, confirmDialog } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { GradientButton } from '../components/ui/GradientButton';
import { SectionHeader } from '../components/ui/SectionHeader';

interface DebtsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
  projects: Project[];
  debts: Debt[];
  suppliers?: Supplier[];
  onSaveDebt: (debt: Omit<Debt, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteDebt: (id: string) => void;
  autoOpenAdd?: boolean;
}

const REMINDER_LABELS: Record<ReminderInterval, string> = {
  none: 'ללא',
  daily: 'יומי',
  '2days': 'יומיים',
  '3days': '3 ימים',
  weekly: 'שבועי',
  biweekly: 'שבועיים',
  monthly: 'חודשי',
};

const currencySymbols: Record<Currency, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
};

const Debts: React.FC<DebtsProps> = ({
  onNavigate,
  goBack,
  globalCurrency,
  convertAmount,
  projects,
  debts,
  suppliers,
  onSaveDebt,
  onDeleteDebt,
  autoOpenAdd,
}) => {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [activeDirection, setActiveDirection] = useState<DebtDirection>('owed_to_me');

  // Unified contact list built from existing debts + suppliers, deduplicated
  // by name+phone so the picker doesn't repeat the same person.
  const contactPickerEntries = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; name: string; phone?: string; source: 'debt' | 'supplier' }> = [];
    for (const d of debts) {
      const key = `${d.personName}|${d.personPhone || ''}`.toLowerCase();
      if (seen.has(key) || !d.personName.trim()) continue;
      seen.add(key);
      out.push({ id: `d-${d.id}`, name: d.personName, phone: d.personPhone, source: 'debt' });
    }
    for (const s of suppliers || []) {
      const key = `${s.name}|${s.phone || ''}`.toLowerCase();
      if (seen.has(key) || !s.name.trim()) continue;
      seen.add(key);
      out.push({ id: `s-${s.id}`, name: s.name, phone: s.phone, source: 'supplier' });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [debts, suppliers]);

  useEffect(() => {
    if (autoOpenAdd) {
      setShowAddModal(true);
    }
  }, [autoOpenAdd]);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form state
  const [direction, setDirection] = useState<DebtDirection>('owed_to_me');
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval>('none');
  const [dueDate, setDueDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const normalizedDebts = debts.map((d) => ({
    ...d,
    direction: (d.direction || 'owed_to_me') as DebtDirection,
  }));

  const directionDebts = normalizedDebts.filter(
    (d) => d.direction === activeDirection
  );
  const totalDebt = directionDebts
    .filter((d) => !d.isPaid)
    .reduce((sum, d) => sum + convertAmount(d.amount), 0);

  const resetForm = () => {
    setDirection(activeDirection);
    setPersonName('');
    setPersonPhone('');
    setAmount('');
    setCurrency('ILS');
    setSelectedProjectId('');
    setNotes('');
    setReminderInterval('none');
    setDueDate('');
    setImageUrl('');
    setEditingDebt(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setDirection((debt.direction || 'owed_to_me') as DebtDirection);
    setPersonName(debt.personName);
    setPersonPhone(debt.personPhone || '');
    setAmount(debt.amount.toString());
    setCurrency(debt.currency);
    setSelectedProjectId(debt.projectId || '');
    setNotes(debt.notes || '');
    setReminderInterval(debt.reminderInterval);
    setDueDate(debt.dueDate || '');
    setImageUrl(debt.imageUrl || '');
    setShowAddModal(true);
  };

  const handlePickContact = async () => {
    if (Platform.OS === 'web') {
      // Web Contacts API is only available on mobile Chrome over HTTPS.
      // Try it as a best-effort; otherwise tell the user to type manually.
      const navAny = (typeof navigator !== 'undefined' ? (navigator as any) : null);
      if (navAny?.contacts?.select) {
        try {
          const props = ['name', 'tel'];
          const opts = { multiple: false };
          const picked: any[] = await navAny.contacts.select(props, opts);
          const c = picked?.[0];
          if (c) {
            const name = Array.isArray(c.name) ? c.name[0] : c.name;
            const tel = Array.isArray(c.tel) ? c.tel[0] : c.tel;
            if (name) setPersonName(String(name));
            if (tel) setPersonPhone(String(tel));
          }
        } catch {
          // user cancelled or unsupported
        }
        return;
      }
      Alert.alert('לא זמין', 'בחירת איש קשר זמינה רק בנייד (או ב-Chrome נייד עם HTTPS).');
      return;
    }
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('שגיאה', 'נדרשת הרשאת גישה לאנשי קשר');
        return;
      }
      const contact: any = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      // Build display name with fallbacks: name → firstName lastName → phone label
      const fullName = [contact.firstName, contact.middleName, contact.lastName]
        .filter((p) => typeof p === 'string' && p.trim().length > 0)
        .join(' ')
        .trim();
      const resolvedName: string =
        (typeof contact.name === 'string' && contact.name.trim().length > 0
          ? contact.name.trim()
          : fullName) || '';

      const phoneEntry = Array.isArray(contact.phoneNumbers) ? contact.phoneNumbers[0] : undefined;
      const resolvedPhone: string =
        (phoneEntry && (phoneEntry.number || phoneEntry.digits)) || '';

      if (resolvedName) setPersonName(resolvedName);
      if (resolvedPhone) setPersonPhone(resolvedPhone);

      if (!resolvedName && !resolvedPhone) {
        // Surface raw fields so we can fix any unexpected shape.
        console.warn('[handlePickContact] contact returned with no usable fields', contact);
        Alert.alert('שים לב', 'לא הצלחנו לקרוא את פרטי איש הקשר. נסה ידנית.');
      }
    } catch (err) {
      console.error('[handlePickContact] error', err);
      Alert.alert('שגיאה', 'שגיאה בבחירת איש קשר');
    }
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('שגיאה', 'נדרשת הרשאת גישה לגלריה');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('שגיאה', 'שגיאה בבחירת תמונה');
    }
  };

  const calculateNextReminder = (interval: ReminderInterval): string | undefined => {
    if (interval === 'none') return undefined;
    const now = new Date();
    const days: Record<ReminderInterval, number> = {
      none: 0,
      daily: 1,
      '2days': 2,
      '3days': 3,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    now.setDate(now.getDate() + days[interval]);
    return now.toISOString().split('T')[0];
  };

  const handleSave = () => {
    if (!personName.trim() || !amount) return;

    const projectName = selectedProjectId
      ? projects.find((p) => p.id === selectedProjectId)?.name
      : undefined;

    const debtData = {
      id: editingDebt?.id,
      direction,
      personName: personName.trim(),
      personPhone: personPhone.trim() || undefined,
      amount: parseFloat(amount),
      currency,
      projectId: selectedProjectId || undefined,
      projectName,
      notes: notes.trim() || undefined,
      reminderInterval,
      dueDate: dueDate.trim() || undefined,
      isPaid: editingDebt?.isPaid || false,
      lastReminderDate: editingDebt?.lastReminderDate,
      nextReminderDate: calculateNextReminder(reminderInterval),
      imageUrl: imageUrl || undefined,
    };

    onSaveDebt(debtData);
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'מחיקת חוב',
      message: 'האם אתה בטוח שברצונך למחוק חוב זה?',
      confirmText: 'מחק',
      destructive: true,
    });
    if (ok) onDeleteDebt(id);
  };

  const handleMarkPaid = (debt: Debt) => {
    onSaveDebt({ ...debt, isPaid: true });
  };

  const handleSendWhatsApp = (debt: Debt) => {
    if (!debt.personPhone) {
      const title = t('common.error');
      const body = t('debts.err_no_phone');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${title}\n\n${body}`);
      } else {
        Alert.alert(title, body);
      }
      return;
    }

    const message = `שלום ${debt.personName},
זוהי תזכורת ידידותית לגבי החוב בסך ${currencySymbols[debt.currency]}${debt.amount.toLocaleString()}.
${debt.projectName ? `פרויקט: ${debt.projectName}` : ''}
${debt.notes ? `הערות: ${debt.notes}` : ''}
אשמח לסגור את העניין בהקדם.
תודה!`;

    const cleanPhone = debt.personPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '972' + cleanPhone.substring(1)
      : cleanPhone;

    openExternalURL(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    );

    onSaveDebt({
      ...debt,
      lastReminderDate: new Date().toISOString().split('T')[0],
      nextReminderDate: calculateNextReminder(debt.reminderInterval),
    });
  };

  const handleSendAllReminders = async () => {
    const eligible = activeDebts.filter((d) => d.personPhone);
    if (eligible.length === 0) {
      const title = t('debts.reminders_title');
      const body = t('debts.no_eligible_reminders');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${title}\n\n${body}`);
      } else {
        Alert.alert(title, body);
      }
      return;
    }
    const ok = await confirmDialog({
      title: t('debts.reminders_title'),
      message: t('debts.confirm_send_all', { count: eligible.length }),
      confirmText: t('debts.send_all'),
    });
    if (!ok) return;
    for (const debt of eligible) {
      // small stagger so the browser doesn't squash multiple window.opens
      await new Promise((r) => setTimeout(r, 350));
      handleSendWhatsApp(debt);
    }
  };

  const activeDebts = directionDebts.filter((d) => !d.isPaid);
  const paidDebts = directionDebts.filter((d) => d.isPaid);

  const isOwedToMe = activeDirection === 'owed_to_me';
  const summaryLabel = isOwedToMe ? t('debts.total_owed_to_me') : t('debts.total_i_owe');
  const emptyLabel = t('debts.empty_active');
  const personLabel = t('debts.name_label');
  const summaryColor = isOwedToMe ? colors.error : colors.warning;
  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name || ''
    : '';

  const projectPickerModal = (
    <Modal visible={showProjectPicker} transparent animationType="fade">
      <Pressable
        style={styles.pickerOverlay}
        onPress={() => setShowProjectPicker(false)}
      >
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>{'בחר פרויקט'}</Text>
          <TouchableOpacity
            style={[
              styles.pickerItem,
              !selectedProjectId && styles.pickerItemActive,
            ]}
            onPress={() => {
              setSelectedProjectId('');
              setShowProjectPicker(false);
            }}
          >
            <Text style={styles.pickerItemText}>{'ללא שיוך'}</Text>
          </TouchableOpacity>
          <ScrollView style={{ maxHeight: 300 }}>
            {projects.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.pickerItem,
                  selectedProjectId === p.id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedProjectId(p.id);
                  setShowProjectPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Contact Picker Modal */}
      <Modal visible={showContactPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowContactPicker(false)}
          />
          <View style={styles.contactPickerCard}>
            <Text style={styles.modalTitle}>{t('debts.pick_contact_title')}</Text>
            {contactPickerEntries.length === 0 ? (
              <Text style={styles.contactPickerEmpty}>
                {t('debts.pick_contact_empty')}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 360 }}>
                {contactPickerEntries.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.contactPickerRow}
                    onPress={() => {
                      setPersonName(c.name);
                      if (c.phone) setPersonPhone(c.phone);
                      setShowContactPicker(false);
                    }}
                  >
                    <View style={styles.contactPickerAvatar}>
                      <MaterialIcons
                        name={c.source === 'supplier' ? 'store' : 'person'}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactPickerName}>{c.name}</Text>
                      {c.phone ? (
                        <Text style={styles.contactPickerPhone}>{c.phone}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.contactPickerCancel}
              onPress={() => setShowContactPicker(false)}
            >
              <Text style={styles.contactPickerCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          />
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingDebt ? 'עריכת חוב' : 'חוב חדש'}
              </Text>

              {/* Direction Toggle */}
              <Text style={styles.fieldLabel}>{'סוג החוב *'}</Text>
              <View style={styles.directionRow}>
                <TouchableOpacity
                  style={[
                    styles.directionBtn,
                    direction === 'owed_to_me' && styles.directionBtnActive,
                  ]}
                  onPress={() => setDirection('owed_to_me')}
                >
                  <MaterialIcons
                    name="trending-down"
                    size={18}
                    color={
                      direction === 'owed_to_me'
                        ? colors.bgPrimary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.directionText,
                      direction === 'owed_to_me' && styles.directionTextActive,
                    ]}
                  >
                    {'חייבים לי'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.directionBtn,
                    direction === 'i_owe' && styles.directionBtnActive,
                  ]}
                  onPress={() => setDirection('i_owe')}
                >
                  <MaterialIcons
                    name="trending-up"
                    size={18}
                    color={
                      direction === 'i_owe'
                        ? colors.bgPrimary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.directionText,
                      direction === 'i_owe' && styles.directionTextActive,
                    ]}
                  >
                    {'אני חייב'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pick from contacts */}
              {contactPickerEntries.length > 0 && (
                <TouchableOpacity
                  style={styles.contactPickerInlineBtn}
                  onPress={() => setShowContactPicker(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="contacts" size={18} color={colors.primary} />
                  <Text style={styles.contactPickerText}>
                    {t('debts.pick_from_contacts')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Person Name */}
              <Text style={styles.fieldLabel}>{personLabel}</Text>
              <TextInput
                style={styles.input}
                value={personName}
                onChangeText={setPersonName}
                placeholder={'שם מלא'}
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />

              {/* Phone */}
              <Text style={styles.fieldLabel}>{'טלפון (לשליחת תזכורות)'}</Text>
              <View style={styles.phoneRowInput}>
                <TextInput
                  style={[styles.input, styles.phoneInputField, { textAlign: 'left' }]}
                  value={personPhone}
                  onChangeText={setPersonPhone}
                  placeholder="050-0000000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
                {(Platform.OS !== 'web' ||
                  (typeof navigator !== 'undefined' && (navigator as any)?.contacts?.select)) && (
                  <TouchableOpacity
                    style={styles.contactPickerBtn}
                    onPress={handlePickContact}
                  >
                    <MaterialIcons name="contacts" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Amount & Currency */}
              <Text style={styles.fieldLabel}>{'סכום *'}</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    setAmount(sanitized);
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                  inputMode="decimal"
                  textAlign="left"
                />
                <View style={styles.currencyRow}>
                  {(['ILS', 'USD', 'EUR'] as Currency[]).map((cur) => (
                    <TouchableOpacity
                      key={cur}
                      style={[
                        styles.currencyBtn,
                        currency === cur
                          ? styles.currencyBtnActive
                          : styles.currencyBtnInactive,
                      ]}
                      onPress={() => setCurrency(cur)}
                    >
                      <Text
                        style={[
                          styles.currencyBtnText,
                          currency === cur && styles.currencyBtnTextActive,
                        ]}
                      >
                        {currencySymbols[cur]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Project */}
              <Text style={styles.fieldLabel}>{'שיוך לפרויקט (אופציונלי)'}</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowProjectPicker(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !selectedProjectId && { color: colors.textTertiary },
                  ]}
                >
                  {selectedProjectName || 'ללא שיוך'}
                </Text>
              </TouchableOpacity>

              {/* Notes */}
              <Text style={styles.fieldLabel}>{'הערות'}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={'הערות נוספות...'}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />

              {/* Image Upload */}
              <Text style={styles.fieldLabel}>{'תמונה / קבלה'}</Text>
              {imageUrl ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imagePreviewImg}
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImageUrl('')}
                  >
                    <MaterialIcons name="close" size={16} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.replaceImageBtn}
                    onPress={handleImageUpload}
                  >
                    <Text style={styles.replaceImageText}>{'החלף תמונה'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handleImageUpload}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <ActivityIndicator color={colors.textTertiary} />
                      <Text style={styles.uploadBtnText}>{'מעלה תמונה...'}</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={28}
                        color={colors.textTertiary}
                      />
                      <Text style={styles.uploadBtnText}>{'הוסף תמונה'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Due Date */}
              <Text style={styles.fieldLabel}>
                {direction === 'i_owe' ? 'תאריך תשלום' : 'תאריך החזרה צפוי'}
              </Text>
              {Platform.OS === 'web' ? (
                // @ts-ignore — web-only native input
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e: any) => setDueDate(e.target.value)}
                  style={{
                    backgroundColor: colors.bgTertiary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.subtleBorder,
                    borderStyle: 'solid',
                    padding: '12px 16px',
                    fontSize: 15,
                    color: colors.textPrimary,
                    fontFamily: fonts.semibold,
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    direction: 'ltr',
                    textAlign: 'left',
                  } as any}
                />
              ) : (
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              )}

              {/* Reminder Interval */}
              <Text style={styles.fieldLabel}>{'תזכורת'}</Text>
              <View style={styles.reminderGrid}>
                {(
                  Object.entries(REMINDER_LABELS) as [ReminderInterval, string][]
                ).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.reminderPill,
                      reminderInterval === key
                        ? styles.reminderPillActive
                        : styles.reminderPillInactive,
                    ]}
                    onPress={() => setReminderInterval(key)}
                  >
                    <Text
                      style={[
                        styles.reminderPillText,
                        reminderInterval === key && styles.reminderPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <GradientButton
                  label="ביטול"
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  variant="outline"
                  style={styles.modalActionBtn}
                />
                <GradientButton
                  label={editingDebt ? 'עדכן' : 'הוסף'}
                  onPress={handleSave}
                  disabled={!personName.trim() || !amount}
                  style={styles.modalActionBtn}
                />
              </View>
            </ScrollView>
          </View>
          {projectPickerModal}
        </View>
      </Modal>

      {/* Gradient Header */}
      <GradientHeader>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.addFab} onPress={openAddModal}>
            <MaterialIcons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('debts.page_title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Direction Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeDirection === 'owed_to_me' && styles.tabActive,
            ]}
            onPress={() => setActiveDirection('owed_to_me')}
          >
            <MaterialIcons
              name="trending-down"
              size={16}
              color={activeDirection === 'owed_to_me' ? colors.bgPrimary : colors.white}
            />
            <Text
              style={[
                styles.tabText,
                activeDirection === 'owed_to_me' && styles.tabTextActive,
              ]}
            >
              {t('debts.owed_to_me')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeDirection === 'i_owe' && styles.tabActive,
            ]}
            onPress={() => setActiveDirection('i_owe')}
          >
            <MaterialIcons
              name="trending-up"
              size={16}
              color={activeDirection === 'i_owe' ? colors.bgPrimary : colors.white}
            />
            <Text
              style={[
                styles.tabText,
                activeDirection === 'i_owe' && styles.tabTextActive,
              ]}
            >
              {t('debts.i_owe')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Glass Card */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summaryLabel}</Text>
          <Text style={[styles.summaryAmount, { color: summaryColor }]}>
            {currencySymbols[globalCurrency]}
            {totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.summaryCount}>
            {t(activeDebts.length === 1 ? 'debts.count_one' : 'debts.count_other', { count: activeDebts.length })}
          </Text>
        </GlassCard>
      </GradientHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bulk-reminder button — only for the "owed to me" tab */}
        {isOwedToMe && activeDebts.length > 0 && (
          <TouchableOpacity
            style={styles.bulkReminderBtn}
            onPress={handleSendAllReminders}
            activeOpacity={0.85}
          >
            <MaterialIcons name="notifications-active" size={20} color={colors.white} />
            <Text style={styles.bulkReminderText}>
              {t('debts.send_reminders_to_all')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Active Debts */}
        {activeDebts.length > 0 ? (
          <View style={styles.debtSection}>
            <SectionHeader title={t('debts.active')} />
            {activeDebts.map((debt) => (
              <DarkCard key={debt.id} style={styles.debtCard}>
                <View style={styles.debtHeader}>
                  <View style={styles.debtPersonRow}>
                    <View style={styles.debtAvatar}>
                      <MaterialIcons name="person" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.debtPersonInfo}>
                      <Text style={styles.debtName}>{debt.personName}</Text>
                      {debt.personPhone && (
                        <View style={styles.phoneRow}>
                          <MaterialIcons name="phone" size={12} color={colors.textTertiary} />
                          <Text style={styles.debtPhone}>{debt.personPhone}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.debtAmount}>
                    {currencySymbols[debt.currency]}
                    {debt.amount.toLocaleString()}
                  </Text>
                </View>

                {debt.projectName && (
                  <View style={styles.debtMeta}>
                    <MaterialIcons name="folder" size={14} color={colors.primary} />
                    <Text style={styles.debtMetaText}>{debt.projectName}</Text>
                  </View>
                )}

                {debt.dueDate && (
                  <View style={styles.dueDateBadge}>
                    <MaterialIcons name="event" size={12} color={colors.primary} />
                    <Text style={styles.dueDateBadgeText}>
                      {debt.direction === 'i_owe' ? 'לתשלום עד: ' : 'החזרה עד: '}
                      {debt.dueDate}
                    </Text>
                  </View>
                )}

                {debt.reminderInterval !== 'none' && (
                  <View style={styles.reminderBadge}>
                    <MaterialIcons name="schedule" size={12} color={colors.warning} />
                    <Text style={styles.reminderBadgeText}>
                      {'תזכורת: '}{REMINDER_LABELS[debt.reminderInterval]}
                      {debt.nextReminderDate && ` (${debt.nextReminderDate})`}
                    </Text>
                  </View>
                )}

                {debt.notes && (
                  <View style={styles.debtNotes}>
                    <Text style={styles.debtNotesText}>{debt.notes}</Text>
                  </View>
                )}

                {debt.imageUrl && (
                  <Image
                    source={{ uri: debt.imageUrl }}
                    style={styles.debtImage}
                    resizeMode="cover"
                  />
                )}

                {/* Actions */}
                <View style={styles.debtActions}>
                  {debt.direction !== 'i_owe' && (
                    <TouchableOpacity
                      style={[styles.debtActionBtn, { flex: 1 }]}
                      onPress={() => {
                        if (debt.personPhone) {
                          handleSendWhatsApp(debt);
                        } else {
                          // No phone yet — open the edit modal so the user
                          // can add one and the reminder becomes actionable.
                          openEditModal(debt);
                        }
                      }}
                    >
                      <MaterialIcons
                        name={debt.personPhone ? 'chat' : 'add-call'}
                        size={16}
                        color={debt.personPhone ? colors.success : colors.warning}
                      />
                      <Text
                        style={[
                          styles.debtActionText,
                          { color: debt.personPhone ? colors.success : colors.warning },
                        ]}
                      >
                        {debt.personPhone ? t('debts.send_reminder_btn') : t('debts.set_reminder_btn')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.debtActionBtn, { flex: 1 }]}
                    onPress={() => handleMarkPaid(debt)}
                  >
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                    <Text style={[styles.debtActionText, { color: colors.primary }]}>
                      {t('debts.mark_paid')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.debtActionSmall}
                    onPress={() => openEditModal(debt)}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.debtActionSmall}
                    onPress={() => handleDelete(debt.id)}
                  >
                    <MaterialIcons name="delete" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </DarkCard>
            ))}
          </View>
        ) : (
          <DarkCard style={styles.emptyCard}>
            <MaterialIcons name="savings" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{emptyLabel}</Text>
            <GradientButton
              label={isOwedToMe ? 'הוסף חוב חדש' : 'הוסף תזכורת תשלום'}
              onPress={openAddModal}
              style={styles.emptyAddBtn}
            />
          </DarkCard>
        )}

        {/* Paid Debts */}
        {paidDebts.length > 0 && (
          <View style={styles.debtSection}>
            <SectionHeader title={t('debts.paid')} />
            {paidDebts.map((debt) => (
              <DarkCard key={debt.id} style={styles.paidDebtCard}>
                <View style={styles.paidDebtRow}>
                  <View style={styles.paidDebtLeft}>
                    <View style={styles.paidDebtIcon}>
                      <MaterialIcons name="check" size={16} color={colors.success} />
                    </View>
                    <View>
                      <Text style={styles.paidDebtName}>{debt.personName}</Text>
                      {debt.projectName && (
                        <Text style={styles.paidDebtProject}>{debt.projectName}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.paidDebtAmount}>
                    {currencySymbols[debt.currency]}
                    {debt.amount.toLocaleString()}
                  </Text>
                </View>
              </DarkCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
  },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary Glass Card
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  summaryAmount: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.error,
  },

  // Direction Tabs (header)
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: colors.bgPrimary,
  },

  // Direction Buttons (modal)
  directionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  directionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  directionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  directionText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  directionTextActive: {
    color: colors.bgPrimary,
  },

  // Phone row with contact picker
  phoneRowInput: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  phoneInputField: {
    flex: 1,
  },
  contactPickerBtn: {
    width: 48,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Due date badge
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(0,217,217,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  dueDateBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  summaryCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    writingDirection: 'rtl',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: 20,
  },

  // Contact picker
  contactPickerInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  contactPickerText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  contactPickerCard: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  contactPickerEmpty: {
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  contactPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  contactPickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactPickerName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  contactPickerPhone: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  contactPickerCancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactPickerCancelText: {
    color: colors.textTertiary,
    fontFamily: fonts.semibold,
  },

  // Bulk reminder
  bulkReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  bulkReminderText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 15,
  },

  // Section
  debtSection: {
    gap: 12,
  },

  // Debt Card
  debtCard: {
    padding: spacing.lg,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  debtPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  debtAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,217,217,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtPersonInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  debtPhone: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  debtAmount: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.error,
  },
  debtMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  debtMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(255,176,32,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  reminderBadgeText: {
    fontSize: 11,
    color: colors.warning,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  debtNotes: {
    backgroundColor: colors.bgTertiary,
    padding: 10,
    borderRadius: radii.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  debtNotesText: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  debtImage: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    marginBottom: 10,
  },
  debtActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  debtActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  debtActionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  debtActionSmall: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },

  // Empty
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  emptyAddBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },

  // Paid Debts
  paidDebtCard: {
    padding: spacing.lg,
    opacity: 0.6,
  },
  paidDebtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidDebtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paidDebtIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,232,143,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidDebtName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    writingDirection: 'rtl',
  },
  paidDebtProject: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  paidDebtAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing.xl,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: colors.glassBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  inputText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 70,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  currencyBtn: {
    width: 44,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  currencyBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currencyBtnInactive: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.subtleBorder,
  },
  currencyBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
  },
  currencyBtnTextActive: {
    color: colors.bgPrimary,
  },

  // Image
  imagePreview: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  imagePreviewImg: {
    width: '100%',
    height: 150,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceImageBtn: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  replaceImageText: {
    fontSize: 12,
    color: colors.white,
    writingDirection: 'rtl',
  },
  uploadBtn: {
    paddingVertical: 20,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // Reminder
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  reminderPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderPillInactive: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.subtleBorder,
  },
  reminderPillText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  reminderPillTextActive: {
    color: colors.bgPrimary,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalActionBtn: {
    flex: 1,
  },

  // Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pickerCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: 'rgba(0,217,217,0.1)',
  },
  pickerItemText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default Debts;
