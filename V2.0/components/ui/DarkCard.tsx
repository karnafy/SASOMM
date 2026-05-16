// V2.0 DarkCard — Liquid Glass dark card with press animation.
// Same API as v1.
// New: blur + cyan tinted border + layered shadow on press.
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, blurIntensity } from '../../theme';

interface DarkCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}

export function DarkCard({ children, style, onPress }: DarkCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.timing(glowAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const flatStyle = StyleSheet.flatten(style) ?? {};
  const radius =
    typeof flatStyle.borderRadius === 'number' ? flatStyle.borderRadius : radii.lg;

  const content = (
    <>
      <BlurView
        intensity={blurIntensity.subtle}
        tint="dark"
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: colors.glassFallback, borderRadius: radius },
        ]}
      />
      <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={
          style && (style as ViewStyle).flex
            ? { flex: (style as ViewStyle).flex }
            : undefined
        }
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.card,
            { borderRadius: radius },
            style,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderRadius: radius }, style]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.18)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
      web: {
        // @ts-ignore — web-only
        boxShadow:
          '0 4px 14px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)',
      } as any,
    }),
  },
});
