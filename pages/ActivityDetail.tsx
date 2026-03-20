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
import { AppScreen, Expense, Currency, Supplier, Project } from '@monn/shared';
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
  globalCurrency: Currency;
  convertAmount: (amount: number) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const ActivityDetail: React.FC<ActivityDetailProps> = ({
  onNavigate,
  goBack,
  expense,
  suppliers,
  project,
  onDeleteProject,
  globalCurrency,
  convertAmount,
}) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const supplier = suppliers.find((s) => s.id === expense.supplierId);

  const getShareText = () => {
    const symbol = currencySymbols[(expense.currency || 'ILS') as Currency];
    return `*\u05E4\u05E8\u05D8\u05D9 \u05EA\u05E9\u05DC\u05D5\u05DD \u05DE-MONNY*
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
*\u05E2\u05D1\u05D5\u05E8:* ${expense.title}
*\u05E1\u05DB\u05D5\u05DD:* ${symbol}${expense.amount.toLocaleString()}
*\u05EA\u05D0\u05E8\u05D9\u05DA:* ${expense.date}
*\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8:* ${expense.projectName || '\u05DB\u05DC\u05DC\u05D9'}
*\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4:* ${expense.tag}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_\u05E0\u05E9\u05DC\u05D7 \u05DE\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA MONNY_`;
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
        title: `\u05E4\u05E8\u05D8\u05D9 \u05EA\u05E9\u05DC\u05D5\u05DD - ${expense.title}`,
      });
    } catch (err) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05E9\u05EA\u05E3');
    }
  };

  const getSummaryText = () => {
    if (!project) return '';
    const symbol = currencySymbols[globalCurrency];
    const spent = convertAmount(project.spent);
    const budget = convertAmount(project.budget);
    const remainingVal = budget - spent;
    const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;

    return `*\u05D3\u05D5"\u05D7 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8: ${project.name}*
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
*\u05E1\u05D8\u05D8\u05D5\u05E1:* ${project.status === 'over' ? '\u05D7\u05E8\u05D9\u05D2\u05D4' : project.status === 'warning' ? '\u05D0\u05D6\u05D4\u05E8\u05D4' : '\u05EA\u05E7\u05D9\u05DF'}
*\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4:* ${project.category}
*\u05EA\u05E7\u05E6\u05D9\u05D1:* ${symbol}${budget.toLocaleString()}
*\u05E9\u05D5\u05DC\u05DD:* ${symbol}${spent.toLocaleString()} (${percentUsed}%)
*\u05D9\u05EA\u05E8\u05D4:* ${symbol}${remainingVal.toLocaleString()}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_\u05D4\u05D5\u05E4\u05E7 \u05DE\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA MONNY_`;
  };

  const handleProjectShare = async () => {
    if (!project) return;
    const shareText = getSummaryText().replace(/\*/g, '');
    try {
      await Share.share({
        message: shareText,
        title: `\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8: ${project.name}`,
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

  const handleDeleteProject = () => {
    if (!project) return;
    Alert.alert(
      '\u05DE\u05D7\u05D9\u05E7\u05EA \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8',
      `\u05D4\u05D0\u05DD \u05D0\u05EA\u05D4 \u05D1\u05D8\u05D5\u05D7 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05DE\u05D7\u05D5\u05E7 \u05D0\u05EA \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 "${project.name}"?`,
      [
        { text: '\u05D1\u05D9\u05D8\u05D5\u05DC', style: 'cancel' },
        {
          text: '\u05DE\u05D7\u05E7',
          style: 'destructive',
          onPress: () => {
            onDeleteProject?.(project.id);
            setShowMenu(false);
          },
        },
      ]
    );
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
      ? '\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05D0\u05D5\u05E9\u05E8\u05EA'
      : expense.type === 'note'
      ? '\u05EA\u05D9\u05E2\u05D5\u05D3 \u05DB\u05DC\u05DC\u05D9'
      : '\u05D4\u05D5\u05E6\u05D0\u05D4 \u05DE\u05D0\u05D5\u05E9\u05E8\u05EA';

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
                  <Text style={styles.menuItemText}>{'\u05E2\u05E8\u05D9\u05DB\u05EA \u05D4\u05EA\u05E9\u05DC\u05D5\u05DD'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onNavigate(AppScreen.EDIT_PROJECT, project.id);
                    setShowMenu(false);
                  }}
                >
                  <MaterialIcons name="folder" size={20} color={colors.accent} />
                  <Text style={styles.menuItemText}>{'\u05E2\u05E8\u05D9\u05DB\u05EA \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleExportReport}>
                  <MaterialIcons name="description" size={20} color={colors.warning} />
                  <Text style={styles.menuItemText}>{'\u05D4\u05D5\u05E6\u05D0\u05EA \u05D3\u05D5"\u05D7'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleProjectShare}>
                  <MaterialIcons name="share" size={20} color={colors.success} />
                  <Text style={styles.menuItemText}>{'\u05E9\u05D9\u05EA\u05D5\u05E3 \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <MaterialIcons name="ios-share" size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>{'\u05E9\u05EA\u05E3 \u05E2\u05E1\u05E7\u05D4'}</Text>
            </TouchableOpacity>
            {project && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteProject}>
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>
                  {'\u05DE\u05D7\u05D9\u05E7\u05EA \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Top Bar */}
      <ScreenTopBar
        title="\u05E4\u05E8\u05D8\u05D9 \u05E4\u05E2\u05D5\u05DC\u05D4"
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
            {expense.type === 'note' ? '\u05EA\u05D5\u05DB\u05DF \u05D4\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA' : '\u05E1\u05DB\u05D5\u05DD \u05D4\u05E2\u05E1\u05E7\u05D4'}
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
            {expense.date}  {'\u2022'}  {expense.title}
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
                <Text style={styles.detailLabel}>{'\u05D0\u05DE\u05E6\u05E2\u05D9 \u05EA\u05E9\u05DC\u05D5\u05DD'}</Text>
                <Text style={styles.detailValue}>
                  {expense.paymentMethod || '\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9 / \u05D4\u05E2\u05D1\u05E8\u05D4'}
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
                <Text style={styles.detailLabel}>{'\u05E9\u05D9\u05D5\u05DA \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8'}</Text>
                <Text style={[styles.detailValue, { color: colors.accent }]}>
                  {expense.projectName || '\u05DB\u05DC\u05DC\u05D9'}
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
                    <Text style={styles.detailLabel}>{'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4'}</Text>
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
              <Text style={styles.sectionTitle}>{'\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8 \u05DC\u05E2\u05E1\u05E7\u05D4'}</Text>
              <Text style={styles.sectionSubtitle}>{'\u05E1\u05E4\u05E7 \u05E8\u05E9\u05D5\u05DD'}</Text>
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
                  <Text style={styles.whatsappBadgeText}>WhatsApp {'\u05E4\u05E2\u05D9\u05DC'}</Text>
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
            <Text style={styles.sectionTitle}>{'\u05E0\u05E1\u05E4\u05D7\u05D9\u05DD \u05D5\u05E7\u05D1\u05DC\u05D5\u05EA'}</Text>
            <Text style={styles.sectionSubtitle}>
              {expense.receiptImages?.length || 0} {'\u05E7\u05D1\u05E6\u05D9\u05DD'}
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
                <Text style={styles.addImageText}>{'\u05D4\u05D5\u05E1\u05E3 \u05E0\u05E1\u05E4\u05D7'}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.noImages}>
              <View style={styles.noImagesIcon}>
                <MaterialIcons name="no-photography" size={40} color={colors.textTertiary} />
              </View>
              <Text style={styles.noImagesText}>
                {'\u05DC\u05D0 \u05E6\u05D5\u05E8\u05E3 \u05EA\u05D9\u05E2\u05D5\u05D3 \u05D5\u05D9\u05D6\u05D5\u05D0\u05DC\u05D9'}
              </Text>
              <TouchableOpacity
                style={styles.addReceiptBtn}
                onPress={() => onNavigate(AppScreen.EDIT_ACTIVITY, expense.id)}
              >
                <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
                <Text style={styles.addReceiptText}>{'\u05D4\u05D5\u05E1\u05E3 \u05E7\u05D1\u05DC\u05D4 \u05E2\u05DB\u05E9\u05D9\u05D5'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Audit Trail */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{'\u05D9\u05D5\u05DE\u05DF \u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05D1\u05D9\u05E7\u05D5\u05E8\u05EA'}</Text>
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
              <Text style={styles.auditTitle}>{'\u05E0\u05D5\u05E6\u05E8 \u05E2\u05DC \u05D9\u05D3\u05D9 \u05D4\u05DE\u05E0\u05D4\u05DC'}</Text>
              <Text style={styles.auditDate}>{expense.date} {'\u2022'} 10:45</Text>
              <View style={styles.auditNote}>
                <Text style={styles.auditNoteText}>
                  {'\u05D4\u05E4\u05E2\u05D5\u05DC\u05D4 \u05E0\u05D5\u05E1\u05E4\u05D4 \u05DC\u05DE\u05E2\u05E8\u05DB\u05EA \u05D5\u05E9\u05D5\u05D9\u05D9\u05DB\u05D4 \u05DC\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 '}
                  {expense.projectName || '\u05D4\u05DE\u05E8\u05DB\u05D6\u05D9'}.
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
                    {entry.date} {'\u2022'} {entry.time || '14:20'}
                  </Text>
                  <View style={styles.auditNote}>
                    {entry.oldValue && entry.newValue ? (
                      <View>
                        <Text style={styles.changeLabel}>{'\u05E9\u05D9\u05E0\u05D5\u05D9 \u05D1\u05E2\u05E8\u05DA:'}</Text>
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
                <Text style={styles.auditTitle}>{'\u05EA\u05D9\u05E2\u05D5\u05D3 \u05D4\u05D5\u05DB\u05D7\u05EA \u05EA\u05E9\u05DC\u05D5\u05DD'}</Text>
                <Text style={styles.auditDate}>
                  {expense.date} {'\u2022'} {expense.time || '10:46'}
                </Text>
                <Text style={styles.verifiedText}>Verified Secure Scan</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <GradientButton
            label="\u05E2\u05E8\u05D5\u05DA"
            variant="outline"
            onPress={() => onNavigate(AppScreen.EDIT_ACTIVITY, expense.id)}
            style={styles.actionBtn}
          />
          <GradientButton
            label="\u05DE\u05D7\u05E7"
            variant="danger"
            onPress={handleDeleteProject}
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
});

export default ActivityDetail;
