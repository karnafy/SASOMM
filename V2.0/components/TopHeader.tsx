import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Share,
  Alert,
  I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppScreen, getCurrentLocale, isRTL, useAuth, isAdmin } from '@monn/shared';
import { LanguagePicker } from './ui/LanguagePicker';
import { colors, radii, spacing, fonts } from '../theme';

const SHARE_URL = 'https://sasomm.com';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface TopHeaderProps {
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

const menuItemsConfig: { tKey: string; icon: IconName; screen: AppScreen }[] = [
  { tKey: 'menu.personal_area', icon: 'person', screen: AppScreen.PERSONAL_AREA },
  { tKey: 'menu.all_projects', icon: 'folder-special', screen: AppScreen.PROJECTS },
  { tKey: 'menu.suppliers_contacts', icon: 'people', screen: AppScreen.SUPPLIERS },
  { tKey: 'menu.recurring_templates', icon: 'event-repeat', screen: AppScreen.RECURRING_TEMPLATES },
  { tKey: 'menu.reports_center', icon: 'analytics', screen: AppScreen.REPORTS_CENTER },
  { tKey: 'menu.settings', icon: 'settings', screen: AppScreen.SETTINGS },
];

export default function TopHeader({ onNavigate, onLogout }: TopHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLocale = getCurrentLocale();
  const isAdminUser = isAdmin(user as any);

  const handleShareApp = async () => {
    setIsMenuOpen(false);
    const SHARE_MESSAGE = t('menu.share_message');
    const fullMessage = `${SHARE_MESSAGE}${SHARE_URL}`;

    if (Platform.OS === 'web') {
      const navAny = (typeof navigator !== 'undefined' ? (navigator as any) : null);
      // Mobile Chrome / Safari supports Web Share; desktop falls back to clipboard
      if (navAny?.share) {
        try {
          await navAny.share({ title: 'SASOMM', text: SHARE_MESSAGE, url: SHARE_URL });
          return;
        } catch {
          // user cancelled — silently ignore
          return;
        }
      }
      if (navAny?.clipboard?.writeText) {
        try {
          await navAny.clipboard.writeText(fullMessage);
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(t('menu.share_copied'));
          }
          return;
        } catch {
          // fall through
        }
      }
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt(`${t('common.ok')}:`, fullMessage);
      }
      return;
    }

    try {
      await Share.share({ message: fullMessage, url: SHARE_URL, title: 'SASOMM' });
    } catch (err: any) {
      Alert.alert(t('common.error'), t('menu.share_error'));
    }
  };

  return (
    <>
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <View style={styles.menuCardWrapper}>
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>{t('menu.title')}</Text>
              {menuItemsConfig.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuRow}
                  onPress={() => {
                    setIsMenuOpen(false);
                    onNavigate(item.screen);
                  }}
                >
                  <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                  <Text style={styles.menuRowLabel}>{t(item.tKey)}</Text>
                </TouchableOpacity>
              ))}

              {isAdminUser && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={() => {
                      setIsMenuOpen(false);
                      onNavigate(AppScreen.ADMIN_OVERVIEW);
                    }}
                  >
                    <MaterialIcons name="admin-panel-settings" size={20} color="#B967FF" />
                    <Text style={[styles.menuRowLabel, { color: '#B967FF' }]}>
                      ניהול מערכת (BO)
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={handleShareApp}
              >
                <MaterialIcons name="share" size={20} color={colors.primary} />
                <Text style={styles.menuRowLabel}>
                  {t('menu.share_app')}
                </Text>
              </TouchableOpacity>

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
                  {t('menu.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Language quick-switcher modal */}
      <Modal visible={isLangOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsLangOpen(false)}>
          <View style={styles.langCardWrapper}>
            <Pressable style={styles.langCard}>
              <Text style={styles.menuTitle}>{t('language.title')}</Text>
              <LanguagePicker variant="inline" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLogoSlot}
          onPress={() => onNavigate(AppScreen.DASHBOARD)}
          onLongPress={isAdminUser ? () => onNavigate(AppScreen.ADMIN_OVERVIEW) : undefined}
          delayLongPress={800}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/logo-sasomm.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerClusterSlot}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setIsLangOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="language" size={20} color={colors.white} />
            <Text style={styles.langButtonText}>{currentLocale.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => setIsMenuOpen(true)}
          >
            <MaterialIcons name="menu" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'flex-start',
  },
  menuCardWrapper: {
    marginTop: 70,
    marginLeft: spacing.lg,
    width: 260,
  },
  menuCard: {
    backgroundColor: 'rgba(22,26,38,0.92)',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.3)',
    ...(Platform.OS === 'web' ? {
      // @ts-ignore web-only
      backdropFilter: 'blur(30px) saturate(180%)',
      WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,217,217,0.15)',
    } as any : {}),
  },
  menuTitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
    color: colors.white,
    writingDirection: 'rtl',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.subtleBorder,
    marginVertical: spacing.md,
  },
  header: {
    position: 'relative',
    height: 68,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.transparent,
  },
  // RN auto-flips left/right in RTL native — counteract so the logo
  // stays visually on the LEFT and the cluster on the RIGHT in both
  // Hebrew (RTL) and English/French (LTR).
  headerLogoSlot: {
    position: 'absolute',
    [I18nManager.isRTL ? 'right' : 'left']: spacing.xl,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  } as any,
  headerClusterSlot: {
    position: 'absolute',
    [I18nManager.isRTL ? 'left' : 'right']: spacing.xl,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as any,
  logoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 44,
  },
  hamburger: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,217,217,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(0,217,217,0.15)' } as any : {}),
  },
  headerLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,217,217,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.3)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(0,217,217,0.15)' } as any : {}),
  },
  langButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  langCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  langCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 280,
    alignItems: 'center',
    gap: spacing.md,
  },
});
