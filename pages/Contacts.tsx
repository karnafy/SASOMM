import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen, Supplier, Currency } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { DarkCard } from '../components/ui/DarkCard';
import { AvatarCircle } from '../components/ui/AvatarCircle';
import { SectionHeader } from '../components/ui/SectionHeader';

interface ContactsProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  suppliers: Supplier[];
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

type TabId = 'all' | 'credit' | 'debt' | 'settled';

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: '\u05D4\u05DB\u05DC' },
  { id: 'credit', label: '\u05D7\u05D9\u05D9\u05D1\u05D9\u05DD \u05DC\u05D9' },
  { id: 'debt', label: '\u05D0\u05E0\u05D9 \u05D7\u05D9\u05D9\u05D1' },
  { id: 'settled', label: '\u05DE\u05D0\u05D5\u05E4\u05E1' },
];

const Contacts: React.FC<ContactsProps> = ({
  onNavigate,
  goBack,
  suppliers,
  globalCurrency,
  convertAmount,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    return suppliers.filter((c) => {
      const matchesTab = activeTab === 'all' || c.status === activeTab;
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [suppliers, activeTab, searchQuery]);

  const getStatusColor = (status: Supplier['status']) => {
    switch (status) {
      case 'credit':
        return colors.success;
      case 'debt':
        return colors.error;
      case 'settled':
      default:
        return colors.textTertiary;
    }
  };

  const renderSupplierCard = ({ item: contact }: { item: Supplier }) => {
    const statusColor = getStatusColor(contact.status);
    const prefix =
      contact.status === 'credit' ? '+' : contact.status === 'debt' ? '-' : '';
    const displayAmount = convertAmount(contact.amount).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

    return (
      <DarkCard
        style={styles.supplierCard}
        onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, contact.id)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <AvatarCircle
            name={contact.name}
            size={48}
            imageUri={contact.avatar}
            gradientColors={['#6B2FA0', '#00D9D9']}
          />
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        {/* Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={styles.contactCategory}>{contact.category}</Text>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: statusColor }]}>
            {prefix}
            {currencySymbols[globalCurrency]}
            {displayAmount}
          </Text>
          <Text style={styles.lastActiveText}>{contact.lastActive}</Text>
        </View>
      </DarkCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="person-search" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyText}>
        {'\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D5 \u05E1\u05E4\u05E7\u05D9\u05DD'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Gradient Header Zone */}
      <GradientHeader>
        {/* Title Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-forward" size={22} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {'\u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8'}
          </Text>

          <TouchableOpacity
            style={styles.headerBtnPrimary}
            onPress={() => onNavigate(AppScreen.ADD_SUPPLIER)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              '\u05D7\u05D9\u05E4\u05D5\u05E9 \u05DC\u05E4\u05D9 \u05E9\u05DD \u05D0\u05D5 \u05EA\u05D7\u05D5\u05DD...'
            }
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </GradientHeader>

      {/* Dark Zone — Supplier List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplierCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Contacts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Header
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  headerBtnPrimary: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  // Search Bar
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.white,
    marginRight: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: 0,
  },
  // Filter Tabs
  tabsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextInactive: {
    color: colors.textTertiary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  // Supplier Card
  supplierCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.bgSecondary,
  },
  contactInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  contactName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  contactCategory: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-start',
    marginLeft: spacing.sm,
  },
  amountText: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  lastActiveText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    marginTop: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
