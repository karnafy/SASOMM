import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Image } from 'react-native';
import { colors, fonts } from '../theme';

export default function LoadingScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoBoxWrapper,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Image
            source={require('../assets/logo-sasomm.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>{'טוען נתונים...'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoBoxWrapper: {
    marginBottom: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
