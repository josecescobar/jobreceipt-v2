import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import {
  useSubcontractor,
  useUpdateSubcontractor,
  useDeleteSubcontractor,
} from '../../../src/hooks/useSubcontractors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

export default function EditSubcontractorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: sub, isLoading } = useSubcontractor(id ?? '');
  const updateSub = useUpdateSubcontractor();
  const deleteSub = useDeleteSubcontractor();

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (sub && !loaded) {
      setName(sub.name || '');
      setCompanyName(sub.companyName || '');
      setPhone(sub.phone || '');
      setEmail(sub.email || '');
      setAddress(sub.address || '');
      setTrade(sub.trade || '');
      setLicenseNumber(sub.licenseNumber || '');
      setInsuranceExpiry(sub.insuranceExpiry ? sub.insuranceExpiry.split('T')[0] : '');
      setW9Received(sub.w9Received ?? false);
      setNotes(sub.notes || '');
      setLoaded(true);
    }
  }, [sub, loaded]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');

    try {
      await updateSub.mutateAsync({
        id: id!,
        updates: {
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
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subcontractor');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Subcontractor', 'Are you sure you want to delete this subcontractor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSub.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete subcontractor');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !sub) {
    return (
      <Screen padded={false}>
        <Header title="Edit Subcontractor" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Subcontractor not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Subcontractor" showBack />
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
            title="Save Changes"
            onPress={handleSave}
            loading={updateSub.isPending}
            disabled={!name.trim()}
          />

          <Button
            title="Delete Subcontractor"
            onPress={handleDelete}
            variant="danger"
            loading={deleteSub.isPending}
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
    deleteButton: {
      marginTop: spacing.md,
    },
  });
