import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateJob } from '../../src/hooks/useJobs';
import { useJobTemplates, useJobTemplate } from '../../src/hooks/useJobTemplates';
import { dollarsToCents, centsToDollars, formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CreateJobScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const createJob = useCreateJob();

  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [materialsBudget, setMaterialsBudget] = useState('');
  const [laborBudget, setLaborBudget] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | undefined>(templateId);

  // Fetch templates for picker
  const { data: templatesData, isLoading: templatesLoading } = useJobTemplates();
  const templates = useMemo(
    () => templatesData?.pages?.flatMap((p) => p.data) ?? [],
    [templatesData],
  );

  // Fetch selected template detail
  const { data: selectedTemplate } = useJobTemplate(appliedTemplateId ?? '');

  // Apply template data when it loads
  useEffect(() => {
    if (selectedTemplate) {
      setName(selectedTemplate.name);
      setCustomerName(selectedTemplate.customerName || '');
      setTotalBudget(
        selectedTemplate.budgetTotal != null
          ? centsToDollars(selectedTemplate.budgetTotal).toString()
          : '',
      );
      setMaterialsBudget(
        selectedTemplate.budgetMaterials != null
          ? centsToDollars(selectedTemplate.budgetMaterials).toString()
          : '',
      );
      setLaborBudget(
        selectedTemplate.budgetLabor != null
          ? centsToDollars(selectedTemplate.budgetLabor).toString()
          : '',
      );
      setContractValue(
        selectedTemplate.contractValue != null
          ? centsToDollars(selectedTemplate.contractValue).toString()
          : '',
      );
      setNotes(selectedTemplate.notes || '');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedTemplate]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Job name is required');
      return;
    }
    setError('');

    try {
      await createJob.mutateAsync({
        name: name.trim(),
        customerName: customerName.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        budgetTotal: totalBudget ? dollarsToCents(parseFloat(totalBudget)) : undefined,
        budgetMaterials: materialsBudget
          ? dollarsToCents(parseFloat(materialsBudget))
          : undefined,
        budgetLabor: laborBudget
          ? dollarsToCents(parseFloat(laborBudget))
          : undefined,
        contractValue: contractValue
          ? dollarsToCents(parseFloat(contractValue))
          : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Job" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* From Template button */}
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() => setShowTemplatePicker(true)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.templateBtnText}>
              {appliedTemplateId ? 'Change Template' : 'From Template'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Job Details</Text>

          <Input
            label="Job Name *"
            value={name}
            onChangeText={setName}
            placeholder="Kitchen Remodel - Smith"
            error={error && !name.trim() ? error : undefined}
          />

          <Text style={styles.sectionTitle}>Customer</Text>

          <Input
            label="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="John Smith"
          />
          <Input
            label="Customer Address"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            placeholder="123 Main St, City, ST"
            multiline
          />

          <Text style={styles.sectionTitle}>Budget</Text>

          <Input
            label="Total Budget"
            value={totalBudget}
            onChangeText={setTotalBudget}
            keyboardType="decimal-pad"
            prefix="$"
            placeholder="0.00"
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Materials"
                value={materialsBudget}
                onChangeText={setMaterialsBudget}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Labor"
                value={laborBudget}
                onChangeText={setLaborBudget}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Revenue</Text>

          <Input
            label="Contract Value"
            value={contractValue}
            onChangeText={setContractValue}
            keyboardType="decimal-pad"
            prefix="$"
            placeholder="0.00"
          />

          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <DatePickerField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />
            </View>
            <View style={styles.halfInput}>
              <DatePickerField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Notes</Text>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional details about the job..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Job"
            onPress={handleSubmit}
            loading={createJob.isPending}
            disabled={!name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Template Picker Modal */}
      <Modal
        visible={showTemplatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Template</Text>
            <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {templatesLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.modalLoading} />
          ) : templates.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
              <Text style={styles.modalEmptyText}>No templates yet</Text>
              <Text style={styles.modalEmptySubtext}>
                Create templates from the Templates section
              </Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateItem}
                  onPress={() => {
                    setAppliedTemplateId(item.id);
                    setShowTemplatePicker(false);
                  }}
                >
                  <View style={styles.templateItemInfo}>
                    <Text style={styles.templateItemName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.templateItemDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                    {item.budgetTotal != null && (
                      <Text style={styles.templateItemMeta}>
                        Budget: {formatMoney(item.budgetTotal)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  templateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalLoading: {
    marginTop: spacing.xxxl,
  },
  modalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalList: {
    padding: spacing.lg,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  templateItemInfo: {
    flex: 1,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  templateItemDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  templateItemMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
