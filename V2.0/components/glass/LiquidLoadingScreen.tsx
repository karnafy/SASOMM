// Liquid loading screen — pulsing logo + animated progress bar
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radii, gradients } from '../../theme';

export default function LiquidLoadingScreen() {
  const scale = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0,  duration: 1100, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(slide, { toValue: 1, duration: 1800, useNativeDriver: true }),
    ).start();
  }, [scale, slide]);

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-64, 160] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/logo-sasomm.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFillWrap, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={gradients.glowFill as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.barFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.text}>טוען נתונים...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  logoWrap: {
    ...Platform.select({
      ios: { shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30 },
      android: { elevation: 20 },
      web: {
        // @ts-ignore web-only
        filter: 'drop-shadow(0 0 30px rgba(0,217,217,0.5)) drop-shadow(0 0 12px rgba(185,103,255,0.3))',
      } as any,
    }),
  },
  logo: { width: 140, height: 140 },
  barTrack: {
    width: 160, height: 4, borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
  },
  barFillWrap: {
    position: 'absolute', top: 0, bottom: 0, width: 64,
  },
  barFill: {
    width: '100%', height: '100%',
    borderRadius: radii.full,
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(0,217,217,0.5)' } as any,
      ios: { shadowColor: '#00D9D9', shadowOpacity: 0.6, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    letterSpacing: 0.5,
  },
});
