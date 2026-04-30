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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@monn/shared';
import { colors, radii, spacing, fonts } from '../theme';

const SHARE_URL = 'https://sasomm.com';
const SHARE_MESSAGE = 'תכיר את SASOMM — אפליקציית ניהול פיננסי לפרויקטים. נסה אותה כאן: ';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface TopHeaderProps {
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

const menuItems: { label: string; icon: IconName; screen: AppScreen }[] = [
  { label: 'איזור אישי', icon: 'person', screen: AppScreen.PERSONAL_AREA },
  { label: 'כל הפרויקטים', icon: 'folder-special', screen: AppScreen.PROJECTS },
  { label: 'ספקים ואנשי קשר', icon: 'people', screen: AppScreen.SUPPLIERS },
  { label: 'תבניות קבועות', icon: 'event-repeat', screen: AppScreen.RECURRING_TEMPLATES },
  { label: 'מרכז הדו"חות', icon: 'analytics', screen: AppScreen.REPORTS_CENTER },
  { label: 'הגדרות', icon: 'settings', screen: AppScreen.SETTINGS },
];

export default function TopHeader({ onNavigate, onLogout }: TopHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleShareApp = async () => {
    setIsMenuOpen(false);
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
            window.alert('הקישור הועתק ללוח. אפשר להדביק עכשיו לאן שתרצה.');
          }
          return;
        } catch {
          // fall through
        }
      }
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('העתק את הקישור:', fullMessage);
      }
      return;
    }

    try {
      await Share.share({ message: fullMessage, url: SHARE_URL, title: 'SASOMM' });
    } catch (err: any) {
      Alert.alert('שגיאה', 'לא הצלחנו לפתוח את חלון השיתוף');
    }
  };

  return (
    <>
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <View style={styles.menuCardWrapper}>
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>{'תפריט ניהול'}</Text>
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuRow}
                  onPress={() => {
                    setIsMenuOpen(false);
                    onNavigate(item.screen);
                  }}
                >
                  <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                  <Text style={styles.menuRowLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={handleShareApp}
              >
                <MaterialIcons name="share" size={20} color={colors.primary} />
                <Text style={styles.menuRowLabel}>
                  {'שלח קישור לאפליקציה'}
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
                  {'התנתקות'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => setIsMenuOpen(true)}
        >
          <MaterialIcons name="menu" size={22} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoTouchable}
          onPress={() => onNavigate(AppScreen.DASHBOARD)}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/logo-sasomm.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.transparent,
  },
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
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
