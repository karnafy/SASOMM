// Google sign-in button — white pill with official G mark + press animation
import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { radii, fonts } from '../../theme';

interface GoogleSignInButtonProps {
  onPress?: () => void;
  label?: string;
}

export function GoogleSignInButton({ onPress, label = 'המשך עם Google' }: GoogleSignInButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.btn}>
        <Svg width={20} height={20} viewBox="0 0 48 48">
          <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
          <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </Svg>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 14px rgba(0,0,0,0.3)' } as any,
    }),
  },
  text: {
    color: '#1F1F1F',
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 14,
  },
});
