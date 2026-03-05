import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Debt, Currency, ReminderInterval, Project } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

interface DebtsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
  projects: Project[];
  debts: Debt[];
  onSaveDebt: (debt: Omit<Debt, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteDebt: (id: string) => void;
}

const REMINDER_LABELS: Record<ReminderInterval, string> = {
  none: '\u05DC\u05DC\u05D0',
  daily: '\u05D9\u05D5\u05DE\u05D9',
  '2days': '\u05D9\u05D5\u05DE\u05D9\u05D9\u05DD',
  '3days': '3 \u05D9\u05DE\u05D9\u05DD',
  weekly: '\u05E9\u05D1\u05D5\u05E2\u05D9',
  biweekly: '\u05E9\u05D1\u05D5\u05E2\u05D9\u05D9\u05DD',
  monthly: '\u05D7\u05D5\u05D3\u05E9\u05D9',
};

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const Debts: React.FC<DebtsProps> = ({
  onNavigate,
  goBack,
  globalCurrency,
  convertAmount,
  projects,
  debts,
  onSaveDebt,
  onDeleteDebt,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form state
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval>('none');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const totalDebt = debts
    .filter((d) => !d.isPaid)
    .reduce((sum, d) => sum + convertAmount(d.amount), 0);

  const resetForm = () => {
    setPersonName('');
    setPersonPhone('');
    setAmount('');
    setCurrency('ILS');
    setSelectedProjectId('');
    setNotes('');
    setReminderInterval('none');
    setImageUrl('');
    setEditingDebt(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setPersonName(debt.personName);
    setPersonPhone(debt.personPhone || '');
    setAmount(debt.amount.toString());
    setCurrency(debt.currency);
    setSelectedProjectId(debt.projectId || '');
    setNotes(debt.notes || '');
    setReminderInterval(debt.reminderInterval);
    setImageUrl(debt.imageUrl || '');
    setShowAddModal(true);
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DC\u05D2\u05DC\u05E8\u05D9\u05D4');
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
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D1\u05D7\u05D9\u05E8\u05EA \u05EA\u05DE\u05D5\u05E0\u05D4');
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
      personName: personName.trim(),
      personPhone: personPhone.trim() || undefined,
      amount: parseFloat(amount),
      currency,
      projectId: selectedProjectId || undefined,
      projectName,
      notes: notes.trim() || undefined,
      reminderInterval,
      isPaid: editingDebt?.isPaid || false,
      lastReminderDate: editingDebt?.lastReminderDate,
      nextReminderDate: calculateNextReminder(reminderInterval),
      imageUrl: imageUrl || undefined,
    };

    onSaveDebt(debtData);
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      '\u05DE\u05D7\u05D9\u05E7\u05EA \u05D7\u05D5\u05D1',
      '\u05D4\u05D0\u05DD \u05D0\u05EA\u05D4 \u05D1\u05D8\u05D5\u05D7 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05DE\u05D7\u05D5\u05E7 \u05D7\u05D5\u05D1 \u05D6\u05D4?',
      [
        { text: '\u05D1\u05D9\u05D8\u05D5\u05DC', style: 'cancel' },
        {
          text: '\u05DE\u05D7\u05E7',
          style: 'destructive',
          onPress: () => onDeleteDebt(id),
        },
      ]
    );
  };

  const handleMarkPaid = (debt: Debt) => {
    onSaveDebt({ ...debt, isPaid: true });
  };

  const handleSendWhatsApp = (debt: Debt) => {
    if (!debt.personPhone) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8 \u05D6\u05D4');
      return;
    }

    const message = `\u05E9\u05DC\u05D5\u05DD ${debt.personName},
\u05D6\u05D5\u05D4\u05D9 \u05EA\u05D6\u05DB\u05D5\u05E8\u05EA \u05D9\u05D3\u05D9\u05D3\u05D5\u05EA\u05D9\u05EA \u05DC\u05D2\u05D1\u05D9 \u05D4\u05D7\u05D5\u05D1 \u05D1\u05E1\u05DA ${currencySymbols[debt.currency]}${debt.amount.toLocaleString()}.
${debt.projectName ? `\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8: ${debt.projectName}` : ''}
${debt.notes ? `\u05D4\u05E2\u05E8\u05D5\u05EA: ${debt.notes}` : ''}
\u05D0\u05E9\u05DE\u05D7 \u05DC\u05E1\u05D2\u05D5\u05E8 \u05D0\u05EA \u05D4\u05E2\u05E0\u05D9\u05D9\u05DF \u05D1\u05D4\u05E7\u05D3\u05DD.
\u05EA\u05D5\u05D3\u05D4!`;

    const cleanPhone = debt.personPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '972' + cleanPhone.substring(1)
      : cleanPhone;

    Linking.openURL(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    );

    onSaveDebt({
      ...debt,
      lastReminderDate: new Date().toISOString().split('T')[0],
      nextReminderDate: calculateNextReminder(debt.reminderInterval),
    });
  };

  const activeDebts = debts.filter((d) => !d.isPaid);
  const paidDebts = debts.filter((d) => d.isPaid);
  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name || ''
    : '';

  return (
    <View style={styles.container}>
      {/* Project Picker Modal */}
      <Modal visible={showProjectPicker} transparent animationType="fade">
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowProjectPicker(false)}
        >
          <View style={[styles.pickerCard, neuRaisedLg]}>
            <Text style={styles.pickerTitle}>{'\u05D1\u05D7\u05E8 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
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
              <Text style={styles.pickerItemText}>{'\u05DC\u05DC\u05D0 \u05E9\u05D9\u05D5\u05DA'}</Text>
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

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          />
          <View style={[styles.modalCard, neuRaisedLg]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingDebt ? '\u05E2\u05E8\u05D9\u05DB\u05EA \u05D7\u05D5\u05D1' : '\u05D7\u05D5\u05D1 \u05D7\u05D3\u05E9'}
              </Text>

              {/* Person Name */}
              <Text style={styles.fieldLabel}>{'\u05E9\u05DD \u05D4\u05D7\u05D9\u05D9\u05D1 *'}</Text>
              <TextInput
                style={styles.input}
                value={personName}
                onChangeText={setPersonName}
                placeholder={'\u05E9\u05DD \u05DE\u05DC\u05D0'}
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />

              {/* Phone */}
              <Text style={styles.fieldLabel}>{'\u05D8\u05DC\u05E4\u05D5\u05DF (\u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05EA\u05D6\u05DB\u05D5\u05E8\u05D5\u05EA)'}</Text>
              <TextInput
                style={[styles.input, { textAlign: 'left' }]}
                value={personPhone}
                onChangeText={setPersonPhone}
                placeholder="050-0000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              {/* Amount & Currency */}
              <Text style={styles.fieldLabel}>{'\u05E1\u05DB\u05D5\u05DD *'}</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
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
              <Text style={styles.fieldLabel}>{'\u05E9\u05D9\u05D5\u05DA \u05DC\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 (\u05D0\u05D5\u05E4\u05E6\u05D9\u05D5\u05E0\u05DC\u05D9)'}</Text>
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
                  {selectedProjectName || '\u05DC\u05DC\u05D0 \u05E9\u05D9\u05D5\u05DA'}
                </Text>
              </TouchableOpacity>

              {/* Notes */}
              <Text style={styles.fieldLabel}>{'\u05D4\u05E2\u05E8\u05D5\u05EA'}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={'\u05D4\u05E2\u05E8\u05D5\u05EA \u05E0\u05D5\u05E1\u05E4\u05D5\u05EA...'}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />

              {/* Image Upload */}
              <Text style={styles.fieldLabel}>{'\u05EA\u05DE\u05D5\u05E0\u05D4 / \u05E7\u05D1\u05DC\u05D4'}</Text>
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
                    <Text style={styles.replaceImageText}>{'\u05D4\u05D7\u05DC\u05E3 \u05EA\u05DE\u05D5\u05E0\u05D4'}</Text>
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
                      <Text style={styles.uploadBtnText}>{'\u05DE\u05E2\u05DC\u05D4 \u05EA\u05DE\u05D5\u05E0\u05D4...'}</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={28}
                        color={colors.textTertiary}
                      />
                      <Text style={styles.uploadBtnText}>{'\u05D4\u05D5\u05E1\u05E3 \u05EA\u05DE\u05D5\u05E0\u05D4'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Reminder Interval */}
              <Text style={styles.fieldLabel}>{'\u05EA\u05D6\u05DB\u05D5\u05E8\u05EA'}</Text>
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
                        : [neuRaised, styles.reminderPillInactive],
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
                <TouchableOpacity
                  style={[styles.modalBtn, neuRaised]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelBtnText}>{'\u05D1\u05D9\u05D8\u05D5\u05DC'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.saveBtnBg,
                    (!personName.trim() || !amount) && styles.disabledBtn,
                  ]}
                  onPress={handleSave}
                  disabled={!personName.trim() || !amount}
                >
                  <Text style={styles.saveBtnText}>
                    {editingDebt ? '\u05E2\u05D3\u05DB\u05DF' : '\u05D4\u05D5\u05E1\u05E3'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={styles.headerTitle}>{'\u05D7\u05D9\u05D9\u05D1\u05D9\u05DD \u05DC\u05D9'}</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={openAddModal}>
          <MaterialIcons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Summary */}
        <View style={[styles.totalCard, neuRaised]}>
          <Text style={styles.totalLabel}>{'\u05E1\u05D4"\u05DB \u05D7\u05D9\u05D9\u05D1\u05D9\u05DD \u05DC\u05D9'}</Text>
          <Text style={styles.totalAmount}>
            {currencySymbols[globalCurrency]}
            {totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.totalCount}>
            {activeDebts.length} {'\u05D7\u05D5\u05D1\u05D5\u05EA \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD'}
          </Text>
        </View>

        {/* Active Debts */}
        {activeDebts.length > 0 ? (
          <View style={styles.debtSection}>
            <Text style={styles.sectionTitle}>{'\u05D7\u05D5\u05D1\u05D5\u05EA \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD'}</Text>
            {activeDebts.map((debt) => (
              <View key={debt.id} style={[styles.debtCard, neuRaised]}>
                <View style={styles.debtHeader}>
                  <View style={styles.debtPersonRow}>
                    <View style={styles.debtAvatar}>
                      <MaterialIcons name="person" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.debtPersonInfo}>
                      <Text style={styles.debtName}>{debt.personName}</Text>
                      {debt.personPhone && (
                        <Text style={styles.debtPhone}>{debt.personPhone}</Text>
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

                {debt.reminderInterval !== 'none' && (
                  <View style={styles.debtMeta}>
                    <MaterialIcons name="schedule" size={14} color={colors.warning} />
                    <Text style={styles.debtMetaText}>
                      {'\u05EA\u05D6\u05DB\u05D5\u05E8\u05EA: '}{REMINDER_LABELS[debt.reminderInterval]}
                      {debt.nextReminderDate && ` (${debt.nextReminderDate})`}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.debtActions}>
                  {debt.personPhone && (
                    <TouchableOpacity
                      style={[styles.debtActionBtn, neuRaised, { flex: 1 }]}
                      onPress={() => handleSendWhatsApp(debt)}
                    >
                      <MaterialIcons name="chat" size={16} color={colors.success} />
                      <Text style={[styles.debtActionText, { color: colors.success }]}>
                        {'\u05E9\u05DC\u05D7 \u05EA\u05D6\u05DB\u05D5\u05E8\u05EA'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.debtActionBtn, neuRaised, { flex: 1 }]}
                    onPress={() => handleMarkPaid(debt)}
                  >
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                    <Text style={[styles.debtActionText, { color: colors.primary }]}>
                      {'\u05E9\u05D5\u05DC\u05DD'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.debtActionSmall, neuRaised]}
                    onPress={() => openEditModal(debt)}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.debtActionSmall, neuRaised]}
                    onPress={() => handleDelete(debt.id)}
                  >
                    <MaterialIcons name="delete" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="savings" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{'\u05D0\u05D9\u05DF \u05D7\u05D5\u05D1\u05D5\u05EA \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD'}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
              <Text style={styles.emptyBtnText}>{'\u05D4\u05D5\u05E1\u05E3 \u05D7\u05D5\u05D1 \u05D7\u05D3\u05E9'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paid Debts */}
        {paidDebts.length > 0 && (
          <View style={styles.debtSection}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              {'\u05D7\u05D5\u05D1\u05D5\u05EA \u05E9\u05E9\u05D5\u05DC\u05DE\u05D5'}
            </Text>
            {paidDebts.map((debt) => (
              <View key={debt.id} style={[styles.paidDebtCard]}>
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
              </View>
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
    backgroundColor: colors.neuBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  addBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    gap: 20,
  },

  // Total
  totalCard: {
    borderRadius: radii['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    backgroundColor: colors.neuBg,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.success,
  },
  totalCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    writingDirection: 'rtl',
  },

  // Section
  debtSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },

  // Debt Card
  debtCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.neuBg,
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
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtPersonInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  debtPhone: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
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
  debtNotes: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 10,
    borderRadius: radii.md,
    marginBottom: 10,
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
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  debtActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.neuBg,
  },
  debtActionText: {
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  debtActionSmall: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },

  // Empty
  emptyCard: {
    borderRadius: radii['2xl'],
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radii.md,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    writingDirection: 'rtl',
  },

  // Paid
  paidDebtCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidDebtName: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputText: {
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '700',
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
  },
  currencyBtnActive: {
    backgroundColor: colors.primary,
  },
  currencyBtnInactive: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  currencyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  currencyBtnTextActive: {
    color: colors.white,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.04)',
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
  },
  reminderPillActive: {
    backgroundColor: colors.primary,
  },
  reminderPillInactive: {
    backgroundColor: colors.neuBg,
  },
  reminderPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  reminderPillTextActive: {
    color: colors.white,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.neuBg,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  saveBtnBg: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    writingDirection: 'rtl',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pickerCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    width: '100%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default Debts;
