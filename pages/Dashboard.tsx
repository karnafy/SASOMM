import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import * as Linking from 'expo-linking';
import { MaterialIcons } from '@expo/vector-icons';
import {
  AppScreen,
  Project,
  Currency,
  MainCategory,
  MAIN_CATEGORIES,
  Supplier,
} from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, neuPressed, radii, spacing } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface DashboardProps {
  onNavigate: (screen: AppScreen, id?: string, scan?: boolean, txType?: 'expense' | 'income') => void;
  goBack: () => void;
  projects: Project[];
  suppliers: Supplier[];
  totals: { income: number; expenses: number; net: number };
  globalCurrency: Currency;
  setGlobalCurrency: (c: Currency) => void;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
  onLogout: () => void;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const categoryIcons: Record<MainCategory, IconName> = {
  projects: 'work',
  personal: 'person',
  other: 'category',
};

const formatNumber = (n: number): string =>
  Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  goBack,
  projects,
  suppliers,
  totals,
  globalCurrency,
  setGlobalCurrency,
  convertAmount,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sym = currencySymbols[globalCurrency];

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  const allActivities = useMemo(() => {
    return projects
      .flatMap((p) => {
        const totalIncome = (p.incomes || []).reduce((sum, i) => sum + i.amount, 0);
        const remaining = p.budget + totalIncome - p.spent;
        return [
          ...p.expenses.map((e) => ({
            ...e,
            projectName: p.name,
            projectId: p.id,
            projectRemaining: remaining,
            type: 'expense' as const,
          })),
          ...(p.incomes || []).map((i) => ({
            ...i,
            projectName: p.name,
            projectId: p.id,
            projectRemaining: remaining,
            type: 'income' as const,
          })),
        ];
      })
      .sort((a, b) => {
        const parseDate = (item: any) => {
          const dStr = item.date;
          if (!dStr) return 0;
          const dotParts = dStr.split('.');
          if (dotParts.length === 3) {
            const [day, month, year] = dotParts.map(Number);
            return new Date(year, month - 1, day).getTime();
          }
          const isoDate = new Date(dStr);
          if (!isNaN(isoDate.getTime())) return isoDate.getTime();
          return 0;
        };
        return parseDate(b) - parseDate(a);
      })
      .slice(0, 8);
  }, [projects]);

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return null;
    return suppliers.find((s) => s.id === supplierId)?.name || null;
  };

  const recentProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.expenses.length > 0 || (p.incomes || []).length > 0)
      .sort((a, b) => {
        const aLastId =
          [...a.expenses, ...(a.incomes || [])].sort((x, y) =>
            y.id.localeCompare(x.id),
          )[0]?.id || '';
        const bLastId =
          [...b.expenses, ...(b.incomes || [])].sort((x, y) =>
            y.id.localeCompare(x.id),
          )[0]?.id || '';
        return bLastId.localeCompare(aLastId);
      })
      .slice(0, 5);
  }, [projects]);

  const categoryTotals = useMemo(() => {
    const categories: MainCategory[] = ['projects', 'personal', 'other'];
    return categories.map((cat) => {
      const catProjects = projects.filter((p) => p.mainCategory === cat);
      const totalBudget = catProjects.reduce((sum, p) => sum + p.budget, 0);
      const totalSpent = catProjects.reduce((sum, p) => sum + p.spent, 0);
      const totalIncome = catProjects.reduce(
        (sum, p) => sum + (p.incomes || []).reduce((s, i) => s + i.amount, 0),
        0,
      );
      const remaining = totalBudget + totalIncome - totalSpent;
      return {
        category: cat,
        name: MAIN_CATEGORIES[cat],
        budget: totalBudget,
        spent: totalSpent,
        income: totalIncome,
        remaining,
        projectCount: catProjects.length,
      };
    });
  }, [projects]);

  // ---------------------------------------------------------------------------
  // Menu items
  // ---------------------------------------------------------------------------

  const menuItems: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: '\u05D0\u05D9\u05D6\u05D5\u05E8 \u05D0\u05D9\u05E9\u05D9', icon: 'person', onPress: () => onNavigate(AppScreen.PERSONAL_AREA) },
    { label: '\u05DB\u05DC \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD', icon: 'folder-special', onPress: () => onNavigate(AppScreen.PROJECTS) },
    { label: '\u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8', icon: 'people', onPress: () => onNavigate(AppScreen.SUPPLIERS) },
    { label: '\u05DE\u05E8\u05DB\u05D6 \u05D4\u05D3\u05D5"\u05D7\u05D5\u05EA', icon: 'analytics', onPress: () => onNavigate(AppScreen.REPORTS_CENTER) },
    { label: '\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA', icon: 'settings', onPress: () => onNavigate(AppScreen.SETTINGS) },
  ];

  const quickAccessItems: { id: string; label: string; icon: IconName; screen: AppScreen }[] = [
    { id: 'proj', label: '\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05D7\u05D3\u05E9', icon: 'create-new-folder', screen: AppScreen.ADD_PROJECT },
    { id: 'supp', label: '\u05E1\u05E4\u05E7 \u05D7\u05D3\u05E9', icon: 'person-add', screen: AppScreen.ADD_SUPPLIER },
    { id: 'all', label: '\u05DB\u05DC \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD', icon: 'folder-open', screen: AppScreen.PROJECTS },
    { id: 'contacts', label: '\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8', icon: 'contacts', screen: AppScreen.SUPPLIERS },
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const sendReminder = () => {
    const debtSuppliers = suppliers.filter((s) => s.status === 'debt' && s.phone);
    if (debtSuppliers.length === 0) {
      Alert.alert('', '\u05D0\u05D9\u05DF \u05E1\u05E4\u05E7\u05D9\u05DD \u05E2\u05DD \u05D7\u05D5\u05D1\u05D5\u05EA \u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05EA\u05D6\u05DB\u05D5\u05E8\u05EA');
      return;
    }
    const message = encodeURIComponent(
      '\u05E9\u05DC\u05D5\u05DD, \u05D6\u05D5\u05D4\u05D9 \u05EA\u05D6\u05DB\u05D5\u05E8\u05EA \u05D9\u05D3\u05D9\u05D3\u05D5\u05EA\u05D9\u05EA \u05DC\u05D2\u05D1\u05D9 \u05D9\u05EA\u05E8\u05EA \u05D4\u05D7\u05D5\u05D1 \u05E9\u05DC\u05DA. \u05D0\u05E9\u05DE\u05D7 \u05DC\u05E1\u05D2\u05D5\u05E8 \u05D0\u05EA \u05D4\u05D7\u05E9\u05D1\u05D5\u05DF \u05D1\u05D4\u05E7\u05D3\u05DD. \u05EA\u05D5\u05D3\u05D4!',
    );
    const firstSupplier = debtSuppliers[0];
    const cleanPhone = firstSupplier.phone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
    Linking.openURL(`https://wa.me/972${phone}?text=${message}`);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>
      {/* ===== Menu Modal ===== */}
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <View style={styles.menuCardWrapper}>
            <View style={[styles.menuCard, neuRaisedLg]}>
              <Text style={styles.menuTitle}>{'\u05EA\u05E4\u05E8\u05D9\u05D8 \u05E0\u05D9\u05D4\u05D5\u05DC'}</Text>
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuRow}
                  onPress={() => {
                    setIsMenuOpen(false);
                    item.onPress();
                  }}
                >
                  <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                  <Text style={styles.menuRowLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
              >
                <MaterialIcons name="logout" size={20} color={colors.error} />
                <Text style={[styles.menuRowLabel, { color: colors.error }]}>
                  {'\u05D4\u05EA\u05E0\u05EA\u05E7\u05D5\u05EA'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ===== Header ===== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.hamburger, neuRaised]}
          onPress={() => setIsMenuOpen(true)}
        >
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <Text style={styles.headerLogo}>MONNY</Text>
      </View>

      {/* ===== Welcome ===== */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeGreeting}>{'\u05E9\u05DC\u05D5\u05DD,'}</Text>
        <Text style={styles.welcomeTitle}>{'\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD \u05DC-MONNY'}</Text>
      </View>

      {/* ===== Summary Card ===== */}
      <View style={[styles.summaryCard, neuRaised]}>
        <View style={styles.summaryHeader}>
          <Text style={styles.sectionLabel}>{'\u05E1\u05D9\u05DB\u05D5\u05DD \u05DB\u05DC\u05DC\u05D9'}</Text>
          <View style={styles.currencyRow}>
            {(['ILS', 'USD', 'EUR'] as Currency[]).map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[
                  styles.currencyBtn,
                  globalCurrency === cur ? styles.currencyBtnActive : [styles.currencyBtnInactive, neuPressed],
                ]}
                onPress={() => setGlobalCurrency(cur)}
              >
                <Text
                  style={[
                    styles.currencyBtnText,
                    globalCurrency === cur && styles.currencyBtnTextActive,
                  ]}
                >
                  {currencySymbols[cur]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceCenter}>
          <Text style={styles.balanceLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: totals.net >= 0 ? colors.success : colors.error },
            ]}
          >
            {sym}
            {formatNumber(totals.net)}
          </Text>
        </View>

        {/* Income / Expenses row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>{'\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA'}</Text>
            <Text style={[styles.summaryItemValue, { color: colors.success }]}>
              {sym}
              {formatNumber(totals.income)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>{'\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA'}</Text>
            <Text style={[styles.summaryItemValue, { color: colors.error }]}>
              {sym}
              {formatNumber(totals.expenses)}
            </Text>
          </View>
        </View>
      </View>

      {/* ===== Quick Action Buttons ===== */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={[styles.quickActionCard, neuRaised]}
          onPress={() => onNavigate(AppScreen.ADD_EXPENSE)}
          activeOpacity={0.85}
        >
          <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <MaterialIcons name="remove-circle" size={26} color={colors.error} />
          </View>
          <View style={styles.quickActionTextWrap}>
            <Text style={styles.quickActionSmall}>{'\u05D4\u05D5\u05E1\u05E4\u05EA'}</Text>
            <Text style={[styles.quickActionBig, { color: colors.error }]}>{'\u05D4\u05D5\u05E6\u05D0\u05D4'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, neuRaised]}
          onPress={() => onNavigate(AppScreen.ADD_INCOME)}
          activeOpacity={0.85}
        >
          <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <MaterialIcons name="add-circle" size={26} color={colors.success} />
          </View>
          <View style={styles.quickActionTextWrap}>
            <Text style={styles.quickActionSmall}>{'\u05D4\u05D5\u05E1\u05E4\u05EA'}</Text>
            <Text style={[styles.quickActionBig, { color: colors.success }]}>{'\u05D4\u05DB\u05E0\u05E1\u05D4'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ===== Categories ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D5\u05EA'}</Text>
      </View>

      {categoryTotals.map((cat) => {
        const hasData = cat.budget > 0 || cat.spent > 0 || cat.income > 0;
        const percentExpenses =
          cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
        const percentIncome =
          cat.budget > 0 ? Math.round((cat.income / cat.budget) * 100) : 0;
        const netPercent = percentIncome - percentExpenses;

        return (
          <TouchableOpacity
            key={cat.category}
            style={[styles.categoryCard, neuRaised]}
            onPress={() => onNavigate(AppScreen.CATEGORY_PROJECTS, cat.category)}
            activeOpacity={0.9}
          >
            {/* Category header */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIconWrap, neuPressed]}>
                  <MaterialIcons
                    name={categoryIcons[cat.category]}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>
                    {cat.projectCount} {'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD'}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-left" size={22} color={colors.textTertiary} />
            </View>

            {hasData ? (
              <>
                {/* Budget centered */}
                <View style={styles.categoryBudgetWrap}>
                  <Text style={styles.tinyLabel}>{'\u05EA\u05E7\u05E6\u05D9\u05D1'}</Text>
                  <Text style={styles.categoryBudgetValue}>
                    {sym}
                    {formatNumber(convertAmount(cat.budget))}
                  </Text>
                </View>

                {/* 3 column: expenses / income / balance */}
                <View style={styles.categoryStatsRow}>
                  <View style={styles.categoryStatItem}>
                    <Text style={styles.tinyLabel}>{'\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA'}</Text>
                    <Text style={[styles.categoryStatValue, { color: colors.error }]}>
                      {sym}
                      {formatNumber(convertAmount(cat.spent))}
                    </Text>
                  </View>
                  <View style={styles.categoryStatItem}>
                    <Text style={styles.tinyLabel}>{'\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA'}</Text>
                    <Text style={[styles.categoryStatValue, { color: colors.success }]}>
                      {sym}
                      {formatNumber(convertAmount(cat.income))}
                    </Text>
                  </View>
                  <View style={styles.categoryStatItem}>
                    <Text style={styles.tinyLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
                    <Text
                      style={[
                        styles.categoryStatValue,
                        { color: cat.remaining >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {cat.remaining < 0 ? '-' : ''}
                      {sym}
                      {formatNumber(convertAmount(Math.abs(cat.remaining)))}
                    </Text>
                  </View>
                </View>

                {/* Progress bars */}
                <View style={styles.progressSection}>
                  {/* Expenses bar */}
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: colors.error }]}>{'\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA'}</Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFillExpense,
                          { width: `${Math.min(100, percentExpenses)}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressPercent, { color: colors.error }]}>
                      {percentExpenses}%
                    </Text>
                  </View>
                  {/* Income bar */}
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: colors.success }]}>{'\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA'}</Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFillIncome,
                          { width: `${Math.min(100, percentIncome)}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressPercent, { color: colors.success }]}>
                      {percentIncome}%
                    </Text>
                  </View>
                </View>

                {/* Net percentage */}
                <Text
                  style={[
                    styles.netPercentText,
                    { color: netPercent >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {netPercent >= 0 ? '+' : ''}
                  {netPercent}% {'\u05E0\u05D8\u05D5'}
                </Text>
              </>
            ) : (
              <View style={styles.noDataWrap}>
                <Text style={styles.noDataText}>{'\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E2\u05D3\u05D9\u05D9\u05DF'}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* ===== Quick Access ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{'\u05D2\u05D9\u05E9\u05D4 \u05DE\u05D4\u05D9\u05E8\u05D4'}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickAccessScroll}
      >
        {quickAccessItems.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickAccessItem}
            onPress={() => onNavigate(action.screen)}
          >
            <View style={[styles.quickAccessIcon, neuRaised]}>
              <MaterialIcons name={action.icon} size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Send reminder */}
        <TouchableOpacity style={styles.quickAccessItem} onPress={sendReminder}>
          <View style={[styles.quickAccessIcon, neuRaised]}>
            <MaterialIcons name="notifications-active" size={24} color={colors.warning} />
          </View>
          <Text style={styles.quickAccessLabel}>{'\u05E9\u05DC\u05D7 \u05EA\u05D6\u05DB\u05D5\u05E8\u05EA'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===== Recent Projects ===== */}
      {recentProjects.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05D0\u05D7\u05E8\u05D5\u05E0\u05D9\u05DD'}</Text>
            <TouchableOpacity onPress={() => onNavigate(AppScreen.PROJECTS)}>
              <Text style={styles.showAllLink}>{'\u05D4\u05E6\u05D2 \u05D4\u05DB\u05DC'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentProjectsScroll}
          >
            {recentProjects.map((project) => {
              const projectIncome = (project.incomes || []).reduce(
                (sum, i) => sum + i.amount,
                0,
              );
              const remaining = project.budget + projectIncome - project.spent;
              const percentUsed =
                project.budget > 0
                  ? Math.round((project.spent / project.budget) * 100)
                  : 0;

              const badgeColor =
                percentUsed > 100
                  ? colors.error
                  : percentUsed > 90
                    ? colors.warning
                    : colors.success;
              const badgeBg =
                percentUsed > 100
                  ? 'rgba(239,68,68,0.1)'
                  : percentUsed > 90
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(16,185,129,0.1)';

              return (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, neuRaised]}
                  onPress={() =>
                    onNavigate(AppScreen.PROJECT_DETAIL, project.id)
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.projectCardTop}>
                    <View style={[styles.projectIconWrap, neuPressed]}>
                      <MaterialIcons
                        name={(project.icon as IconName) || 'folder'}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={[styles.projectBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.projectBadgeText, { color: badgeColor }]}>
                        {percentUsed}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.projectCategory}>{project.category}</Text>

                  <View style={styles.projectBottomDivider}>
                    <Text style={styles.tinyLabel}>{'\u05D9\u05EA\u05E8\u05D4'}</Text>
                    <Text
                      style={[
                        styles.projectRemainingValue,
                        { color: remaining >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {remaining < 0 ? '-' : ''}
                      {sym}
                      {formatNumber(convertAmount(Math.abs(remaining)))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ===== Recent Activity ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{'\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D4'}</Text>
      </View>

      {allActivities.length === 0 ? (
        <View style={[styles.emptyActivity, neuPressed]}>
          <MaterialIcons name="history" size={36} color={colors.textTertiary} />
          <Text style={styles.emptyActivityText}>{'\u05D0\u05D9\u05DF \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05E2\u05D3\u05D9\u05D9\u05DF'}</Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {allActivities.slice(0, 5).map((act: any) => {
            const supplierName = getSupplierName(act.supplierId);
            const isIncome = act.type === 'income';
            return (
              <TouchableOpacity
                key={act.id}
                style={[styles.activityRow, neuRaised]}
                onPress={() => onNavigate(AppScreen.ACTIVITY_DETAIL, act.id)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: isIncome ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
                  ]}
                >
                  <MaterialIcons
                    name={isIncome ? 'arrow-downward' : 'arrow-upward'}
                    size={20}
                    color={isIncome ? colors.success : colors.error}
                  />
                </View>

                <View style={styles.activityMid}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {act.title}
                  </Text>
                  <Text style={styles.activitySub} numberOfLines={1}>
                    {act.projectName}
                    {supplierName ? ` \u2022 ${supplierName}` : ''}
                  </Text>
                </View>

                <View style={styles.activityRight}>
                  <Text
                    style={[
                      styles.activityAmount,
                      { color: isIncome ? colors.success : colors.error },
                    ]}
                  >
                    {isIncome ? '+' : '-'}
                    {sym}
                    {formatNumber(convertAmount(act.amount))}
                  </Text>
                  <Text style={styles.activityDate}>{act.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Bottom spacing for BottomNav */}
      <View style={{ height: 32 }} />
    </View>
  );
};

export default Dashboard;

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
  },

  /* ---- Menu Modal ---- */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  menuCardWrapper: {
    marginTop: 100,
  },
  menuCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  menuTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  menuRowLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(200,208,224,0.3)',
    marginVertical: spacing.md,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  headerLogo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
  },
  hamburger: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.textSecondary,
    borderRadius: 1,
  },

  /* ---- Welcome ---- */
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  /* ---- Summary Card ---- */
  summaryCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  currencyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.lg,
  },
  currencyBtnActive: {
    backgroundColor: colors.primary,
  },
  currencyBtnInactive: {
    backgroundColor: colors.neuBg,
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textTertiary,
  },
  currencyBtnTextActive: {
    color: colors.white,
  },
  balanceCenter: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing['3xl'],
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,208,224,0.3)',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    writingDirection: 'rtl',
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* ---- Quick Action Buttons ---- */
  quickActionRow: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.lg,
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTextWrap: {
    alignItems: 'flex-end',
  },
  quickActionSmall: {
    fontSize: 11,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  quickActionBig: {
    fontSize: 15,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },

  /* ---- Section Headers ---- */
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  showAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    writingDirection: 'rtl',
  },

  /* ---- Categories ---- */
  categoryCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  categoryLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontSize: 14,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  categoryBudgetWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryBudgetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  categoryStatsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,208,224,0.2)',
    marginBottom: spacing.lg,
  },
  categoryStatItem: {
    alignItems: 'center',
  },
  categoryStatValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  tinyLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* Progress bars */
  progressSection: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressLabel: {
    fontSize: 9,
    width: 42,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(200,208,224,0.3)',
    overflow: 'hidden',
  },
  progressFillExpense: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  progressFillIncome: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 36,
    textAlign: 'left',
  },
  netPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.sm,
    writingDirection: 'rtl',
  },

  noDataWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  /* ---- Quick Access ---- */
  quickAccessScroll: {
    paddingBottom: spacing.sm,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickAccessItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* ---- Recent Projects ---- */
  recentProjectsScroll: {
    paddingBottom: spacing.sm,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  projectCard: {
    width: 180,
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing.lg,
  },
  projectCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  projectIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  projectBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectName: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  projectCategory: {
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  projectBottomDivider: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,208,224,0.3)',
  },
  projectRemainingValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ---- Recent Activity ---- */
  emptyActivity: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing['3xl'],
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyActivityText: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    writingDirection: 'rtl',
  },
  activityList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activityRow: {
    backgroundColor: colors.neuBg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.lg,
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMid: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  activitySub: {
    fontSize: 10,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  activityRight: {
    alignItems: 'flex-start',
  },
  activityAmount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityDate: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
