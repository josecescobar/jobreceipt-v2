import React, { useState, useMemo } from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCreateCustomer } from '../../src/hooks/useCustomers';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function CreateCustomerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createCustomer = useCreateCustomer();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    setError('');

    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: zip.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Customer" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. John Smith"
            error={error && !name.trim() ? error : undefined}
          />

          <Input
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Smith Construction"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="customer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />

          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St"
          />

          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Springfield"
          />

          <Input
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="IL"
            autoCapitalize="characters"
          />

          <Input
            label="ZIP Code"
            value={zip}
            onChangeText={setZip}
            placeholder="62701"
            keyboardType="number-pad"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this customer..."
            multiline
            numberOfLines={3}
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Customer"
            onPress={handleSubmit}
            loading={createCustomer.isPending}
            disabled={!name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
