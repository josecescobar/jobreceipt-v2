import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateSubcontractor } from '../../src/hooks/useSubcontractors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CreateSubcontractorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createSub = useCreateSubcontractor();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [trade, setTrade] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [w9Received, setW9Received] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');

    try {
      await createSub.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        trade: trade.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        insuranceExpiry: insuranceExpiry || undefined,
        w9Received,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subcontractor');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Subcontractor" showBack />
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
            placeholder="e.g. Mike Johnson"
            error={error && !name.trim() ? error : undefined}
          />

          <Input
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Johnson Plumbing LLC"
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
            placeholder="sub@example.com"
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
            label="Trade"
            value={trade}
            onChangeText={setTrade}
            placeholder="e.g. Plumbing, Electrical, HVAC"
          />

          <Input
            label="License Number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="e.g. LIC-12345"
          />

          <DatePickerField
            label="Insurance Expiry"
            value={insuranceExpiry}
            onChange={setInsuranceExpiry}
            placeholder="Select expiry date"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>W-9 Received</Text>
              <Text style={styles.switchSubtitle}>Has submitted a W-9 form</Text>
            </View>
            <Switch
              value={w9Received}
              onValueChange={setW9Received}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
            />
          </View>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Subcontractor"
            onPress={handleSubmit}
            loading={createSub.isPending}
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    switchInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    switchLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    switchSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
