import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>{'💰'}</Text>
        </View>
        <Text style={styles.title}>MONNY</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>טוען נתונים...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
