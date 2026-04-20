import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  supplier?: string;
  dateTime?: string;
  typeLabel?: string;
  typeColor?: string;
  attachmentCount?: number;
  firstAttachmentUri?: string;
  onAttachmentPress?: () => void;
}

export function TransactionRow({
  icon,
  iconColor,
  title,
  meta,
  amount,
  isIncome,
  onPress,
  supplier,
  dateTime,
  typeLabel,
  typeColor,
  attachmentCount,
  firstAttachmentUri,
  onAttachmentPress,
}: TransactionRowProps) {
  const amountColor = isIncome ? colors.success : colors.error;
  const useStructured = Boolean(supplier || dateTime);
  const hasAttachment = Boolean(attachmentCount && attachmentCount > 0);

  const content = (
    <View style={styles.row}>
      <View style={[styles.iconContainer, { borderColor: iconColor + '30' }]}>
        <MaterialIcons name={icon as IconName} size={18} color={iconColor} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleLine}>
          {typeLabel ? (
            <View
              style={[
                styles.typeChip,
                { backgroundColor: (typeColor || iconColor) + '1A' },
              ]}
            >
              <Text
                style={[styles.typeChipText, { color: typeColor || iconColor }]}
              >
                {typeLabel}
              </Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {useStructured ? (
          <>
            {supplier ? (
              <Text style={styles.supplier} numberOfLines={1}>
                {supplier}
              </Text>
            ) : null}
            {dateTime ? (
              <Text style={styles.meta} numberOfLines={1}>
                {dateTime}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>

      {hasAttachment ? (
        <Pressable
          onPress={(e) => {
            (e as any)?.stopPropagation?.();
            onAttachmentPress?.();
          }}
          style={({ pressed }) => [
            styles.attachmentWrap,
            pressed && styles.pressed,
          ]}
        >
          {firstAttachmentUri ? (
            <Image
              source={{ uri: firstAttachmentUri }}
              style={styles.attachmentThumb}
            />
          ) : (
            <View style={styles.attachmentIconBox}>
              <MaterialIcons
                name="attach-file"
                size={18}
                color={colors.primary}
              />
            </View>
          )}
          {attachmentCount && attachmentCount > 1 ? (
            <View style={styles.attachmentBadge}>
              <Text style={styles.attachmentBadgeText}>
                +{attachmentCount - 1}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

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
  titleLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeChipText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    writingDirection: 'rtl',
  },
  attachmentWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  attachmentThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  attachmentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentBadgeText: {
    color: colors.bgPrimary,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 1,
  },
  supplier: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 3,
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
