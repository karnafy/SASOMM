import React, { useState, useCallback } from 'react';
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
import { AppScreen, MainCategory, MAIN_CATEGORIES, Project, Currency } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, neuPressed, radii, spacing } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface AddProjectProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  onSave: (name: string, budget: number, category: string, mainCategory?: MainCategory) => Promise<void>;
  project?: Project;
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const CURRENCIES: { val: Currency; symbol: string }[] = [
  { val: 'ILS', symbol: '\u20AA' },
  { val: 'USD', symbol: '$' },
  { val: 'EUR', symbol: '\u20AC' },
];

const CONVERSION_RATES: Record<Currency, number> = {
  ILS: 1,
  USD: 1 / 3.75,
  EUR: 1 / 4.05,
};

const SUB_CATEGORIES = [
  '\u05E9\u05D9\u05E4\u05D5\u05E5',
  '\u05DE\u05E9\u05E4\u05D7\u05D4',
  '\u05D5\u05E2\u05D3 \u05D1\u05D9\u05EA',
  '\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD',
  '\u05EA\u05D7\u05D6\u05D5\u05E7\u05D4',
  '\u05DB\u05DC\u05DC\u05D9',
];

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
  globalCurrency,
  convertAmount,
}) => {
  const [name, setName] = useState(project?.name || '');
  const [budget, setBudget] = useState(
    project ? convertAmount(project.budget).toFixed(0) : ''
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(globalCurrency);
  const [category, setCategory] = useState(project?.category || '\u05DB\u05DC\u05DC\u05D9');
  const [mainCategory, setMainCategory] = useState<MainCategory>(
    project?.mainCategory || 'projects'
  );
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    (project?.icon as IconName) || 'folder'
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);

  const currentSymbol =
    CURRENCIES.find((c) => c.val === selectedCurrency)?.symbol || '\u20AA';

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
        name || '\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05D7\u05D3\u05E9',
        valueForApp,
        finalCategory || '\u05DB\u05DC\u05DC\u05D9',
        mainCategory
      );
    } catch {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E9\u05DE\u05D9\u05E8\u05D4. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isAddingCategory, newCategory, category, budget, selectedCurrency, globalCurrency, name, mainCategory, onSave]);

  const visibleIcons = showAllIcons ? ICON_OPTIONS : ICON_OPTIONS.slice(0, 12);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.headerBtn, neuRaised]} onPress={goBack}>
          <MaterialIcons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {project ? '\u05E2\u05E8\u05D9\u05DB\u05EA \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8' : '\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05D7\u05D3\u05E9'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Input Card */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelCenter}>
            {'\u05EA\u05E7\u05E6\u05D9\u05D1 \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}
          </Text>

          {/* Previous budget (edit mode) */}
          {project && (
            <View style={styles.previousBudgetRow}>
              <Text style={styles.previousBudgetLabel}>
                {'\u05EA\u05E7\u05E6\u05D9\u05D1 \u05E7\u05D5\u05D3\u05DD: '}
              </Text>
              <Text style={styles.previousBudgetValue}>
                {CURRENCIES.find((c) => c.val === globalCurrency)?.symbol}
                {convertAmount(project.budget).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Currency Pills */}
          <View style={styles.currencyRow}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr.val}
                style={[
                  styles.currencyPill,
                  selectedCurrency === curr.val
                    ? styles.currencyPillActive
                    : [styles.currencyPillInactive, neuPressed],
                ]}
                onPress={() => setSelectedCurrency(curr.val)}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    selectedCurrency === curr.val
                      ? styles.currencyPillTextActive
                      : styles.currencyPillTextInactive,
                  ]}
                >
                  {curr.symbol} {curr.val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <View style={[styles.amountInputContainer, neuPressed]}>
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
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelRight}>
            {'\u05E9\u05DD \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}
          </Text>
          <TextInput
            style={[styles.textInput, neuPressed]}
            placeholder={'\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05E9\u05D9\u05E4\u05D5\u05E5 \u05D3\u05D9\u05E8\u05D4 \u05EA\u05DC \u05D0\u05D1\u05D9\u05D1'}
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />
        </View>

        {/* Main Category */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelRight}>
            {'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4 \u05E8\u05D0\u05E9\u05D9\u05EA'}
          </Text>
          <View style={styles.mainCategoryGrid}>
            {(Object.keys(MAIN_CATEGORIES) as MainCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.mainCategoryBtn,
                  mainCategory === cat
                    ? styles.mainCategoryBtnActive
                    : [styles.mainCategoryBtnInactive, neuRaised],
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
                  {MAIN_CATEGORIES[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sub Category */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelRight}>
            {'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05EA \u05DE\u05E9\u05E0\u05D4'}
          </Text>
          {!isAddingCategory ? (
            <View style={styles.chipsRow}>
              {SUB_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat
                      ? styles.chipActiveAccent
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
                style={[styles.chip, styles.chipAddAccent]}
                onPress={() => setIsAddingCategory(true)}
              >
                <Text style={styles.chipAddAccentText}>+ {'\u05D0\u05D7\u05E8'}</Text>
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

        {/* Icon Selector */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardLabelRight}>
            {'\u05D0\u05D9\u05E7\u05D5\u05DF'}
          </Text>
          <View style={styles.iconGrid}>
            {visibleIcons.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconBtn,
                  selectedIcon === iconName
                    ? styles.iconBtnActive
                    : [styles.iconBtnInactive, neuRaised],
                ]}
                onPress={() => setSelectedIcon(iconName)}
              >
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={selectedIcon === iconName ? colors.white : colors.textSecondary}
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
                {'\u05D4\u05E6\u05D2 \u05E2\u05D5\u05D3'} ({ICON_OPTIONS.length - 12})
              </Text>
              <MaterialIcons name="expand-more" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {showAllIcons && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAllIcons(false)}
            >
              <Text style={styles.showMoreText}>{'\u05D4\u05E1\u05EA\u05E8'}</Text>
              <MaterialIcons name="expand-less" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Save Button - Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>
                {project ? '\u05E9\u05DE\u05D5\u05E8 \u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD' : '\u05E6\u05D5\u05E8 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}
              </Text>
              <MaterialIcons name="rocket-launch" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddProject;

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

  // Cards
  card: {
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    backgroundColor: colors.neuBg,
  },
  cardLabelCenter: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  cardLabelRight: {
    fontSize: 10,
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
    fontWeight: '700',
    color: colors.primary,
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
  currencyPillActive: {
    backgroundColor: colors.primary,
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
    color: colors.primary,
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

  // Main Category
  mainCategoryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mainCategoryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  mainCategoryBtnActive: {
    backgroundColor: colors.primary,
  },
  mainCategoryBtnInactive: {
    backgroundColor: colors.neuBg,
  },
  mainCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  mainCategoryTextActive: {
    color: colors.white,
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
  chipAddAccent: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent + '4D',
    backgroundColor: 'transparent',
  },
  chipAddAccentText: {
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: colors.neuBg,
  },

  // Icon Grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.primary,
  },
  iconBtnInactive: {
    backgroundColor: colors.neuBg,
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
    fontWeight: '600',
    color: colors.primary,
    writingDirection: 'rtl',
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
    backgroundColor: colors.primary,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    writingDirection: 'rtl',
  },
});
