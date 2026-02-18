import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Card, Button, DatePickerField, LoadingScreen } from '../../../src/components/ui';
import { SignaturePad } from '../../../src/components/close-out/SignaturePad';
import {
  useCloseOut,
  useUpdateChecklistItem,
  useUpdateCloseOut,
  useSaveSignature,
  useCompleteCloseOut,
} from '../../../src/hooks/useCloseOut';
import { formatDate } from '../../../src/lib/format';
import {
  useTheme,
  type ThemeColors,
  createTypography,
  spacing,
  borderRadius,
} from '../../../src/theme';

const screenWidth = Dimensions.get('window').width;

export default function CloseOutScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const { data: closeOut, isLoading, refetch } = useCloseOut(jobId!);
  const updateItem = useUpdateChecklistItem();
  const updateCloseOut = useUpdateCloseOut();
  const saveSignature = useSaveSignature();
  const completeCloseOut = useCompleteCloseOut();

  const [walkthroughExpanded, setWalkthroughExpanded] = useState(false);
  const [signatureExpanded, setSignatureExpanded] = useState(false);
  const [walkthroughDate, setWalkthroughDate] = useState('');
  const [walkthroughNotes, setWalkthroughNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [walkthroughDirty, setWalkthroughDirty] = useState(false);

  // Sync walkthrough data from server
  React.useEffect(() => {
    if (closeOut && !walkthroughDirty) {
      if (closeOut.walkthroughDate) {
        setWalkthroughDate(
          new Date(closeOut.walkthroughDate).toISOString().split('T')[0],
        );
      }
      if (closeOut.walkthroughNotes) {
        setWalkthroughNotes(closeOut.walkthroughNotes);
      }
      if (closeOut.customerSignedName) {
        setCustomerName(closeOut.customerSignedName);
      }
    }
  }, [closeOut, walkthroughDirty]);

  const handleToggleItem = useCallback(
    (itemId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'COMPLETE' ? 'PENDING' : 'COMPLETE';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateItem.mutate({
        itemId,
        jobId: jobId!,
        updates: { status: newStatus },
      });
    },
    [jobId, updateItem],
  );

  const handleLongPressItem = useCallback(
    (itemId: string, currentStatus: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const options = ['Mark Complete', 'Mark Waived', 'Reset to Pending', 'Cancel'];
      const cancelIndex = 3;

      const doAction = (index: number) => {
        let newStatus: string | null = null;
        if (index === 0) newStatus = 'COMPLETE';
        else if (index === 1) newStatus = 'WAIVED';
        else if (index === 2) newStatus = 'PENDING';
        if (newStatus && newStatus !== currentStatus) {
          updateItem.mutate({
            itemId,
            jobId: jobId!,
            updates: { status: newStatus },
          });
        }
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: cancelIndex },
          doAction,
        );
      } else {
        Alert.alert('Update Item', 'Choose a status', [
          { text: 'Mark Complete', onPress: () => doAction(0) },
          { text: 'Mark Waived', onPress: () => doAction(1) },
          { text: 'Reset to Pending', onPress: () => doAction(2) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [jobId, updateItem],
  );

  const handleSaveWalkthrough = useCallback(() => {
    if (!closeOut) return;
    updateCloseOut.mutate(
      {
        id: closeOut.id,
        jobId: jobId!,
        updates: {
          walkthroughDate: walkthroughDate || undefined,
          walkthroughNotes: walkthroughNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setWalkthroughDirty(false);
          Alert.alert('Saved', 'Walkthrough information saved.');
        },
        onError: () => {
          Alert.alert('Error', 'Failed to save walkthrough information.');
        },
      },
    );
  }, [closeOut, jobId, walkthroughDate, walkthroughNotes, updateCloseOut]);

  const handleSignatureSave = useCallback(
    (pathData: string) => {
      setSignatureData(pathData);
    },
    [],
  );

  const handleSaveSignature = useCallback(() => {
    if (!closeOut || !signatureData || !customerName.trim()) {
      Alert.alert('Missing Info', 'Please provide a signature and customer name.');
      return;
    }
    // For simplicity, store path data as the signature key
    // In production, would capture view as image and upload to S3
    saveSignature.mutate(
      {
        id: closeOut.id,
        jobId: jobId!,
        signatureKey: `signature-data:${signatureData}`,
        customerName: customerName.trim(),
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Saved', 'Customer signature saved.');
          setSignatureExpanded(false);
        },
        onError: () => {
          Alert.alert('Error', 'Failed to save signature.');
        },
      },
    );
  }, [closeOut, jobId, signatureData, customerName, saveSignature]);

  const handleComplete = useCallback(() => {
    if (!closeOut) return;
    Alert.alert(
      'Complete this job?',
      'This will mark the job as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeCloseOut.mutate(
              { id: closeOut.id, jobId: jobId! },
              {
                onSuccess: () => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  Alert.alert('Job Completed', 'The job has been marked as completed.', [
                    { text: 'OK', onPress: () => router.back() },
                  ]);
                },
                onError: (err: any) => {
                  Alert.alert(
                    'Cannot Complete',
                    err.response?.data?.message ||
                      'Please complete or waive all checklist items first.',
                  );
                },
              },
            );
          },
        },
      ],
    );
  }, [closeOut, jobId, completeCloseOut, router]);

  if (isLoading) {
    return (
      <Screen padded={false}>
        <Header title="Job Close-out" showBack />
        <LoadingScreen />
      </Screen>
    );
  }

  if (!closeOut) {
    return (
      <Screen padded={false}>
        <Header title="Job Close-out" showBack />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Close-out not found.</Text>
        </View>
      </Screen>
    );
  }

  const progress = closeOut.progress;
  const allDone = progress.pending === 0;
  const alreadySigned = !!closeOut.customerSignature;
  const isCompleted = !!closeOut.completedAt;

  const getStatusIcon = (status: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    if (status === 'COMPLETE') return { name: 'checkmark-circle', color: colors.success };
    if (status === 'WAIVED') return { name: 'remove-circle', color: colors.warning };
    return { name: 'ellipse-outline', color: colors.textMuted };
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Job Close-out" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Completed badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>
              Completed {closeOut.completedAt ? formatDate(closeOut.completedAt.toString()) : ''}
            </Text>
          </View>
        )}

        {/* Progress section */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {progress.completed + progress.waived} of {progress.total} items done
            </Text>
            <Text style={styles.progressPercent}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress.percent}%`,
                  backgroundColor:
                    progress.percent === 100 ? colors.success : colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.progressCounts}>
            <Text style={styles.progressCountText}>
              {progress.completed} complete
            </Text>
            <Text style={styles.progressCountText}>
              {progress.waived} waived
            </Text>
            <Text style={styles.progressCountText}>
              {progress.pending} pending
            </Text>
          </View>
        </Card>

        {/* Checklist section */}
        <Text style={styles.sectionTitle}>Checklist</Text>
        <View style={styles.checklistContainer}>
          {(closeOut.checklistItems ?? []).map((item) => {
            const icon = getStatusIcon(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => handleToggleItem(item.id, item.status)}
                onLongPress={() => handleLongPressItem(item.id, item.status)}
                activeOpacity={0.6}
                disabled={isCompleted}
              >
                <Ionicons name={icon.name} size={24} color={icon.color} />
                <View style={styles.checklistItemContent}>
                  <Text
                    style={[
                      styles.checklistLabel,
                      item.status === 'COMPLETE' && styles.checklistLabelDone,
                      item.status === 'WAIVED' && styles.checklistLabelWaived,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.notes ? (
                    <Text style={styles.checklistNotes}>{item.notes}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Walkthrough section (collapsible) */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setWalkthroughExpanded(!walkthroughExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Walkthrough</Text>
          <Ionicons
            name={walkthroughExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
        {walkthroughExpanded && (
          <Card style={styles.sectionCard}>
            <DatePickerField
              label="Walkthrough Date"
              value={walkthroughDate}
              onChange={(d) => {
                setWalkthroughDate(d);
                setWalkthroughDirty(true);
              }}
              placeholder="Select date"
            />
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.textArea}
              value={walkthroughNotes}
              onChangeText={(t) => {
                setWalkthroughNotes(t);
                setWalkthroughDirty(true);
              }}
              placeholder="Walkthrough notes..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Button
              title={updateCloseOut.isPending ? 'Saving...' : 'Save Walkthrough Info'}
              onPress={handleSaveWalkthrough}
              loading={updateCloseOut.isPending}
              disabled={!walkthroughDirty || isCompleted}
            />
          </Card>
        )}

        {/* Customer Sign-off section (collapsible) */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setSignatureExpanded(!signatureExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Customer Sign-off</Text>
          <View style={styles.sectionHeaderRight}>
            {alreadySigned && (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            )}
            <Ionicons
              name={signatureExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>
        {signatureExpanded && (
          <Card style={styles.sectionCard}>
            {alreadySigned ? (
              <View style={styles.signedInfo}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.signedText}>
                  Signed by {closeOut.customerSignedName} on{' '}
                  {closeOut.customerSignedAt
                    ? formatDate(closeOut.customerSignedAt.toString())
                    : ''}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Customer Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer name"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                  Signature
                </Text>
                <SignaturePad
                  onSave={handleSignatureSave}
                  onClear={() => setSignatureData('')}
                  width={screenWidth - spacing.lg * 2 - spacing.lg * 2}
                  height={180}
                />
                {signatureData ? (
                  <Button
                    title={
                      saveSignature.isPending ? 'Saving...' : 'Save Signature'
                    }
                    onPress={handleSaveSignature}
                    loading={saveSignature.isPending}
                    disabled={isCompleted}
                    style={{ marginTop: spacing.md }}
                  />
                ) : null}
              </>
            )}
          </Card>
        )}

        {/* Complete Job button */}
        {!isCompleted && (
          <View style={styles.completeSection}>
            <Button
              title={completeCloseOut.isPending ? 'Completing...' : 'Complete Job'}
              onPress={handleComplete}
              loading={completeCloseOut.isPending}
              disabled={!allDone}
              style={!allDone ? styles.completeDisabled : undefined}
            />
            {!allDone && (
              <Text style={styles.completeHint}>
                Complete or waive all checklist items to finish close-out
              </Text>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (
  colors: ThemeColors,
  typography: ReturnType<typeof createTypography>,
) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.success + '15',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    completedText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.success,
    },
    progressCard: {
      marginBottom: spacing.lg,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    progressPercent: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 9999,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 9999,
    },
    progressCounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressCountText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    sectionTitle: {
      ...typography.label,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingRight: spacing.xs,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionCard: {
      marginBottom: spacing.md,
    },
    checklistContainer: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checklistItemContent: {
      flex: 1,
    },
    checklistLabel: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    checklistLabelDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    checklistLabelWaived: {
      fontStyle: 'italic',
      color: colors.textMuted,
    },
    checklistNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    textArea: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
      marginBottom: spacing.lg,
    },
    textInput: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.md,
    },
    signedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    signedText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.success,
      flex: 1,
    },
    completeSection: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    completeDisabled: {
      backgroundColor: colors.textMuted,
    },
    completeHint: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
