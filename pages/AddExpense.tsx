import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Image,
  Alert,
  Pressable,
  Switch,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Project, Supplier, Currency, Expense, Income } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, neuPressed, radii, spacing } from '../theme';

interface AddExpenseProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  projects: Project[];
  suppliers: Supplier[];
  onSave: (
    type: 'expense' | 'income',
    projectId: string,
    amount: number,
    currency: Currency,
    description: string,
    category: string,
    supplierId?: string,
    receiptImages?: string[],
    paymentMethod?: string,
    includesVat?: boolean,
    id?: string,
    originalType?: 'expense' | 'income'
  ) => Promise<void>;
  autoCapture?: boolean;
  initialType?: 'expense' | 'income';
  preselectedSupplierId?: string | null;
  editActivity?: (Expense | Income) & { projectId?: string };
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '\u20AA', USD: '$', EUR: '\u20AC' };
const CURRENCIES: Currency[] = ['ILS', 'USD', 'EUR'];

const EXPENSE_CATEGORIES = ['\u05D0\u05D5\u05DB\u05DC', '\u05D3\u05DC\u05E7', '\u05D7\u05D9\u05E0\u05D5\u05DA', '\u05E9\u05D9\u05E4\u05D5\u05E5', '\u05D7\u05D5\u05DE\u05E8\u05D9\u05DD', '\u05E9\u05DB\u05E8', '\u05D5\u05E2\u05D3', '\u05DB\u05DC\u05DC\u05D9'];
const INCOME_CATEGORIES = ['\u05DC\u05E7\u05D5\u05D7', '\u05D4\u05D7\u05D6\u05E8 \u05DE\u05E1', '\u05D1\u05D5\u05E0\u05D5\u05E1', '\u05DE\u05DB\u05D9\u05E8\u05D4', '\u05D3\u05D9\u05D1\u05D9\u05D3\u05E0\u05D3', '\u05DB\u05DC\u05DC\u05D9'];
const PAYMENT_METHODS = ['\u05DE\u05D6\u05D5\u05DE\u05DF', '\u05D0\u05E9\u05E8\u05D0\u05D9', '\u05D4\u05E2\u05D1\u05E8\u05D4', "\u05E6'\u05E7", '\u05D1\u05D9\u05D8', '\u05E4\u05D9\u05D9\u05D1\u05D5\u05E7\u05E1'];

