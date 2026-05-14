import React from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts, radii } from '../../theme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}: FormFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        style={[styles.input, error ? styles.inputError : null]}
        textAlign="right"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.semibold,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.regular,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'right',
  },
  inputError: {
    borderColor: 'rgba(255,77,106,0.3)',
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'right',
  },
});
