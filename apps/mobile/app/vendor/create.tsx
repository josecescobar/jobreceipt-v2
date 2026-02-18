import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCreateVendor } from '../../src/hooks/useVendors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials' },
  { key: 'LABOR', label: 'Labor' },
  { key: 'EQUIPMENT', label: 'Equipment' },
  { key: 'SUBCONTRACTOR', label: 'Subcontractor' },
  { key: 'OVERHEAD', label: 'Overhead' },
];

export default function CreateVendorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createVendor = useCreateVendor();

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vendor name is required');
      return;
    }
    setError('');

    try {
      await createVendor.mutateAsync({
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        defaultCategory: defaultCategory || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create vendor');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Vendor" showBack />
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
            placeholder="e.g. Home Depot"
            error={error && !name.trim() ? error : undefined}
          />

          <Input
            label="Contact Name"
            value={contactName}
            onChangeText={setContactName}
            placeholder="e.g. John Smith"
          />

          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="vendor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, ST 12345"
            multiline
            numberOfLines={2}
          />

          <Input
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="www.example.com"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Default Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = defaultCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setDefaultCategory(defaultCategory === cat.key ? '' : cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this vendor..."
            multiline
            numberOfLines={3}
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Vendor"
            onPress={handleSubmit}
            loading={createVendor.isPending}
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
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