const AddExpense: React.FC<AddExpenseProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  onSave,
  autoCapture,
  initialType = 'expense',
  preselectedSupplierId,
  editActivity,
  globalCurrency,
  convertAmount,
}) => {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(
    editActivity?.type || initialType
  );
  const [amount, setAmount] = useState(editActivity ? editActivity.amount.toString() : '');
  const [currency, setCurrency] = useState<Currency>(editActivity?.currency || 'ILS');
  const [description, setDescription] = useState(editActivity?.title || '');
  const [selectedProjectId, setSelectedProjectId] = useState(
    editActivity?.projectId || projects[0]?.id || ''
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    editActivity?.supplierId || preselectedSupplierId || ''
  );
  const [category, setCategory] = useState(editActivity?.tag || '\u05DB\u05DC\u05DC\u05D9');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [receiptImages, setReceiptImages] = useState<string[]>(editActivity?.receiptImages || []);
  const [paymentMethod, setPaymentMethod] = useState(editActivity?.paymentMethod || '\u05DE\u05D6\u05D5\u05DE\u05DF');
  const [includesVat, setIncludesVat] = useState(
    editActivity?.includesVat !== undefined ? editActivity.includesVat : true
  );
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);

  const isExp = transactionType === 'expense';
  const activeCategories = isExp ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const typeColor = isExp ? colors.error : colors.success;

  useEffect(() => {
    if (!editActivity) {
      setTransactionType(initialType);
    }
  }, [initialType, editActivity]);

  useEffect(() => {
    if (autoCapture) {
      handlePickImage();
    }
  }, [autoCapture]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const numAmount = parseFloat(amount);
    const finalCategory = isAddingCategory ? newCategory : category;
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05D0\u05E0\u05D0 \u05D4\u05D6\u05DF \u05E1\u05DB\u05D5\u05DD \u05EA\u05E7\u05D9\u05DF');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(
        transactionType,
        selectedProjectId,
        numAmount,
        currency,
        description,
        finalCategory,
        selectedSupplierId || undefined,
        receiptImages.length > 0 ? receiptImages : undefined,
        paymentMethod,
        includesVat,
        editActivity?.id,
        editActivity?.type
      );
    } catch {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E9\u05DE\u05D9\u05E8\u05D4. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.');
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving, amount, isAddingCategory, newCategory, category, transactionType,
    selectedProjectId, currency, description, selectedSupplierId, receiptImages,
    paymentMethod, includesVat, editActivity, onSave,
  ]);

  const handlePickImage = useCallback(async () => {
    Alert.alert(
      '\u05EA\u05D9\u05E2\u05D5\u05D3',
      '\u05D1\u05D7\u05E8 \u05DE\u05E7\u05D5\u05E8',
      [
        {
          text: '\u05DE\u05E6\u05DC\u05DE\u05D4',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05D4 \u05DC\u05DE\u05E6\u05DC\u05DE\u05D4');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.7,
            });
            if (!result.canceled && result.assets.length > 0) {
              setReceiptImages((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        {
          text: '\u05D2\u05DC\u05E8\u05D9\u05D4',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05D4 \u05DC\u05D2\u05DC\u05E8\u05D9\u05D4');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              allowsMultipleSelection: true,
            });
            if (!result.canceled && result.assets.length > 0) {
              setReceiptImages((prev) => [
                ...prev,
                ...result.assets.map((a: ImagePicker.ImagePickerAsset) => a.uri),
              ]);
            }
          },
        },
        { text: '\u05D1\u05D9\u05D8\u05D5\u05DC', style: 'cancel' },
      ]
    );
  }, []);

  const removeImage = useCallback((index: number) => {
    setReceiptImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // ---- Render Picker Modals ----

  const renderProjectPicker = () => (
    <Modal visible={projectPickerVisible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setProjectPickerVisible(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{'\u05D1\u05D7\u05E8 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
            <TouchableOpacity onPress={() => setProjectPickerVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  item.id === selectedProjectId && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedProjectId(item.id);
                  setProjectPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    item.id === selectedProjectId && styles.pickerItemTextActive,
                  ]}
                >
                  {item.name}
                </Text>
                {item.id === selectedProjectId && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );

  const renderSupplierPicker = () => (
    <Modal visible={supplierPickerVisible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setSupplierPickerVisible(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isExp ? '\u05D1\u05D7\u05E8 \u05E1\u05E4\u05E7' : '\u05D1\u05D7\u05E8 \u05DE\u05E7\u05D5\u05E8'}
            </Text>
            <TouchableOpacity onPress={() => setSupplierPickerVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: '', name: isExp ? '\u05D1\u05D7\u05E8 \u05E1\u05E4\u05E7...' : '\u05D1\u05D7\u05E8 \u05DE\u05E7\u05D5\u05E8...' } as Supplier, ...suppliers]}
            keyExtractor={(item) => item.id || '__none__'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  item.id === selectedSupplierId && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedSupplierId(item.id);
                  setSupplierPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    item.id === selectedSupplierId && styles.pickerItemTextActive,
                    !item.id && styles.pickerItemPlaceholder,
                  ]}
                >
                  {item.name}
                </Text>
                {item.id === selectedSupplierId && item.id !== '' && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );

  // ---- Main Render ----

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.headerBtn, neuRaised]} onPress={goBack}>
          <MaterialIcons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editActivity
            ? '\u05E2\u05E8\u05D9\u05DB\u05EA \u05EA\u05E0\u05D5\u05E2\u05D4'
            : isExp
            ? '\u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05E9\u05D4'
            : '\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D3\u05E9\u05D4'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle */}
        <View style={[styles.typeToggleContainer, neuPressed]}>
          <TouchableOpacity
            style={[
              styles.typeToggleBtn,
              isExp && { backgroundColor: colors.error },
            ]}
            onPress={() => setTransactionType('expense')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.typeToggleText,
                isExp ? styles.typeToggleTextActive : styles.typeToggleTextInactive,
              ]}
            >
              {'\u05D4\u05D5\u05E6\u05D0\u05D4'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeToggleBtn,
              !isExp && { backgroundColor: colors.success },
            ]}
            onPress={() => setTransactionType('income')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.typeToggleText,
                !isExp ? styles.typeToggleTextActive : styles.typeToggleTextInactive,
              ]}
            >
              {'\u05D4\u05DB\u05E0\u05E1\u05D4'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input Card */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabel}>
            {isExp ? '\u05E1\u05DB\u05D5\u05DD \u05D4\u05D4\u05D5\u05E6\u05D0\u05D4' : '\u05E1\u05DB\u05D5\u05DD \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4'}
          </Text>

          {/* Currency Pills */}
          <View style={styles.currencyRow}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyPill,
                  currency === curr
                    ? { backgroundColor: typeColor }
                    : [styles.currencyPillInactive, neuPressed],
                ]}
                onPress={() => setCurrency(curr)}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    currency === curr
                      ? styles.currencyPillTextActive
                      : styles.currencyPillTextInactive,
                  ]}
                >
                  {CURRENCY_SYMBOLS[curr]} {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <View style={[styles.amountInputContainer, neuPressed]}>
            <Text style={[styles.amountSymbol, { color: typeColor }]}>
              {CURRENCY_SYMBOLS[currency]}
            </Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              textAlign="center"
            />
          </View>
        </View>

        {/* VAT Toggle */}
        <View style={[styles.vatCard, neuRaised]}>
          <Text style={styles.vatLabel}>{'\u05DB\u05D5\u05DC\u05DC \u05DE\u05E2"\u05DE'}</Text>
          <Switch
            value={includesVat}
            onValueChange={setIncludesVat}
            trackColor={{ false: colors.neuShadow, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Payment Method */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelLeft}>{'\u05E9\u05D9\u05D8\u05EA \u05EA\u05E9\u05DC\u05D5\u05DD'}</Text>
          <View style={styles.chipsRow}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.chip,
                  paymentMethod === method
                    ? styles.chipActive
                    : [styles.chipInactive, neuRaised],
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentMethod === method
                      ? styles.chipTextActive
                      : styles.chipTextInactive,
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Project Selector */}
        <View style={[styles.card, neuRaised]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelLeft}>{'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => onNavigate(AppScreen.ADD_PROJECT)}
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewText}>{'\u05D7\u05D3\u05E9'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.pickerButton, neuPressed]}
            onPress={() => setProjectPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedProject?.name || '\u05D1\u05D7\u05E8 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8...'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Supplier Selector */}
        <View style={[styles.card, neuRaised]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelLeft}>
              {isExp ? '\u05E1\u05E4\u05E7' : '\u05DE\u05E7\u05D5\u05E8'}
            </Text>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => onNavigate(AppScreen.ADD_SUPPLIER)}
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewText}>{'\u05D7\u05D3\u05E9'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.pickerButton, neuPressed]}
            onPress={() => setSupplierPickerVisible(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedSupplier && styles.pickerPlaceholder,
              ]}
            >
              {selectedSupplier?.name || (isExp ? '\u05D1\u05D7\u05E8 \u05E1\u05E4\u05E7...' : '\u05D1\u05D7\u05E8 \u05DE\u05E7\u05D5\u05E8...')}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelLeft}>{'\u05EA\u05D9\u05D0\u05D5\u05E8'}</Text>
          <TextInput
            style={[styles.textInput, neuPressed]}
            placeholder={isExp ? '\u05DC\u05DE\u05D4 \u05E9\u05D9\u05DE\u05E9 \u05D4\u05EA\u05E9\u05DC\u05D5\u05DD?' : '\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4...'}
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            textAlign="right"
          />
        </View>

        {/* Category */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelLeft}>{'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4'}</Text>
          {!isAddingCategory ? (
            <View style={styles.chipsRow}>
              {activeCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat
                      ? styles.chipActive
                      : [styles.chipInactive, neuRaised],
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat
                        ? styles.chipTextActive
                        : styles.chipTextInactive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.chipAdd]}
                onPress={() => setIsAddingCategory(true)}
              >
                <Text style={styles.chipAddText}>+ {'\u05D0\u05D7\u05E8'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newCategoryRow}>
              <TextInput
                style={[styles.textInput, neuPressed, { flex: 1 }]}
                placeholder={'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4...'}
                placeholderTextColor={colors.textTertiary}
                value={newCategory}
                onChangeText={setNewCategory}
                autoFocus
                textAlign="right"
              />
              <TouchableOpacity
                style={[styles.closeCategoryBtn, neuRaised]}
                onPress={() => setIsAddingCategory(false)}
              >
                <MaterialIcons name="close" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Receipt Images */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelLeft}>{'\u05EA\u05D9\u05E2\u05D5\u05D3'}</Text>
          <View style={styles.imagesGrid}>
            {receiptImages.map((img, index) => (
              <View key={index} style={[styles.imageThumb, neuPressed]}>
                <Image source={{ uri: img }} style={styles.imageThumbImg} />
                <TouchableOpacity
                  style={styles.imageRemoveBtn}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.imageAddBtn, { borderColor: typeColor + '4D' }]}
              onPress={handlePickImage}
            >
              <MaterialIcons name="add-a-photo" size={24} color={typeColor} />
              <Text style={[styles.imageAddText, { color: typeColor }]}>{'\u05E6\u05DC\u05DD'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button - Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            amount && !isSaving
              ? { backgroundColor: typeColor }
              : styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!amount || isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={[styles.saveBtnText, !amount && styles.saveBtnTextDisabled]}>
                {editActivity ? '\u05E2\u05D3\u05DB\u05DF' : '\u05E9\u05DE\u05D5\u05E8'}
              </Text>
              <MaterialIcons
                name="check-circle"
                size={22}
                color={amount ? colors.white : colors.textTertiary}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderProjectPicker()}
      {renderSupplierPicker()}
    </View>
  );
};

