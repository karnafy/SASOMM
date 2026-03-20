import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../theme';

interface AvatarCircleProps {
  name: string;
  size?: number;
  gradientColors?: [string, string];
  imageUri?: string;
}

function extractInitials(name: string): string {
  // Extract first 2 Hebrew (or any) characters from the name, skipping spaces
  const chars = name.replace(/\s/g, '');
  if (chars.length === 0) return '??';
  if (chars.length === 1) return chars[0];
  return chars[0] + chars[1];
}

export function AvatarCircle({
  name,
  size = 44,
  gradientColors = ['#6B2FA0', '#8B6BAB'],
  imageUri,
}: AvatarCircleProps) {
  const borderRadius = size / 2;
  const fontSize = Math.round(size * 0.36);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, { width: size, height: size, borderRadius }]}
    >
      <Text style={[styles.initials, { fontSize }]}>
        {extractInitials(name)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});
