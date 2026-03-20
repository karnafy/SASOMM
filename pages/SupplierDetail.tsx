import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    openExternalURL(url);
  }
};
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Supplier, Project, Currency } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { AvatarCircle } from '../components/ui/AvatarCircle';
import { CircleIconButton } from '../components/ui/CircleIconButton';
import { TransactionRow } from '../components/ui/TransactionRow';
import { SectionHeader } from '../components/ui/SectionHeader';

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
    openExternalURL(`https://wa.me/${formattedPhone}?text=${message}`);
  };

  const handleCall = () => {
    if (!supplier.phone) {
      Alert.alert(
        '\u05E9\u05D2\u05D9\u05D0\u05D4',
        '\u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8 \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05E1\u05E4\u05E7 \u05D6\u05D4.'
      );
      return;
    }
    openExternalURL(`tel:${supplier.phone}`);
  };

  const handleEmail = () => {
    const email = `${supplier.name.replace(/\s+/g, '.')}@example.com`.toLowerCase();
    openExternalURL(`mailto:${email}?subject=MONNY - \u05E4\u05E0\u05D9\u05D4 \u05DE\u05E1\u05E4\u05E7`);
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
        {/* Gradient Header Zone */}
        <GradientHeader>
          {/* Nav Row */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => (isEditing ? handleCancel() : goBack())}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isEditing ? 'close' : 'chevron-right'}
                size={26}
                color={colors.white}
              />
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <Text style={styles.navSubtitle}>
                {'\u05DB\u05E8\u05D8\u05D9\u05E1 \u05E1\u05E4\u05E7'}
              </Text>
              <Text style={styles.navTitle}>
                {isEditing
                  ? '\u05E2\u05E8\u05D9\u05DB\u05EA \u05E4\u05E8\u05D8\u05D9\u05DD'
                  : '\u05E4\u05E8\u05D8\u05D9 \u05D4\u05EA\u05E7\u05E9\u05E8\u05D5\u05EA'}
              </Text>
            </View>

            {isEditing ? (
              <TouchableOpacity
                style={styles.navBtnPrimary}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={26} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar + Info (view mode) or Edit fields (edit mode) */}
          {isEditing ? (
            /* Edit Mode — in gradient zone */
            <View style={styles.editContainer}>
              <TouchableOpacity
                style={styles.avatarEditWrap}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <AvatarCircle
                  name={editName}
                  size={72}
                  imageUri={editAvatar}
                  gradientColors={['#6B2FA0', '#00D9D9']}
                />
                <View style={styles.avatarOverlay}>
                  <MaterialIcons name="photo-camera" size={22} color={colors.white} />
                </View>
              </TouchableOpacity>

              <View style={styles.editFieldsContainer}>
                {/* Name */}
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>{'\u05E9\u05DD'}</Text>
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
                  <Text style={styles.editLabel}>{'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4'}</Text>
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
                  <Text style={styles.editLabel}>{'\u05D8\u05DC\u05E4\u05D5\u05DF'}</Text>
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

              {/* Balance summary in edit mode */}
              <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>
                      {'\u05DE\u05E6\u05D1 \u05D9\u05EA\u05E8\u05D4'}
                    </Text>
                    <Text style={[styles.summaryAmount, { color: statusColor }]}>
                      {currencySymbols['ILS']}
                      {supplier.amount.toLocaleString()}
                      {balanceSign}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>
                      {'\u05E1\u05D8\u05D8\u05D5\u05E1'}
                    </Text>
                    <Text style={[styles.summaryStatusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          ) : (
            /* View Mode — in gradient zone */
            <View style={styles.profileContainer}>
              <AvatarCircle
                name={supplier.name}
                size={72}
                imageUri={supplier.avatar}
                gradientColors={['#6B2FA0', '#00D9D9']}
              />
              <Text style={styles.supplierName}>{supplier.name}</Text>
              <Text style={styles.supplierCategory}>{supplier.category}</Text>
              {supplier.phone ? (
                <Text style={styles.supplierPhone}>{supplier.phone}</Text>
              ) : null}

              {/* Glass summary card */}
              <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>
                      {'\u05D9\u05EA\u05E8\u05D4'}
                    </Text>
                    <Text style={[styles.summaryAmount, { color: statusColor }]}>
                      {balanceSign}
                      {currencySymbols['ILS']}
                      {supplier.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>
                      {'\u05E1\u05D8\u05D8\u05D5\u05E1'}
                    </Text>
                    <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>
                      {'\u05E4\u05E2\u05D5\u05DC\u05D5\u05EA'}
                    </Text>
                    <Text style={styles.summaryCount}>
                      {supplierTransactions.length}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Quick Action Buttons (view mode only) */}
          {!isEditing && (
            <View style={styles.quickActions}>
              <CircleIconButton
                icon="chat"
                color="#25D366"
                size={52}
                label="WhatsApp"
                onPress={handleWhatsApp}
              />
              <CircleIconButton
                icon="phone"
                color={colors.primary}
                size={52}
                label={'\u05D4\u05EA\u05E7\u05E9\u05E8'}
                onPress={handleCall}
              />
              <CircleIconButton
                icon="payments"
                color={colors.accent}
                size={52}
                label={'\u05EA\u05E9\u05DC\u05D5\u05DD'}
                onPress={() => onNavigate(AppScreen.ADD_EXPENSE, supplier.id)}
              />
              <CircleIconButton
                icon="mail"
                color={colors.textSecondary}
                size={52}
                label={'\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC'}
                onPress={handleEmail}
              />
            </View>
          )}

          {/* Bottom padding to create gradient overlap */}
          <View style={{ height: spacing.xl }} />
        </GradientHeader>

        {/* Dark Zone */}

        {/* Linked Projects */}
        {linkedProjects.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={'\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05DE\u05E9\u05D5\u05D9\u05DB\u05D9\u05DD'}
              linkText={`${linkedProjects.length} \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.linkedProjectsList}
              style={styles.linkedProjectsScroll}
            >
              {linkedProjects.map((project) => (
                <DarkCard
                  key={project.id}
                  style={styles.linkedProjectCard}
                  onPress={() => onNavigate(AppScreen.PROJECT_DETAIL, project.id)}
                >
                  <View style={styles.linkedProjectIcon}>
                    <MaterialIcons name="folder" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.linkedProjectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.linkedProjectCategory}>
                    {project.category}
                  </Text>
                </DarkCard>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <SectionHeader
            title={'\u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05E2\u05E1\u05E7\u05D0\u05D5\u05EA'}
            linkText={
              supplierTransactions.length > 0
                ? `${supplierTransactions.length} \u05E4\u05E2\u05D5\u05DC\u05D5\u05EA`
                : undefined
            }
          />

          {supplierTransactions.length > 0 ? (
            <DarkCard style={styles.transactionsCard}>
              {supplierTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  icon={tx.type === 'income' ? 'add-card' : 'receipt-long'}
                  iconColor={tx.type === 'income' ? colors.success : colors.primary}
                  title={tx.title}
                  meta={`${tx.projectName} · ${tx.date}`}
                  amount={`${tx.type === 'income' ? '+' : '-'}${currencySymbols[tx.currency || 'ILS']}${tx.amount.toLocaleString()}`}
                  isIncome={tx.type === 'income'}
                  onPress={() => onNavigate(AppScreen.ACTIVITY_DETAIL, tx.id)}
                />
              ))}
            </DarkCard>
          ) : (
            <DarkCard style={styles.emptyTransactions}>
              <MaterialIcons
                name="history-edu"
                size={32}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>
                {'\u05D0\u05D9\u05DF \u05E2\u05D3\u05D9\u05D9\u05DF \u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD'}
              </Text>
            </DarkCard>
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
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Nav Row (inside GradientHeader)
  navRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  navBtnPrimary: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    alignItems: 'center',
  },
  navSubtitle: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  navTitle: {
    fontSize: 18,
    fontFamily: fonts.extrabold,
    color: colors.white,
  },

  // Profile (view mode)
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  supplierName: {
    fontSize: 24,
    fontFamily: fonts.extrabold,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.sm,
    writingDirection: 'rtl',
  },
  supplierCategory: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
  },
  supplierPhone: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },

  // Summary Glass Card
  summaryCard: {
    width: '100%',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    padding: spacing.lg,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: fonts.extrabold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  summaryAmount: {
    fontSize: 20,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.5,
  },
  summaryCount: {
    fontSize: 20,
    fontFamily: fonts.extrabold,
    color: colors.white,
  },
  summaryStatusText: {
    fontSize: 15,
    fontFamily: fonts.extrabold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  // Edit Mode (inside gradient)
  editContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarEditWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
  },
  editFieldsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  editField: {
    width: '100%',
  },
  editLabel: {
    fontSize: 11,
    fontFamily: fonts.extrabold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  editInputLtr: {
    writingDirection: 'ltr',
    textAlign: 'left',
  },

  // Sections (dark zone)
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },

  // Linked Projects
  linkedProjectsScroll: {
    marginHorizontal: -spacing.xl,
  },
  linkedProjectsList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  linkedProjectCard: {
    padding: spacing.lg,
    minWidth: 140,
    gap: spacing.sm,
  },
  linkedProjectIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,217,217,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedProjectName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  linkedProjectCategory: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Transactions
  transactionsCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },

  // Empty Transactions
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
  },
  paymentBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radii['2xl'],
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  paymentBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBtnText: {
    fontSize: 16,
    fontFamily: fonts.extrabold,
    color: colors.white,
    writingDirection: 'rtl',
  },
});
