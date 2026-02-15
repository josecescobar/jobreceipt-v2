import React from 'react';
import { Screen, Header } from '../../src/components/layout';
import { QuickAddJobForm } from '../../src/components/jobs';

export default function CreateJobScreen() {
  return (
    <Screen padded={false}>
      <Header title="Add Job" showBack />
      <QuickAddJobForm />
    </Screen>
  );
}
