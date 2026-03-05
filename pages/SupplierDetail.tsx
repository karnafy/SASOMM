import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Supplier, Project, Currency } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

interface SupplierDetailProps {
  onNavigate: (screen: AppScreen, id?: string, scan?: boolean, txType?: 'expense' | 'income') => void;
  goBack: () => void;
  supplier: Supplier;
  projects: Project[];
  onUpdateSupplier: (supplier: Supplier) => Promise<void>;
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const SupplierDetail: React.FC<SupplierDetailProps> = ({
  onNavigate,
  goBack,
  supplier,
  projects,
  onUpdateSupplier,
  globalCurrency,
  convertAmount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(supplier.name);
  const [editCategory, setEditCategory] = useState(supplier.category);
  const [editPhone, setEditPhone] = useState(supplier.phone || '');
  const [editAvatar, setEditAvatar] = useState(supplier.avatar);

  const handleSave = async () => {
    await onUpdateSupplier({
      ...supplier,
      name: editName,
      category: editCategory,
      phone: editPhone,
      avatar: editAvatar,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(supplier.name);
    setEditCategory(supplier.category);
    setEditPhone(supplier.phone || '');
    setEditAvatar(supplier.avatar);
    setIsEditing(false);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        '\u05E9\u05D2\u05D9\u05D0\u05D4',
        '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05D4 \u05DC\u05D2\u05DC\u05E8\u05D9\u05D4'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const handleWhatsApp = () => {
    if (!supplier.phone) {
      Alert.alert(
        '\u05E9\u05D2\u05D9\u05D0\u05D4',
        '\u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8 \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05E1\u05E4\u05E7 \u05D6\u05D4.'
      );
      return;
    }
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('972')) {
      formattedPhone = cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      formattedPhone = '972' + cleanPhone.substring(1);
    } else {
      formattedPhone = '972' + cleanPhone;
    }
    const message = encodeURIComponent(
      `\u05E9\u05DC\u05D5\u05DD ${supplier.name}, \u05E8\u05E6\u05D9\u05EA\u05D9 \u05DC\u05D1\u05E8\u05E8 \u05DC\u05D2\u05D1\u05D9 \u05DE\u05E6\u05D1 \u05D4\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05D9 \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA MONNY.`
    );
    Linking.openURL(`https://wa.me/${formattedPhone}?text=${message}`);
  };

  const handleCall = () => {
    if (!supplier.phone) {
      Alert.alert(
        '\u05E9\u05D2\u05D9\u05D0\u05D4',
        '\u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8 \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05E1\u05E4\u05E7 \u05D6\u05D4.'
      );
      return;
    }
    Linking.openURL(`tel:${supplier.phone}`);
  };

  const handleEmail = () => {
    const email = `${supplier.name.replace(/\s+/g, '.')}@example.com`.toLowerCase();
    Linking.openURL(`mailto:${email}?subject=MONNY - \u05E4\u05E0\u05D9\u05D4 \u05DE\u05E1\u05E4\u05E7`);
  };

  // Build transaction list from projects
  const supplierTransactions = projects
    .flatMap((p) => [
      ...p.expenses
        .filter((e) => e.supplierId === supplier.id)
        .map((e) => ({
          ...e,
          projectName: p.name,
          projectId: p.id,
          type: 'expense' as const,
        })),
      ...(p.incomes || [])
        .filter((i) => i.supplierId === supplier.id)
        .map((i) => ({
          ...i,
          projectName: p.name,
          projectId: p.id,
          type: 'income' as const,
        })),
    ])
    .sort((a, b) => b.id.localeCompare(a.id));

  // Unique linked projects
  const linkedProjects = projects.filter(
    (p) =>
      p.expenses.some((e) => e.supplierId === supplier.id) ||
      (p.incomes || []).some((i) => i.supplierId === supplier.id)
  );

  const statusColor =
    supplier.status === 'credit'
      ? colors.success
      : supplier.status === 'debt'
      ? colors.error
      : colors.textTertiary;

  const statusLabel =
    supplier.status === 'credit'
      ? '\u05D6\u05DB\u05D5\u05EA'
      : supplier.status === 'debt'
      ? '\u05D7\u05D5\u05D1'
      : '\u05DE\u05D0\u05D5\u05D6\u05DF';

  const balanceSign =
    supplier.status === 'credit' ? '+' : supplier.status === 'debt' ? '-' : '';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerBtn, neuRaised]}
            onPress={() => (isEditing ? handleCancel() : goBack())}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isEditing ? 'close' : 'chevron-right'}
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerSubtitle}>
              {'\u05DB\u05E8\u05D8\u05D9\u05E1 \u05E1\u05E4\u05E7'}
            </Text>
            <Text style={styles.headerTitle}>
              {isEditing
                ? '\u05E2\u05E8\u05D9\u05DB\u05EA \u05E4\u05E8\u05D8\u05D9\u05DD'
                : '\u05E4\u05E8\u05D8\u05D9 \u05D4\u05EA\u05E7\u05E9\u05E8\u05D5\u05EA'}
            </Text>
          </View>

