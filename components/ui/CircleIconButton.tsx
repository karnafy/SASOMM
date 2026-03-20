import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface CircleIconButtonProps {
  icon: string;
  color: string;
  size?: number;
  label?: string;
  onPress: () => void;
}

export function CircleIconButton({
  icon,
  color,
  size = 48,
  label,
  onPress,
}: CircleIconButtonProps) {
  const iconSize = Math.round(size * 0.45);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + '26', // 0.15 opacity ≈ hex 26
          },
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name={icon as IconName} size={iconSize} color={color} />
      </Pressable>

      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: 'center',
  },
});
