import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppScreen, MainCategory, MAIN_CATEGORIES, Project, Currency } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { GradientButton } from '../components/ui/GradientButton';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface AddProjectProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  onSave: (name: string, budget: number, category: string, mainCategory?: MainCategory) => Promise<void>;
  project?: Project;
  projects?: Project[];
  preselectedMainCategory?: MainCategory;
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const CURRENCIES: { val: Currency; symbol: string }[] = [
  { val: 'ILS', symbol: '\₪' },
  { val: 'USD', symbol: '$' },
  { val: 'EUR', symbol: '\€' },
];

const CONVERSION_RATES: Record<Currency, number> = {
  ILS: 1,
  USD: 1 / 3.75,
  EUR: 1 / 4.05,
};

// Default sub-categories — kept in Hebrew so existing user data (project.category)
// keeps matching. UI translates each label at render time via SUB_CATEGORY_KEYS.
const SUB_CATEGORIES = [
  'שיפוץ',
  'משפחה',
  'ועד בית',
  'עובדים',
  'תחזוקה',
  'כללי',
];

const SUB_CATEGORY_KEYS: Record<string, string> = {
  'שיפוץ': 'add_project.subcategories.renovation',
  'משפחה': 'add_project.subcategories.family',
  'ועד בית': 'add_project.subcategories.hoa',
  'עובדים': 'add_project.subcategories.workers',
  'תחזוקה': 'add_project.subcategories.maintenance',
  'כללי': 'add_project.subcategories.general',
};

const ICON_OPTIONS: IconName[] = [
  'home',
  'apartment',
  'business',
  'store',
  'construction',
  'handyman',
  'build',
  'engineering',
  'architecture',
  'design-services',
  'brush',
  'palette',
  'school',
  'local-hospital',
  'restaurant',
  'directions-car',
  'flight',
  'fitness-center',
  'child-care',
  'pets',
  'shopping-cart',
  'local-shipping',
  'computer',
  'phone-android',
  'camera-alt',
  'music-note',
  'sports-esports',
  'work',
  'account-balance',
  'savings',
  'attach-money',
  'trending-up',
  'star',
  'favorite',
  'eco',
  'wb-sunny',
];

