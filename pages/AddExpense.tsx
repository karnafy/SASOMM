import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Project, Supplier, Currency, Expense, Income } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { GradientButton } from '../components/ui/GradientButton';

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
  preselectedProjectId?: string | null;
  editActivity?: (Expense | Income) & { projectId?: string };
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
  formDraft?: ExpenseFormDraft | null;
  onSaveDraft?: (draft: ExpenseFormDraft | null) => void;
}

export interface ExpenseFormDraft {
  transactionType: 'expense' | 'income';
  amount: string;
  currency: Currency;
  description: string;
  selectedProjectId: string;
  selectedSupplierId: string;
  category: string;
  paymentMethod: string;
  includesVat: boolean;
  receiptImages: string[];
  isAddingCategory: boolean;
  newCategory: string;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '\₪', USD: '$', EUR: '\€' };
const CURRENCIES: Currency[] = ['ILS', 'USD', 'EUR'];

const EXPENSE_CATEGORIES = ['אוכל', 'דלק', 'חינוך', 'שיפוץ', 'חומרים', 'שכר', 'ועד', 'כללי'];
const INCOME_CATEGORIES = ['לקוח', 'החזר מס', 'בונוס', 'מכירה', 'דיבידנד', 'כללי'];
const PAYMENT_METHODS = ['מזומן', 'אשראי', 'העברה', "צ'ק", 'ביט', 'פייבוקס'];