export default AddExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 44,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    gap: spacing['2xl'],
  },

  // Type Toggle
  typeToggleContainer: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: 6,
    gap: 4,
    backgroundColor: colors.neuBg,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  typeToggleTextActive: {
    color: colors.white,
  },
  typeToggleTextInactive: {
    color: colors.textTertiary,
  },

  // Cards
  card: {
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  cardLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  cardLabelLeft: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  // Currency
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  currencyPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  currencyPillInactive: {
    backgroundColor: colors.neuBg,
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyPillTextActive: {
    color: colors.white,
  },
  currencyPillTextInactive: {
    color: colors.textTertiary,
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  amountSymbol: {
    fontSize: 30,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    padding: 0,
  },

  // VAT
  vatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  vatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },

  // Chips (payment methods, categories)
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.neuBg,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  chipAdd: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary + '4D',
    backgroundColor: 'transparent',
  },
  chipAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Add New Button
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNewText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Picker Button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.neuBg,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  pickerPlaceholder: {
    color: colors.textTertiary,
  },

  // Text Input
  textInput: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.neuBg,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // New Category Row
  newCategoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  closeCategoryBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },

  // Receipt Images
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddBtn: {
    width: 100,
    height: 100,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageAddText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Footer / Save Button
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radii.lg,
  },
  saveBtnDisabled: {
    backgroundColor: colors.neuShadow,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    writingDirection: 'rtl',
  },
  saveBtnTextDisabled: {
    color: colors.textTertiary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neuBg,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neuShadow + '40',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neuShadow + '40',
  },
  pickerItemActive: {
    backgroundColor: colors.primary + '10',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  pickerItemTextActive: {
    color: colors.primary,
  },
  pickerItemPlaceholder: {
    color: colors.textTertiary,
  },
});