const AddProject: React.FC<AddProjectProps> = ({
  onNavigate,
  goBack,
  onSave,
  project,
  projects,
  preselectedMainCategory,
  globalCurrency,
  convertAmount,
}) => {
  const { t } = useTranslation();
  const availableCategories = useMemo(() => {
    const existing = new Set<string>();
    (projects || []).forEach((p) => {
      if (p.category) existing.add(p.category);
    });
    return Array.from(new Set([...SUB_CATEGORIES, ...Array.from(existing)]));
  }, [projects]);
  const [name, setName] = useState(project?.name || '');
  const [budget, setBudget] = useState(
    project ? convertAmount(project.budget).toFixed(0) : ''
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(globalCurrency);
  const [category, setCategory] = useState(project?.category || 'כללי');
  const [mainCategory, setMainCategory] = useState<MainCategory>(
    project?.mainCategory || preselectedMainCategory || 'projects'
  );
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    (project?.icon as IconName) || 'folder'
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);

  const currentSymbol =
    CURRENCIES.find((c) => c.val === selectedCurrency)?.symbol || '\₪';

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const finalCategory = isAddingCategory ? newCategory : category;
    const budgetValue = parseFloat(budget) || 0;

    // Convert from selected currency to the currency used by the app (globalCurrency)
    const budgetInILS = budgetValue / CONVERSION_RATES[selectedCurrency];
    const valueForApp = budgetInILS * CONVERSION_RATES[globalCurrency];

    setIsSaving(true);
    try {
      await onSave(
        name || t('add_project.default_name'),
        valueForApp,
        finalCategory || t('add_project.default_category'),
        mainCategory
      );
    } catch {
      Alert.alert(t('common.error'), t('add_project.err_save'));
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isAddingCategory, newCategory, category, budget, selectedCurrency, globalCurrency, name, mainCategory, onSave, t]);

  const visibleIcons = showAllIcons ? ICON_OPTIONS : ICON_OPTIONS.slice(0, 12);

  return (
    <View style={styles.container}>
      <ScreenTopBar
        title={project ? t('add_project.title_edit') : t('add_project.title_new')}
        onBack={goBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabelCenter}>
            {t('add_project.budget_section')}
          </Text>

          {/* Previous budget (edit mode) */}
          {project && (
            <View style={styles.previousBudgetRow}>
              <Text style={styles.previousBudgetLabel}>
                {t('add_project.budget_previous')}
              </Text>
              <Text style={styles.previousBudgetValue}>
                {CURRENCIES.find((c) => c.val === globalCurrency)?.symbol}
                {convertAmount(project.budget).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Currency chips — same style as CurrencyToggle */}
          <View style={styles.currencyRow}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr.val}
                style={[
                  styles.currencyChip,
                  selectedCurrency === curr.val
                    ? styles.currencyChipActive
                    : styles.currencyChipInactive,
                ]}
                onPress={() => setSelectedCurrency(curr.val)}
              >
                <Text
                  style={[
                    styles.currencyChipText,
                    selectedCurrency === curr.val
                      ? styles.currencyChipTextActive
                      : styles.currencyChipTextInactive,
                  ]}
                >
                  {curr.symbol} {curr.val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Large centered amount */}
          <View style={styles.amountInputContainer}>
            <Text style={styles.amountSymbol}>{currentSymbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              textAlign="center"
            />
          </View>
        </View>

        {/* Project Name */}
        <View style={styles.card}>
          <Text style={styles.cardLabelRight}>
            {t('add_project.name_label')}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('add_project.name_placeholder')}
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />
        </View>

        {/* Main Category — 3-option selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabelRight}>
            {t('add_project.main_category')}
          </Text>
          <View style={styles.mainCategoryGrid}>
            {(Object.keys(MAIN_CATEGORIES) as MainCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.mainCategoryBtn,
                  mainCategory === cat
                    ? styles.mainCategoryBtnActive
                    : styles.mainCategoryBtnInactive,
                ]}
                onPress={() => setMainCategory(cat)}
              >
                <Text
                  style={[
                    styles.mainCategoryText,
                    mainCategory === cat
                      ? styles.mainCategoryTextActive
                      : styles.mainCategoryTextInactive,
                  ]}
                >
                  {t(`main_categories.${cat}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sub Category */}
        <View style={styles.card}>
          <Text style={styles.cardLabelRight}>
            {t('add_project.subcategory')}
          </Text>
          {!isAddingCategory ? (
            <View style={styles.chipsRow}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat
                      ? styles.chipActiveAccent
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
                    {SUB_CATEGORY_KEYS[cat] ? t(SUB_CATEGORY_KEYS[cat]) : cat}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.chipAddAccent]}
                onPress={() => setIsAddingCategory(true)}
              >
                <Text style={styles.chipAddAccentText}>+ {t('add_project.other')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newCategoryRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder={t('add_project.new_category_placeholder')}
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

        {/* Icon Selector — grid in bgTertiary circles, selected gets primary border */}
        <View style={styles.card}>
          <Text style={styles.cardLabelRight}>
            {t('add_project.icon')}
          </Text>
          <View style={styles.iconGrid}>
            {visibleIcons.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconBtn,
                  selectedIcon === iconName
                    ? styles.iconBtnActive
                    : styles.iconBtnInactive,
                ]}
                onPress={() => setSelectedIcon(iconName)}
              >
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={selectedIcon === iconName ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
          {!showAllIcons && ICON_OPTIONS.length > 12 && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAllIcons(true)}
            >
              <Text style={styles.showMoreText}>
                {t('add_project.show_more')} ({ICON_OPTIONS.length - 12})
              </Text>
              <MaterialIcons name="expand-more" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {showAllIcons && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAllIcons(false)}
            >
              <Text style={styles.showMoreText}>{t('add_project.hide')}</Text>
              <MaterialIcons name="expand-less" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Save Button - Fixed Footer */}
      <View style={styles.footer}>
        <GradientButton
          label={
            isSaving
              ? t('add_project.saving')
              : project
              ? t('add_project.save_changes')
              : t('add_project.create_project')
          }
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

export default AddProject;

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

  // Cards
  card: {
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  cardLabelCenter: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  cardLabelRight: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // Previous budget
  previousBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previousBudgetLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  previousBudgetValue: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
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
  currencyChipActive: {
    backgroundColor: colors.primary,
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
    color: colors.bgPrimary,
  },
  currencyChipTextInactive: {
    color: colors.textTertiary,
  },

  // Large centered amount
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
    color: colors.primary,
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

  // Main Category — 3-option segmented
  mainCategoryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mainCategoryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  mainCategoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mainCategoryBtnInactive: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.subtleBorder,
  },
  mainCategoryText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  mainCategoryTextActive: {
    color: colors.bgPrimary,
  },
  mainCategoryTextInactive: {
    color: colors.textSecondary,
  },

  // Chips (sub-categories)
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
  chipActiveAccent: {
    backgroundColor: colors.accent,
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
    color: colors.white,
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  chipAddAccent: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent + '4D',
    backgroundColor: 'transparent',
  },
  chipAddAccentText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.accent,
    writingDirection: 'rtl',
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

  // Icon Grid — circles in bgTertiary, selected gets primary border
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconBtnActive: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.primary,
  },
  iconBtnInactive: {
    backgroundColor: colors.bgTertiary,
    borderColor: 'transparent',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  showMoreText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.primary,
    writingDirection: 'rtl',
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
});
