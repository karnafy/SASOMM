import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface TransactionRowProps {
  icon: string;
  iconColor: string;
  title: string;
  meta: string;
  amount: string;
  isIncome: boolean;
  onPress?: () => void;
}

export function TransactionRow({
  icon,
  iconColor,
  title,
  meta,
  amount,
  isIncome,
  onPress,
}: TransactionRowProps) {
  const amountColor = isIncome ? colors.success : colors.error;

  const content = (
    <View style={styles.row}>
      <View style={[styles.iconContainer, { borderColor: iconColor + '30' }]}>
        <MaterialIcons name={icon as IconName} size={18} color={iconColor} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>{amount}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.separator, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.separator}>{content}</View>;
}

const styles = StyleSheet.create({
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'right',
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'right',
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    textAlign: 'left',
  },
});
