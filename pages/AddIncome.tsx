// AddIncome is handled by AddExpense with initialType='income'.
// This file exists for backward compatibility but delegates to AddExpense.
// When navigating to ADD_INCOME, the App.tsx should render AddExpense
// with the initialType prop set to 'income'.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppScreen } from '@monn/shared';
import { colors } from '../theme';

interface AddIncomeProps {
  onNavigate: (screen: AppScreen) => void;
}

const AddIncome: React.FC<AddIncomeProps> = ({ onNavigate }) => {
  // Immediately redirect to AddExpense in income mode.
  // In practice, App.tsx should handle this routing directly
  // by rendering <AddExpense initialType="income" ... /> when
  // the current screen is AppScreen.ADD_INCOME.
  React.useEffect(() => {
    onNavigate(AppScreen.ADD_EXPENSE);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{'\u05DE\u05E2\u05D1\u05D9\u05E8 \u05DC\u05D8\u05D5\u05E4\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4...'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
});

export default AddIncome;