          {isEditing ? (
            <TouchableOpacity
              style={styles.headerBtnPrimary}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={28} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.headerBtn, neuRaised]}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={[styles.profileCard, neuRaisedLg]}>
            {isEditing ? (
              /* Edit Mode */
              <>
                <TouchableOpacity
                  style={styles.avatarLargeWrap}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: editAvatar }}
                    style={styles.avatarLargeImage}
                  />
                  <View style={styles.avatarOverlay}>
                    <MaterialIcons name="photo-camera" size={28} color={colors.white} />
                  </View>
                </TouchableOpacity>

                <View style={styles.editFieldsContainer}>
                  {/* Name */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>
                      {'\u05E9\u05DD'}
                    </Text>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder={'\u05E9\u05DD \u05D4\u05E1\u05E4\u05E7'}
                      placeholderTextColor={colors.textTertiary}
                      textAlign="right"
                    />
                  </View>

                  {/* Category */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>
                      {'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4'}
                    </Text>
                    <TextInput
                      style={styles.editInput}
                      value={editCategory}
                      onChangeText={setEditCategory}
                      placeholder={'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4'}
                      placeholderTextColor={colors.textTertiary}
                      textAlign="right"
                    />
                  </View>

                  {/* Phone */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>
                      {'\u05D8\u05DC\u05E4\u05D5\u05DF'}
                    </Text>
                    <TextInput
                      style={[styles.editInput, styles.editInputLtr]}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="050-1234567"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      textAlign="left"
                    />
                  </View>
                </View>

                {/* Balance Summary (Edit mode) */}
                <View style={styles.balanceRow}>
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>
                      {'\u05DE\u05E6\u05D1 \u05D9\u05EA\u05E8\u05D4'}
                    </Text>
                    <Text style={[styles.balanceAmount, { color: statusColor }]}>
                      {currencySymbols['ILS']}
                      {supplier.amount.toLocaleString()}
                      {balanceSign}
                    </Text>
                  </View>
                  <View style={styles.balanceDivider} />
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>
                      {'\u05E1\u05D8\u05D8\u05D5\u05E1'}
                    </Text>
                    <Text style={[styles.balanceStatus, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              /* View Mode */
              <>
                <View style={styles.avatarLargeWrap}>
                  <Image
                    source={{ uri: supplier.avatar }}
                    style={styles.avatarLargeImage}
                  />
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor },
                    ]}
                  />
                </View>

                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierCategory}>{supplier.category}</Text>

                {/* Balance Summary */}
                <View style={styles.balanceRow}>
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>
                      {'\u05DE\u05E6\u05D1 \u05D9\u05EA\u05E8\u05D4'}
                    </Text>
                    <Text style={[styles.balanceAmount, { color: statusColor }]}>
                      {currencySymbols['ILS']}
                      {supplier.amount.toLocaleString()}
                      {balanceSign}
                    </Text>
                  </View>
                  <View style={styles.balanceDivider} />
                  <View style={styles.balanceCol}>
                    <Text style={styles.balanceLabel}>
                      {'\u05D8\u05DC\u05E4\u05D5\u05DF'}
                    </Text>
                    <Text style={styles.phoneDisplay}>
                      {supplier.phone || '\u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8'}
                    </Text>
                  </View>
                </View>

                {/* Contact Action Buttons */}
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[styles.contactActionBtn, neuRaised]}
                    onPress={handleCall}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="phone" size={22} color={colors.primary} />
                    <Text style={styles.contactActionLabel}>
                      {'\u05D4\u05EA\u05E7\u05E9\u05E8'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contactActionBtn, neuRaised]}
                    onPress={handleWhatsApp}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="chat" size={22} color={colors.success} />
                    <Text style={styles.contactActionLabel}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contactActionBtn, neuRaised]}
                    onPress={handleEmail}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="mail" size={22} color={colors.textSecondary} />
                    <Text style={styles.contactActionLabel}>
                      {'\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Linked Projects */}
        {linkedProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05DE\u05E9\u05D5\u05D9\u05DB\u05D9\u05DD'}
              </Text>
              <Text style={styles.sectionCount}>
                {linkedProjects.length}{' '}
                {'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.linkedProjectsList}
              style={styles.linkedProjectsScroll}
            >
              {linkedProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.linkedProjectCard, neuRaised]}
                  onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.linkedProjectIcon}>
                    <MaterialIcons name="folder" size={28} color={colors.primaryDark} />
                  </View>
                  <Text style={styles.linkedProjectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.linkedProjectCategory}>
                    {project.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {'\u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05E2\u05E1\u05E7\u05D0\u05D5\u05EA'}
            </Text>
            <Text style={styles.sectionCount}>
              {supplierTransactions.length}{' '}
              {'\u05E4\u05E2\u05D5\u05DC\u05D5\u05EA'}
            </Text>
          </View>

          {supplierTransactions.length > 0 ? (
            supplierTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={[styles.transactionCard, neuRaised]}
                onPress={() => onNavigate(AppScreen.ACTIVITY_DETAIL, tx.id)}
                activeOpacity={0.85}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor:
                        tx.type === 'income'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(0, 217, 217, 0.1)',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={tx.type === 'income' ? 'add-card' : 'receipt-long'}
                    size={24}
                    color={tx.type === 'income' ? colors.success : colors.primary}
                  />
                </View>

                {/* Info */}
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      onNavigate(AppScreen.PROJECT_DETAIL, tx.projectId)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.txProjectRow}>
                      <MaterialIcons
                        name="folder-open"
                        size={12}
                        color={colors.primaryDark}
                      />
                      <Text style={styles.txProjectName}>{tx.projectName}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>

                {/* Amount */}
                <View style={styles.txAmountWrap}>
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.type === 'income' ? colors.success : colors.error,
                      },
                    ]}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currencySymbols[tx.currency || 'ILS']}
                    {tx.amount.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <View style={[styles.emptyIcon, neuRaised]}>
                <MaterialIcons
                  name="history-edu"
                  size={32}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyText}>
                {'\u05D0\u05D9\u05DF \u05E2\u05D3\u05D9\u05D9\u05DF \u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      {!isEditing && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.paymentBtn}
            onPress={() => onNavigate(AppScreen.ADD_EXPENSE, supplier.id)}
            activeOpacity={0.85}
          >
            <View style={styles.paymentBtnIcon}>
              <MaterialIcons name="payments" size={22} color={colors.white} />
            </View>
            <Text style={styles.paymentBtnText}>
              {'\u05D1\u05E6\u05E2 \u05EA\u05E9\u05DC\u05D5\u05DD \u05D7\u05D3\u05E9'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default SupplierDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.neuBg,
  },
  headerBtn: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPrimary: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },

  // Profile Card
  profileSection: {
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  profileCard: {
    borderRadius: 36,
    padding: spacing['3xl'],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Avatar
  avatarLargeWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
    borderWidth: 3,
    borderColor: colors.white,
    position: 'relative',
  },
  avatarLargeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 56,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: colors.white,
  },

  // Supplier info (view mode)
  supplierName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  supplierCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: spacing['3xl'],
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  // Balance Row
  balanceRow: {
    flexDirection: 'row-reverse',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    marginVertical: 4,
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceStatus: {
    fontSize: 16,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  phoneDisplay: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Contact Actions
  contactActions: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    width: '100%',
    marginTop: spacing['3xl'],
  },
  contactActionBtn: {
    flex: 1,
    height: 56,
    borderRadius: radii['2xl'],
    backgroundColor: colors.neuBg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  contactActionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },

  // Edit fields
  editFieldsContainer: {
    width: '100%',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  editField: {
    width: '100%',
  },
  editLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  editInput: {
    backgroundColor: colors.neuBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(200, 208, 224, 0.4)',
  },
  editInputLtr: {
    writingDirection: 'ltr',
    textAlign: 'left',
  },

  // Sections
  section: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
  },

  // Linked Projects
  linkedProjectsScroll: {
    marginHorizontal: -spacing['3xl'],
  },
  linkedProjectsList: {
    paddingHorizontal: spacing['3xl'],
    gap: spacing.lg,
  },
  linkedProjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: radii['3xl'],
    padding: spacing.xl,
    minWidth: 150,
    gap: spacing.md,
  },
  linkedProjectIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(0, 217, 217, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedProjectName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  linkedProjectCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Transactions
  transactionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 28,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  txIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  txProjectRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  txProjectName: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    writingDirection: 'rtl',
  },
  txDate: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  txAmountWrap: {
    alignItems: 'flex-start',
  },
  txAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // Empty State
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 48,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['3xl'],
  },
  paymentBtn: {
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  paymentBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    writingDirection: 'rtl',
  },
});
