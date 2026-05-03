import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AppScreen } from '@monn/shared';
import { colors, fonts, glowFab, radii } from '../theme';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: {
    screen: AppScreen | null;
    icon: IconName;
    label: string;
    isCenter?: boolean;
  }[] = [
    { screen: AppScreen.DASHBOARD, icon: 'home', label: t('nav.home') },
    { screen: AppScreen.SUPPLIERS, icon: 'people', label: t('nav.suppliers') },
    { screen: null, icon: 'add', label: t('actions.add_expense'), isCenter: true },
    { screen: AppScreen.PROJECTS, icon: 'folder', label: t('nav.projects') },
    { screen: AppScreen.DEBTS, icon: 'account-balance-wallet', label: t('nav.debts') },
  ];

  const quickActions: { screen: AppScreen; icon: IconName; label: string; color: string }[] = [
    { screen: AppScreen.ADD_PROJECT, icon: 'create-new-folder', label: t('quick.new_project'), color: colors.primary },
    { screen: AppScreen.ADD_EXPENSE, icon: 'remove-circle', label: t('actions.expense'), color: colors.error },
    { screen: AppScreen.ADD_INCOME, icon: 'add-circle', label: t('actions.income'), color: colors.success },
    { screen: AppScreen.ADD_SUPPLIER, icon: 'person-add', label: t('quick.new_supplier'), color: colors.info },
  ];
  const insets = useSafeAreaInsets();
  const isSuppliersActive = currentScreen === AppScreen.SUPPLIERS || currentScreen === AppScreen.CONTACTS;

  const handleAction = (screen: AppScreen) => {
    setIsMenuOpen(false);
    onNavigate(screen);
  };

  return (
    <>
      {/* Quick Actions Modal */}
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)}>
          <View style={[styles.quickActionsContainer, { bottom: 100 + insets.bottom }]}>
            <View style={styles.quickActionsCard}>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.screen}
                    style={styles.quickActionItem}
                    onPress={() => handleAction(action.screen)}
                  >
                    <View
                      style={[
                        styles.quickActionIcon,
                        { backgroundColor: action.color + '26' },
                      ]}
                    >
                      <MaterialIcons name={action.icon} size={22} color={action.color} />
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={[styles.navContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.navBar}>
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.centerButtonWrap}
                  onPress={() => setIsMenuOpen(!isMenuOpen)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.centerButton, glowFab]}
                  >
                    <MaterialIcons
                      name={isMenuOpen ? 'close' : 'add'}
                      size={26}
                      color={colors.white}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            const isActive = item.screen === AppScreen.SUPPLIERS
              ? isSuppliersActive
              : currentScreen === item.screen;

            return (
              <TouchableOpacity
                key={index}
                style={styles.navItem}
                onPress={() => item.screen && onNavigate(item.screen)}
              >
                {isActive && <View style={styles.activeGlowDot} />}
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  quickActionsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  quickActionsCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.lg,
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBar: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  activeGlowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 9,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
  },
  navLabelActive: {
    color: colors.primary,
  },
  centerButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
