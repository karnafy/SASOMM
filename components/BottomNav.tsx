import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '@monn/shared';
import { colors, neuRaisedLg, radii } from '../theme';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const navItems: {
  screen: AppScreen | null;
  icon: IconName;
  label: string;
  isCenter?: boolean;
}[] = [
  { screen: AppScreen.DASHBOARD, icon: 'home', label: 'בית' },
  { screen: AppScreen.SUPPLIERS, icon: 'people', label: 'ספקים' },
  { screen: null, icon: 'add', label: 'הוספה', isCenter: true },
  { screen: AppScreen.PROJECTS, icon: 'folder', label: 'פרויקטים' },
  { screen: AppScreen.DEBTS, icon: 'account-balance-wallet', label: 'חייבים' },
];

const quickActions: { screen: AppScreen; icon: IconName; label: string; color: string }[] = [
  { screen: AppScreen.ADD_PROJECT, icon: 'create-new-folder', label: 'פרויקט', color: colors.primary },
  { screen: AppScreen.ADD_EXPENSE, icon: 'remove-circle', label: 'הוצאה', color: colors.error },
  { screen: AppScreen.ADD_INCOME, icon: 'add-circle', label: 'הכנסה', color: colors.success },
  { screen: AppScreen.ADD_SUPPLIER, icon: 'person-add', label: 'ספק', color: colors.info },
];

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
            <View style={[styles.quickActionsCard, neuRaisedLg]}>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.screen}
                    style={styles.quickActionItem}
                    onPress={() => handleAction(action.screen)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: colors.neuBg }, neuRaisedLg]}>
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
        <View style={[styles.navBar, neuRaisedLg]}>
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.centerButton}
                  onPress={() => setIsMenuOpen(!isMenuOpen)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={isMenuOpen ? 'close' : 'add'}
                    size={28}
                    color={colors.white}
                  />
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
                <View style={[styles.navIconWrap, isActive && styles.navIconActive]}>
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
  },
  quickActionsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  quickActionsCard: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
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
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  navBar: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navIconWrap: {
    padding: 8,
    borderRadius: radii.xl,
  },
  navIconActive: {
    backgroundColor: colors.neuBg,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  navLabelActive: {
    color: colors.primary,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    backgroundColor: colors.primary,
  },
});
