// AdminLayout — sidebar + scrollable content area.
// Wraps all admin BO screens. Lives in /v2/ but rendered only when current screen is admin_*.
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen } from '@monn/shared';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { colors, spacing } from '../../theme';

interface AdminLayoutProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onExit: () => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentScreen, onNavigate, onExit, children }: AdminLayoutProps) {
  return (
    <View style={styles.shell}>
      {/* Ambient backdrop just for admin */}
      <LinearGradient
        colors={['rgba(0,217,217,0.10)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(185,103,255,0.10)']}
        start={{ x: 0.4, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <AdminSidebar currentScreen={currentScreen} onNavigate={onNavigate} onExit={onExit} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row-reverse',
    backgroundColor: colors.bgPrimary,
  },
  content: { flex: 1 },
  contentInner: {
    padding: spacing['2xl'],
    gap: spacing.lg,
    maxWidth: 1280,
    width: '100%',
  },
});