const AddExpense: React.FC<AddExpenseProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  onSave,
  autoCapture,
  initialType = 'expense',
  preselectedSupplierId,
  preselectedProjectId,
  editActivity,
  globalCurrency,
  convertAmount,
  formDraft,
  onSaveDraft,
}) => {
  const draft = formDraft || null;
  const restoringDraft = useRef(!!draft);

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(
    editActivity?.type || draft?.transactionType || initialType
  );
  const [amount, setAmount] = useState(
    editActivity ? editActivity.amount.toString() : draft?.amount ?? ''
  );
  const [currency, setCurrency] = useState<Currency>(
    editActivity?.currency || draft?.currency || 'ILS'
  );
  const [description, setDescription] = useState(editActivity?.title || (draft?.description ?? ''));
  const [selectedProjectId, setSelectedProjectId] = useState(
    editActivity?.projectId || draft?.selectedProjectId || preselectedProjectId || projects[0]?.id || ''
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    editActivity?.supplierId || draft?.selectedSupplierId || preselectedSupplierId || ''
  );
  const [category, setCategory] = useState(editActivity?.tag || draft?.category || 'כללי');
  const [isAddingCategory, setIsAddingCategory] = useState(draft?.isAddingCategory ?? false);
  const [newCategory, setNewCategory] = useState(draft?.newCategory ?? '');
  const [receiptImages, setReceiptImages] = useState<string[]>(
    editActivity?.receiptImages || draft?.receiptImages || []
  );
  const [paymentMethod, setPaymentMethod] = useState(
    editActivity?.paymentMethod || draft?.paymentMethod || 'מזומן'
  );
  const [includesVat, setIncludesVat] = useState(
    editActivity?.includesVat !== undefined ? editActivity.includesVat : draft?.includesVat ?? true
  );
  const [isSaving, setIsSaving] = useState(false);

  // Clear draft after restoring
  useEffect(() => {
    if (formDraft) {
      onSaveDraft?.(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Modal states
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const isExp = transactionType === 'expense';
  const activeCategories = isExp ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const typeColor = isExp ? colors.error : colors.success;

  useEffect(() => {
    if (!editActivity && !restoringDraft.current) {
      setTransactionType(initialType);
    }
    restoringDraft.current = false;
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
      Alert.alert('שגיאה', 'אנא הזן סכום תקין');
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
      Alert.alert('שגיאה', 'שגיאה בשמירה. נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving, amount, isAddingCategory, newCategory, category, transactionType,
    selectedProjectId, currency, description, selectedSupplierId, receiptImages,
    paymentMethod, includesVat, editActivity, onSave,
  ]);

  const handlePickFromCamera = useCallback(async () => {
    setImagePickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('שגיאה', 'נדרשת הרשאה למצלמה');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets.length > 0) {
        setReceiptImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    setImagePickerVisible(false);
    try {
      // On web, skip permission request (not needed and can cause issues)
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('שגיאה', 'נדרשת הרשאה לגלריה');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: Platform.OS !== 'web',
      });
      if (!result.canceled && result.assets.length > 0) {
        setReceiptImages((prev) => [
          ...prev,
          ...result.assets.map((a: ImagePicker.ImagePickerAsset) => a.uri),
        ]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  }, []);

  const handlePickImage = useCallback(() => {
    if (Platform.OS === 'web') {
      // On web, skip the alert and go straight to file picker
      handlePickFromGallery();
    } else {
      setImagePickerVisible(true);
    }
  }, [handlePickFromGallery]);

  const navigateWithDraft = useCallback((screen: AppScreen) => {
    onSaveDraft?.({
      transactionType, amount, currency, description,
      selectedProjectId, selectedSupplierId, category,
      paymentMethod, includesVat, receiptImages,
      isAddingCategory, newCategory,
    });
    onNavigate(screen);
  }, [
    transactionType, amount, currency, description,
    selectedProjectId, selectedSupplierId, category,
    paymentMethod, includesVat, receiptImages,
    isAddingCategory, newCategory, onNavigate, onSaveDraft,
  ]);

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
            <Text style={styles.modalTitle}>{'בחר פרויקט'}</Text>
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
              {isExp ? 'בחר ספק' : 'בחר מקור'}
            </Text>
            <TouchableOpacity onPress={() => setSupplierPickerVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: '', name: isExp ? 'בחר ספק...' : 'בחר מקור...' } as Supplier, ...suppliers]}
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
      <ScreenTopBar
        title={
          editActivity
            ? 'עריכת תנועה'
            : isExp
            ? 'הוצאה חדשה'
            : 'הכנסה חדשה'
        }
        onBack={goBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle — segmented control */}
        <View style={styles.typeToggleContainer}>
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
              {'הוצאה'}
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
              {'הכנסה'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {isExp ? 'סכום ההוצאה' : 'סכום ההכנסה'}
          </Text>

          {/* Currency chips */}
          <View style={styles.currencyRow}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyChip,
                  currency === curr
                    ? { backgroundColor: typeColor }
                    : styles.currencyChipInactive,
                ]}
                onPress={() => setCurrency(curr)}
              >
                <Text
                  style={[
                    styles.currencyChipText,
                    currency === curr ? styles.currencyChipTextActive : styles.currencyChipTextInactive,
                  ]}
                >
                  {CURRENCY_SYMBOLS[curr]} {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Large centered amount */}
          <View style={styles.amountInputContainer}>
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
        <View style={styles.vatCard}>
          <Text style={styles.vatLabel}>{'כולל מע"מ'}</Text>
          <ToggleSwitch value={includesVat} onToggle={() => setIncludesVat((v) => !v)} />
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardLabelLeft}>{'שיטת תשלום'}</Text>
          <View style={styles.chipsRow}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.chip,
                  paymentMethod === method
                    ? styles.chipActive
                    : styles.chipInactive,
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
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelLeft}>{'פרויקט'}</Text>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => navigateWithDraft(AppScreen.ADD_PROJECT)}
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewText}>{'חדש'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setProjectPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedProject?.name || 'בחר פרויקט...'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Supplier Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelLeft}>
              {isExp ? 'ספק' : 'מקור'}
            </Text>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => navigateWithDraft(AppScreen.ADD_SUPPLIER)}
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={styles.addNewText}>{'חדש'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setSupplierPickerVisible(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedSupplier && styles.pickerPlaceholder,
              ]}
            >
              {selectedSupplier?.name || (isExp ? 'בחר ספק...' : 'בחר מקור...')}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardLabelLeft}>{'תיאור'}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={isExp ? 'למה שימש התשלום?' : 'פירוט ההכנסה...'}
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            textAlign="right"
          />
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.cardLabelLeft}>{'קטגוריה'}</Text>
          {!isAddingCategory ? (
            <View style={styles.chipsRow}>
              {activeCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat
                      ? styles.chipActive
                      : styles.chipInactive,
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
                <Text style={styles.chipAddText}>+ {'אחר'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newCategoryRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder={'קטגוריה חדשה...'}
                placeholderTextColor={colors.textTertiary}
                value={newCategory}
                onChangeText={setNewCategory}
                autoFocus
                textAlign="right"
              />
              <TouchableOpacity
                style={styles.closeCategoryBtn}
                onPress={() => setIsAddingCategory(false)}
              >
                <MaterialIcons name="close" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Receipt Images */}
        <View style={styles.card}>
          <Text style={styles.cardLabelLeft}>{'תיעוד'}</Text>
          <View style={styles.imagesGrid}>
            {receiptImages.map((img, index) => (
              <View key={index} style={styles.imageThumb}>
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
              <Text style={[styles.imageAddText, { color: typeColor }]}>{'צלם'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button - Fixed Footer */}
      <View style={styles.footer}>
        <GradientButton
          label={
            isSaving
              ? 'שומר...'
              : editActivity
              ? 'עדכן'
              : 'שמור'
          }
          onPress={handleSave}
          disabled={!amount || isSaving}
          style={styles.saveButton}
        />
      </View>

      {/* Modals */}
      {renderProjectPicker()}
      {renderSupplierPicker()}

      {/* Image Source Picker Modal (native only, web uses file picker directly) */}
      <Modal visible={imagePickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setImagePickerVisible(false)}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.imagePickerTitle}>{'תיעוד - בחר מקור'}</Text>
            <TouchableOpacity style={styles.imagePickerOption} onPress={handlePickFromCamera}>
              <MaterialIcons name="camera-alt" size={22} color={colors.primary} />
              <Text style={styles.imagePickerOptionText}>{'מצלמה'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerOption} onPress={handlePickFromGallery}>
              <MaterialIcons name="photo-library" size={22} color={colors.primary} />
              <Text style={styles.imagePickerOptionText}>{'גלריה'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerCancel} onPress={() => setImagePickerVisible(false)}>
              <Text style={styles.imagePickerCancelText}>{'ביטול'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default AddExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
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
    padding: 4,
    gap: 4,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  typeToggleText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
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
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  cardLabelLeft: {
    fontSize: 12,
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

  // Currency chips
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  currencyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  currencyChipInactive: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  currencyChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  currencyChipTextActive: {
    color: colors.white,
  },
  currencyChipTextInactive: {
    color: colors.textTertiary,
  },

  // Amount Input — large centered
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  amountSymbol: {
    fontSize: 30,
    fontFamily: fonts.bold,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 44,
    fontFamily: fonts.bold,
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
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  vatLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
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
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  chipTextActive: {
    color: colors.bgPrimary,
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
    fontFamily: fonts.semibold,
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
    fontFamily: fonts.semibold,
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Picker Button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  pickerButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  pickerPlaceholder: {
    color: colors.textTertiary,
  },

  // Text Input
  textInput: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
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
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
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
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
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
    backgroundColor: colors.bgTertiary,
  },
  imageAddText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },

  // Footer / Save Button
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  saveButton: {
    width: '100%',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    borderTopWidth: 1,
    borderColor: colors.subtleBorder,
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
    borderBottomColor: colors.subtleBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
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
    borderBottomColor: colors.subtleBorder,
  },
  pickerItemActive: {
    backgroundColor: colors.primary + '10',
  },
  pickerItemText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  pickerItemTextActive: {
    color: colors.primary,
  },
  pickerItemPlaceholder: {
    color: colors.textTertiary,
  },

  // Image Source Picker Modal
  imagePickerModal: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    borderTopWidth: 1,
    borderColor: colors.subtleBorder,
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  imagePickerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
  },
  imagePickerOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  imagePickerOptionText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  imagePickerCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  imagePickerCancelText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
  },
});
