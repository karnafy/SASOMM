import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@monn/shared';
import { colors, radii, spacing, fonts } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface TopHeaderProps {
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

const menuItems: { label: string; icon: IconName; screen: AppScreen }[] = [
  { label: 'איזור אישי', icon: 'person', screen: AppScreen.PERSONAL_AREA },
  { label: 'כל הפרויקטים', icon: 'folder-special', screen: AppScreen.PROJECTS },
  { label: 'ספקים ואנשי קשר', icon: 'people', screen: AppScreen.SUPPLIERS },
  { label: 'מרכז הדו"חות', icon: 'analytics', screen: AppScreen.REPORTS_CENTER },
  { label: 'הגדרות', icon: 'settings', screen: AppScreen.SETTINGS },
];

export default function TopHeader({ onNavigate, onLogout }: TopHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            source={require('../assets/logo-icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>MONNY</Text>
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
  logoIcon: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontSize: 28,
    fontFamily: fonts.extrabold,
    color: colors.white,
    marginLeft: 10,
    letterSpacing: 1,
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
