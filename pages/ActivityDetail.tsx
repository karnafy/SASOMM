import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Pressable,
  Share,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const openExternalURL = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};
import { useTranslation } from 'react-i18next';
import { AppScreen, Expense, Currency, Supplier, Project, confirmDialog } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { DarkCard } from '../components/ui/DarkCard';
import { GradientButton } from '../components/ui/GradientButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivityDetailProps {
  onNavigate: (screen: AppScreen, id?: string) => void;
  goBack: () => void;
  expense: any;
  suppliers: Supplier[];
  project?: Project;
  onDeleteProject?: (id: string) => void;
  onDeleteTransaction?: (
    type: 'expense' | 'income',
    transactionId: string,
    projectId: string
  ) => Promise<void>;
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const ActivityDetail: React.FC<ActivityDetailProps> = ({
  onNavigate,
  goBack,
  expense,
  suppliers,
  project,
  onDeleteProject,
  onDeleteTransaction,
  globalCurrency,
  convertAmount,
}) => {
  const { t } = useTranslation();
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supplier = suppliers.find((s) => s.id === expense.supplierId);

  const getShareText = () => {
    const symbol = currencySymbols[(expense.currency || 'ILS') as Currency];
    return `*פרטי תשלום מ-SASOMM*
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
*עבור:* ${expense.title}
*סכום:* ${symbol}${expense.amount.toLocaleString()}
*תאריך:* ${expense.date}
*פרויקט:* ${expense.projectName || 'כללי'}
*קטגוריה:* ${expense.tag}
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
_נשלח מאפליקציית SASOMM_`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    openExternalURL(`https://wa.me/?text=${text}`);
  };

  const handleContactWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    openExternalURL(`https://wa.me/${cleanPhone}`);
  };

  const handleContactCall = (phone: string) => {
    openExternalURL(`tel:${phone}`);
  };

  const handleShare = async () => {
    const shareText = getShareText().replace(/\*/g, '');
    try {
      await Share.share({
        message: shareText,
        title: `פרטי תשלום - ${expense.title}`,
      });
    } catch (err) {
      Alert.alert(t('common.error'), t('activity_detail.err_share_failed'));
    }
  };

  const getSummaryText = () => {
    if (!project) return '';
    const symbol = currencySymbols[globalCurrency];
    const spent = convertAmount(project.spent);
    const budget = convertAmount(project.budget);
    const income = convertAmount(
      (project.incomes || []).reduce((s, i) => s + i.amount, 0),
    );
    const remainingVal = income - spent;
    const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;

    return `*דו"ח פרויקט: ${project.name}*
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
*סטטוס:* ${project.status === 'over' ? 'חריגה' : project.status === 'warning' ? 'אזהרה' : 'תקין'}
*קטגוריה:* ${project.category}
*תקציב:* ${symbol}${budget.toLocaleString()}
*הכנסות:* ${symbol}${income.toLocaleString()}
*שולם:* ${symbol}${spent.toLocaleString()} (${percentUsed}%)
*יתרה:* ${symbol}${remainingVal.toLocaleString()}
\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━\━
_הופק מאפליקציית SASOMM_`;
  };

  const handleProjectShare = async () => {
    if (!project) return;
    const shareText = getSummaryText().replace(/\*/g, '');
    try {
      await Share.share({
        message: shareText,
        title: `פרויקט: ${project.name}`,
      });
    } catch (err) {
      const text = encodeURIComponent(getSummaryText());
      openExternalURL(`https://wa.me/?text=${text}`);
    }
    setShowMenu(false);
  };

  const handleExportReport = () => {
    if (!project) return;
    const text = encodeURIComponent(getSummaryText());
    openExternalURL(`https://wa.me/?text=${text}`);
    setShowMenu(false);
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const ok = await confirmDialog({
      title: t('activity_detail.delete_project_title'),
      message: `${t('activity_detail.delete_project_title')}: "${project.name}"?`,
      confirmText: t('activity_detail.delete_project_confirm'),
      destructive: true,
    });
    if (ok) {
      onDeleteProject?.(project.id);
      setShowMenu(false);
    }
  };

  const performDeleteTransaction = async () => {
    if (!onDeleteTransaction || !expense?.id || !expense?.projectId) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(
        (expense.type === 'income' ? 'income' : 'expense') as 'expense' | 'income',
        expense.id,
        expense.projectId
      );
      setShowDeleteConfirm(false);
      goBack();
    } catch {
      // error swallowed; UI stays open for retry
    } finally {
      setIsDeleting(false);
    }
  };

  const amountColor =
    expense.type === 'income'
      ? colors.success
      : expense.type === 'note'
      ? colors.accent
      : colors.error;

  const typeBadgeColor =
    expense.type === 'income'
      ? colors.success
      : expense.type === 'note'
      ? colors.accent
      : colors.error;

  const typeLabel =
    expense.type === 'income'
      ? t('activity_detail.type_income')
      : expense.type === 'note'
      ? t('activity_detail.type_note')
      : t('activity_detail.type_expense');

  const typeIcon: React.ComponentProps<typeof MaterialIcons>['name'] =
    expense.type === 'income'
      ? 'check-circle'
      : expense.type === 'note'
      ? 'sticky-note-2'
      : 'payment';

  return (
    <View style={styles.container}>
      {/* Full Screen Image Viewer Modal */}
      <Modal visible={showFullImage} transparent animationType="fade">
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowFullImage(false)}
          >
            <MaterialIcons name="close" size={28} color={colors.white} />
          </TouchableOpacity>

          {expense.receiptImages && expense.receiptImages.length > 0 && (
            <View style={styles.imageViewerContent}>
              <Image
                source={{ uri: expense.receiptImages[currentImageIndex] }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              {expense.receiptImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.imageNavBtn, styles.imageNavRight]}
                    onPress={() =>
                      setCurrentImageIndex((prev: number) =>
                        prev > 0 ? prev - 1 : expense.receiptImages!.length - 1
                      )
                    }
                  >
                    <MaterialIcons name="chevron-right" size={36} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageNavBtn, styles.imageNavLeft]}
                    onPress={() =>
                      setCurrentImageIndex((prev: number) =>
                        prev < expense.receiptImages!.length - 1 ? prev + 1 : 0
                      )
                    }
                  >
                    <MaterialIcons name="chevron-left" size={36} color={colors.white} />
                  </TouchableOpacity>
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1} / {expense.receiptImages.length}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuCard}>
            {project && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onNavigate(AppScreen.EDIT_ACTIVITY, expense.id);
                    setShowMenu(false);
                  }}
                >
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>{t('activity_detail.menu_edit_payment')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onNavigate(AppScreen.EDIT_PROJECT, project.id);
                    setShowMenu(false);
                  }}
                >
                  <MaterialIcons name="folder" size={20} color={colors.accent} />
                  <Text style={styles.menuItemText}>{t('activity_detail.menu_edit_project')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleExportReport}>
                  <MaterialIcons name="description" size={20} color={colors.warning} />
                  <Text style={styles.menuItemText}>{t('activity_detail.menu_export_report')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleProjectShare}>
                  <MaterialIcons name="share" size={20} color={colors.success} />
                  <Text style={styles.menuItemText}>{t('activity_detail.menu_share_project')}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <MaterialIcons name="ios-share" size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>{t('activity_detail.menu_share_tx')}</Text>
            </TouchableOpacity>
            {project && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteProject}>
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>
                  {t('activity_detail.menu_delete_project')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <Pressable
          style={styles.menuOverlay}
          onPress={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <Pressable style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('activity_detail.delete_title')}</Text>
            <Text style={styles.confirmText}>
              {expense?.recurringTemplateId
                ? t('activity_detail.delete_recurring_msg')
                : `${t('activity_detail.delete')}: "${expense?.title || ''}"?`}
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancel]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmCancelText}>{t('activity_detail.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDanger]}
                onPress={performDeleteTransaction}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDangerText}>{isDeleting ? t('activity_detail.deleting') : t('activity_detail.delete')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Top Bar */}
      <ScreenTopBar
        title="פרטי פעולה"
        onBack={goBack}
        rightAction={
          <TouchableOpacity onPress={handleWhatsAppShare} hitSlop={8}>
            <MaterialIcons name="chat" size={22} color={colors.success} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.typeBadge, { borderColor: typeBadgeColor }]}>
            <MaterialIcons name={typeIcon} size={14} color={typeBadgeColor} />
            <Text style={[styles.typeBadgeText, { color: typeBadgeColor }]}>
              {typeLabel}
            </Text>
          </View>

          <Text style={styles.amountLabel}>
            {expense.type === 'note' ? t('activity_detail.section_note') : t('activity_detail.section_amount')}
          </Text>

          {expense.amount !== undefined ? (
            <View style={styles.amountContainer}>
              <View style={styles.amountRow}>
                <Text style={[styles.currencySymbol, { color: amountColor }]}>
                  {currencySymbols[(expense.currency || 'ILS') as Currency]}
                </Text>
                <Text style={[styles.amountValue, { color: amountColor }]}>
                  {expense.amount.toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.titleOnly}>{expense.title}</Text>
          )}

          <Text style={styles.dateText}>
            {expense.date}  {'\•'}  {expense.title}
          </Text>
        </View>

        {/* Detail Card */}
        <View style={styles.cardWrapper}>
          <DarkCard style={styles.detailCard}>
            {/* Payment Method */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="account-balance" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{t('activity_detail.payment_method')}</Text>
                <Text style={styles.detailValue}>
                  {expense.paymentMethod || t('activity_detail.default_payment')}
                </Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Project */}
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() =>
                expense.projectId &&
                onNavigate(AppScreen.PROJECT_DETAIL, expense.projectId)
              }
            >
              <View style={styles.detailIcon}>
                <MaterialIcons name="folder-special" size={20} color={colors.accent} />
              </View>
              <View style={[styles.detailInfo, { flex: 1 }]}>
                <Text style={styles.detailLabel}>{t('activity_detail.project_assignment')}</Text>
                <Text style={[styles.detailValue, { color: colors.accent }]}>
                  {expense.projectName || t('activity_detail.default_project')}
                </Text>
              </View>
              <MaterialIcons name="chevron-left" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Category */}
            {expense.tag && (
              <>
                <View style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialIcons name="category" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>{t('activity_detail.category')}</Text>
                    <Text style={styles.detailValue}>{expense.tag}</Text>
                  </View>
                </View>
              </>
            )}
          </DarkCard>
        </View>

        {/* Supplier Card */}
        {supplier && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('activity_detail.contact_section')}</Text>
              <Text style={styles.sectionSubtitle}>{t('activity_detail.supplier_registered')}</Text>
            </View>

            <DarkCard style={styles.supplierCard}>
              <TouchableOpacity
                style={styles.supplierAvatar}
                onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)}
              >
                <Image
                  source={{ uri: supplier.avatar }}
                  style={styles.supplierAvatarImage}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supplierInfo}
                onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)}
              >
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierPhone}>{supplier.phone}</Text>
                <View style={styles.whatsappBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.whatsappBadgeText}>WhatsApp {t('activity_detail.whatsapp_active')}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.supplierActions}>
                <TouchableOpacity
                  style={styles.supplierActionBtn}
                  onPress={() => handleContactWhatsApp(supplier.phone)}
                >
                  <MaterialIcons name="chat" size={22} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.supplierActionBtn}
                  onPress={() => handleContactCall(supplier.phone)}
                >
                  <MaterialIcons name="call" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </DarkCard>
          </View>
        )}

        {/* Receipt Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('activity_detail.attachments_section')}</Text>
            <Text style={styles.sectionSubtitle}>
              {expense.receiptImages?.length || 0} {t('activity_detail.files_count')}
            </Text>
          </View>

          {expense.receiptImages && expense.receiptImages.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScroll}
            >
              {expense.receiptImages.map((img: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.imageThumb}
                  onPress={() => {
                    setCurrentImageIndex(idx);
                    setShowFullImage(true);
                  }}
                >
                  <Image source={{ uri: img }} style={styles.imageThumbImg} />
                  <View style={styles.imageZoomOverlay}>
                    <MaterialIcons name="zoom-in" size={28} color={colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={() => onNavigate(AppScreen.EDIT_ACTIVITY, expense.id)}
              >
                <MaterialIcons
                  name="add-photo-alternate"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text style={styles.addImageText}>{t('activity_detail.add_attachment')}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.noImages}>
              <View style={styles.noImagesIcon}>
                <MaterialIcons name="no-photography" size={40} color={colors.textTertiary} />
              </View>
              <Text style={styles.noImagesText}>
                {t('activity_detail.no_visual_doc')}
              </Text>
              <TouchableOpacity
                style={styles.addReceiptBtn}
                onPress={() => onNavigate(AppScreen.EDIT_ACTIVITY, expense.id)}
              >
                <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
                <Text style={styles.addReceiptText}>{t('activity_detail.add_receipt')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Audit Trail */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('activity_detail.audit_section')}</Text>
            <View style={styles.auditBadge}>
              <MaterialIcons name="lock" size={12} color={colors.textTertiary} />
              <Text style={styles.auditBadgeText}>Audit Safe</Text>
            </View>
          </View>

          {/* Creation entry */}
          <View style={styles.auditEntry}>
            <View style={styles.auditDot}>
              <MaterialIcons name="person" size={18} color={colors.primary} />
            </View>
            <View style={styles.auditContent}>
              <Text style={styles.auditTitle}>{t('activity_detail.audit_created_by')}</Text>
              <Text style={styles.auditDate}>{expense.date} {'\•'} 10:45</Text>
              <View style={styles.auditNote}>
                <Text style={styles.auditNoteText}>
                  {t('activity_detail.audit_added_to_project')}
                  {expense.projectName || t('activity_detail.audit_default_project')}.
                </Text>
              </View>
            </View>
          </View>

          {/* History entries */}
          {expense.history &&
            expense.history.map((entry: any) => (
              <View key={entry.id} style={styles.auditEntry}>
                <View style={styles.auditDot}>
                  <MaterialIcons name="person" size={18} color={colors.primary} />
                </View>
                <View style={styles.auditContent}>
                  <Text style={styles.auditTitle}>{entry.action}</Text>
                  <Text style={styles.auditDate}>
                    {entry.date} {'\•'} {entry.time || '14:20'}
                  </Text>
                  <View style={styles.auditNote}>
                    {entry.oldValue && entry.newValue ? (
                      <View>
                        <Text style={styles.changeLabel}>{t('activity_detail.audit_value_change')}</Text>
                        <View style={styles.changeRow}>
                          <Text style={styles.oldValue}>{entry.oldValue}</Text>
                          <MaterialIcons
                            name="trending-flat"
                            size={18}
                            color={colors.textTertiary}
                          />
                          <Text style={styles.newValue}>{entry.newValue}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.auditNoteText}>{entry.details}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}

          {/* Receipt entry */}
          {expense.receiptImages && expense.receiptImages.length > 0 && (
            <View style={styles.auditEntry}>
              <View style={styles.auditDot}>
                <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
              </View>
              <View style={styles.auditContent}>
                <Text style={styles.auditTitle}>{t('activity_detail.audit_payment_proof')}</Text>
                <Text style={styles.auditDate}>
                  {expense.date} {'\•'} {expense.time || '10:46'}
                </Text>
                <Text style={styles.verifiedText}>Verified Secure Scan</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <GradientButton
            label="ערוך"
            variant="outline"
            onPress={() => onNavigate(AppScreen.EDIT_ACTIVITY, expense.id)}
            style={styles.actionBtn}
          />
          <GradientButton
            label="מחק"
            variant="danger"
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontFamily: fonts.bold,
  },
  amountValue: {
    fontSize: 52,
    fontFamily: fonts.extrabold,
    letterSpacing: -2,
  },
  titleOnly: {
    fontSize: 24,
    fontFamily: fonts.extrabold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  dateText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    marginTop: 12,
    writingDirection: 'rtl',
  },

  // Detail Card
  cardWrapper: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailCard: {
    padding: 0,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.subtleBorder,
    marginHorizontal: spacing.xl,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    marginTop: 2,
  },

  // Supplier
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.xl,
  },
  supplierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  supplierAvatarImage: {
    width: '100%',
    height: '100%',
  },
  supplierInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  supplierName: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  supplierPhone: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,232,143,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  whatsappBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supplierActions: {
    gap: 10,
  },
  supplierActionBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },

  // Images
  imagesScroll: {
    gap: 12,
    paddingRight: spacing.xl,
  },
  imageThumb: {
    width: 140,
    height: 170,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
  },
  imageZoomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  addImageBtn: {
    width: 140,
    height: 170,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  noImages: {
    padding: spacing['3xl'],
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.subtleBorder,
    gap: 14,
  },
  noImagesIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  noImagesText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  addReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.25)',
  },
  addReceiptText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.primary,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },

  // Audit trail
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  auditBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  auditEntry: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: spacing.xl,
  },
  auditDot: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  auditContent: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  auditDate: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  auditNote: {
    marginTop: 10,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  auditNoteText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  changeLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oldValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  newValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.success,
    backgroundColor: 'rgba(0,232,143,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },

  // Image viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,11,26,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullImage: {
    width: SCREEN_WIDTH - 40,
    height: '75%',
    borderRadius: radii.xl,
  },
  imageNavBtn: {
    position: 'absolute',
    top: '50%',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNavRight: {
    right: 8,
  },
  imageNavLeft: {
    left: 8,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  imageCounterText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menuCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    borderRadius: radii.xl,
    padding: spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.subtleBorder,
    marginVertical: 4,
    marginHorizontal: spacing.sm,
  },

  // Delete confirmation modal
  confirmCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    gap: spacing.md,
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  confirmText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
  confirmRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmCancel: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.subtleBorder,
  },
  confirmCancelText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  confirmDanger: {
    backgroundColor: 'rgba(255,77,106,0.10)',
    borderColor: 'rgba(255,77,106,0.30)',
  },
  confirmDangerText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.error,
  },
});

export default ActivityDetail;
