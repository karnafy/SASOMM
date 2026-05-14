import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

type SkeletonVariant = 'card' | 'row' | 'pill';

interface SkeletonCardProps {
  height?: number;
  variant?: SkeletonVariant;
}

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

function SkeletonRect({ width, height, style }: { width?: number | string; height: number; style?: object }) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={[
        styles.rect,
        { width: width ?? '100%', height, opacity },
        style,
      ]}
    />
  );
}

function CardVariant({ height }: { height: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <SkeletonRect height={14} width="60%" />
      <SkeletonRect height={10} width="40%" style={{ marginTop: 10 }} />
      <SkeletonRect height={10} width="80%" style={{ marginTop: 8 }} />
    </View>
  );
}

function RowVariant() {
  return (
    <View style={styles.row}>
      <SkeletonRect width={36} height={36} style={{ borderRadius: 10 }} />
      <View style={styles.rowTextBlock}>
        <SkeletonRect height={12} width="55%" />
        <SkeletonRect height={10} width="35%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

function PillVariant() {
  return (
    <View style={styles.pill}>
      <SkeletonRect height={14} width="70%" style={{ borderRadius: radii.full }} />
    </View>
  );
}

export function SkeletonCard({ height = 100, variant = 'card' }: SkeletonCardProps) {
  if (variant === 'row') return <RowVariant />;
  if (variant === 'pill') return <PillVariant />;
  return <CardVariant height={height} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  rect: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 60,
    gap: 12,
    paddingHorizontal: 4,
  },
  rowTextBlock: {
    flex: 1,
    gap: 0,
    alignItems: 'flex-end',
  },
  pill: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
