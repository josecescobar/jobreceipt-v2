import React from 'react';
import { Screen, Header } from '../../src/components/layout';
import { ManualExpenseForm } from '../../src/components/expenses';

export default function CreateExpenseScreen() {
  return (
    <Screen padded={false}>
      <Header title="Add Expense" showBack />
      <ManualExpenseForm />
    </Screen>
  );
}
