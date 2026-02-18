import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input } from '../../../src/components/ui';
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../../../src/hooks/useCustomers';
import { useTheme, type ThemeColors, spacing } from '../../../src/theme';

export default function EditCustomerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(id ?? '');
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (customer && !loaded) {
      setName(customer.name || '');
      setCompanyName(customer.companyName || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || '');
      setZip(customer.zip || '');
      setNotes(customer.notes || '');
      setLoaded(true);
    }
  }, [customer, loaded]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    setError('');

    try {
      await updateCustomer.mutateAsync({
        id: id!,
        updates: {
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zip: zip.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete customer');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !customer) {
    return (
      <Screen padded={false}>
        <Header title="Edit Customer" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Customer not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Customer" showBack />
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
            title="Save Changes"
            onPress={handleSave}
            loading={updateCustomer.isPending}
            disabled={!name.trim()}
          />

          <Button
            title="Delete Customer"
            onPress={handleDelete}
            variant="danger"
            loading={deleteCustomer.isPending}
            style={styles.deleteButton}
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
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    deleteButton: {
      marginTop: spacing.md,
    },
  });
