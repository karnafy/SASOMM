import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen, Supplier, Currency } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

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
      <TouchableOpacity
        style={[styles.supplierCard, neuRaised]}
        activeOpacity={0.85}
        onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, contact.id)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrap, neuRaised]}>
            <Image source={{ uri: contact.avatar }} style={styles.avatar} />
          </View>
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
      </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.headerBtn, neuRaised]}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {'\u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8'}
          </Text>

          <TouchableOpacity
            style={[styles.headerBtnPrimary]}
            onPress={() => onNavigate(AppScreen.ADD_SUPPLIER)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search */}
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
                style={[
                  styles.tab,
                  isActive ? styles.tabActive : [styles.tabInactive, neuRaised],
                ]}
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
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Supplier List */}
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
    backgroundColor: colors.neuBg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.neuBg,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPrimary: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.neuBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(200, 208, 224, 0.4)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: colors.neuBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: colors.white,
  },
  tabTextInactive: {
    color: colors.textTertiary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  supplierCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.neuBg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.neuBg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
  },
  statusDot: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.neuBg,
  },
  contactInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  contactCategory: {
    fontSize: 12,
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
    fontWeight: '700',
  },
  lastActiveText: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: radii['2xl'],
    backgroundColor: colors.neuBg,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: spacing.md,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
