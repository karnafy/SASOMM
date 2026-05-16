// Admin BO sidebar — 7 active screens
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ITEMS: { screen: AppScreen; label: string; icon: IconName }[] = [
  { screen: AppScreen.ADMIN_OVERVIEW,      label: 'סקירה',         icon: 'dashboard' },
  { screen: AppScreen.ADMIN_USERS,         label: 'משתמשים',       icon: 'people' },
  { screen: AppScreen.ADMIN_MESSAGES,      label: 'הודעות',        icon: 'chat-bubble-outline' },
  { screen: AppScreen.ADMIN_FEEDBACK_TODO, label: 'משוב ומשימות',  icon: 'feedback' },
  { screen: AppScreen.ADMIN_FINANCIALS,    label: 'רווח והפסד',    icon: 'attach-money' },
  { screen: AppScreen.ADMIN_REPORTS,       label: 'דוחות וייצוא',  icon: 'file-download' },
  { screen: AppScreen.ADMIN_SYSTEM,        label: 'מערכת',         icon: 'settings' },
];

interface AdminSidebarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onExit: () => void;
}

export function AdminSidebar({ currentScreen, onNavigate, onExit }: AdminSidebarProps) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Image source={require('../../assets/logo-sasomm.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandLabel}>Admin BO</Text>
      </View>

      <View style={styles.itemsWrap}>
        {ITEMS.map((item) => {
          const active = currentScreen === item.screen ||
            (item.screen === AppScreen.ADMIN_USERS && currentScreen === AppScreen.ADMIN_USER_DETAIL);
          return (
            <Pressable
              key={item.screen}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onNavigate(item.screen)}
            >
              <MaterialIcons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.exitBtn} onPress={onExit}>
        <MaterialIcons name="exit-to-app" size={18} color={colors.textSecondary} />
        <Text style={styles.exitLabel}>צא ממצב מנהל</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: 'rgba(8,9,15,0.85)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,217,217,0.15)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: {
        // @ts-ignore web-only
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      } as any,
      default: {},
    }),
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  logo: { width: 28, height: 28 },
  brandLabel: {
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  itemsWrap: { gap: 4, flex: 1 },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: {
    backgroundColor: 'rgba(0,217,217,0.1)',
    borderColor: 'rgba(0,217,217,0.4)',
    ...Platform.select({
      web: { boxShadow: '0 0 16px rgba(0,217,217,0.25), inset 0 0 16px rgba(0,217,217,0.05)' } as any,
      default: {},
    }),
  },
  label: {
    flex: 1,
    textAlign: 'right',
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  labelActive: { color: colors.primary, fontFamily: fonts.bold, fontWeight: '700' },
  exitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: spacing.md,
  },
  exitLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
