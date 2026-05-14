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
      <Text style={styles.text}>{'מעביר לטופס הכנסה...'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
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
