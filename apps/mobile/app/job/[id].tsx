import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Badge, Button, MoneyText } from '../../src/components/ui';
import {
  BudgetWarningBanner,
  BudgetBreakdownChart,
  CategoryBreakdownCard,
} from '../../src/components/jobs';
import { ActivityFeed } from '../../src/components/dashboard';
import type { ActivityItem } from '../../src/components/dashboard';
import { useJob, useUpdateJob, useJobPhotos, useUploadJobPhoto, useDeleteJobPhoto } from '../../src/hooks/useJobs';
import { useBudget } from '../../src/hooks/useBudget';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useReceipts } from '../../src/hooks/useReceipts';
import { useMileageTrips } from '../../src/hooks/useMileage';
import { useInvoices } from '../../src/hooks/useInvoices';
import { useEstimates } from '../../src/hooks/useEstimates';
import { useChangeOrders } from '../../src/hooks/useChangeOrders';
import { useRecurringInvoices } from '../../src/hooks/useRecurringInvoices';
import { useCreateTemplateFromJob } from '../../src/hooks/useJobTemplates';
import { useTimeEntries, useTimeEntrySummary } from '../../src/hooks/useTimeTracking';
import { useDailyLogs } from '../../src/hooks/useDailyLogs';
import { useJobPunchListSummary, usePunchListItems } from '../../src/hooks/usePunchLists';
import { formatMoney, formatDate } from '../../src/lib/format';
import { exportJobReport, exportJobReportPdf } from '../../src/lib/export';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';

const WEATHER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  SUNNY: 'sunny-outline',
  CLOUDY: 'cloud-outline',
  RAINY: 'rainy-outline',
  SNOWY: 'snow-outline',
  WINDY: 'flag-outline',
};

const getStatusColors = (colors: ThemeColors): Record<string, { bg: string; text: string }> => ({
  ACTIVE: { bg: colors.success + '20', text: colors.success },
  COMPLETED: { bg: colors.primary + '20', text: colors.primary },
  ARCHIVED: { bg: colors.textMuted + '20', text: colors.textMuted },
});

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const STATUS_COLORS = useMemo(() => getStatusColors(colors), [colors]);
  const { data: job, isLoading: jobLoading } = useJob(id!);
  const {
    spent,
    budget,
    ratio,
    remaining,
    color,
    categories,
  } = useBudget(id!);

  const updateJob = useUpdateJob();
  const { data: photos = [] } = useJobPhotos(id!);
  const uploadPhoto = useUploadJobPhoto();
  const deletePhoto = useDeleteJobPhoto();
  const [statusLoading, setStatusLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const createTemplate = useCreateTemplateFromJob();

  const { data: expensesData } = useExpenses({ jobId: id });
  const expenses = useMemo(
    () => expensesData?.pages?.flatMap((p) => p.data) ?? [],
    [expensesData],
  );

  const { data: receiptsData } = useReceipts({ jobId: id });
  const receipts = useMemo(
    () => receiptsData?.pages?.flatMap((p) => p.data) ?? [],
    [receiptsData],
  );

  const { data: mileageData } = useMileageTrips({ jobId: id });
  const mileageTrips = useMemo(
    () => mileageData?.pages?.flatMap((p) => p.data) ?? [],
    [mileageData],
  );

  const { data: invoicesData } = useInvoices({ jobId: id });
  const invoices = useMemo(
    () => invoicesData?.data ?? [],
    [invoicesData],
  );

  const { data: estimatesData } = useEstimates({ jobId: id });
  const estimates = useMemo(
    () => estimatesData?.data ?? [],
    [estimatesData],
  );

  const { data: changeOrdersData } = useChangeOrders({ jobId: id! });
  const changeOrders = useMemo(
    () => changeOrdersData?.data ?? [],
    [changeOrdersData],
  );
  const approvedCOTotal = useMemo(
    () => changeOrders.filter((co) => co.status === 'APPROVED').reduce((sum, co) => sum + co.total, 0),
    [changeOrders],
  );
  const approvedCOCount = useMemo(
    () => changeOrders.filter((co) => co.status === 'APPROVED').length,
    [changeOrders],
  );

  const { data: recurringInvoicesData } = useRecurringInvoices({ jobId: id });
  const recurringInvoices = useMemo(
    () => recurringInvoicesData?.pages?.flatMap((p) => p.data) ?? [],
    [recurringInvoicesData],
  );

  const { data: timeData } = useTimeEntries({ jobId: id });
  const timeEntries = useMemo(
    () => timeData?.pages?.flatMap((p) => p.data) ?? [],
    [timeData],
  );
  const { data: timeSummary } = useTimeEntrySummary({ jobId: id });

  const { data: dailyLogsData } = useDailyLogs({ jobId: id! });
  const dailyLogs = useMemo(
    () => dailyLogsData?.pages?.flatMap((p) => p.data) ?? [],
    [dailyLogsData],
  );

  const { data: punchListSummary } = useJobPunchListSummary(id!);
  const { data: punchListData } = usePunchListItems(id!, { limit: 3 });
  const punchListItems = useMemo(
    () => (punchListData?.data ?? []).filter(
      (item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS',
    ).slice(0, 3),
    [punchListData],
  );
  const punchListTotal = punchListSummary?.total ?? 0;
  const punchListCompleted = punchListSummary?.completed ?? 0;
  const punchListPercent = punchListSummary?.completionPercent ?? 0;

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const e of expenses) {
      items.push({
        type: 'expense',
        id: e.id,
        date: e.date?.toString() ?? '',
        description: e.description,
        amount: e.amount,
      });
    }

    for (const r of receipts) {
      items.push({
        type: 'receipt',
        id: r.id,
        date: (r.transactionDate ?? r.createdAt)?.toString() ?? '',
        merchantName: r.merchantName,
        totalAmount: r.totalAmount,
        status: r.status,
      });
    }

    for (const m of mileageTrips) {
      items.push({
        type: 'mileage',
        id: m.id,
        date: m.date?.toString() ?? '',
        distanceMiles: m.distanceMiles,
        totalDeduction: m.totalDeduction,
        purpose: m.purpose ?? null,
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [expenses, receipts, mileageTrips]);

  if (jobLoading || !job) {
    return (
      <Screen padded={false}>
        <Header title="Job" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = STATUS_COLORS[job.status] || STATUS_COLORS.ACTIVE;
  const chartData = [
    { label: 'Materials', ...categories.materials },
    { label: 'Labor', ...categories.labor },
    { label: 'Equip', ...categories.equipment },
    { label: 'Sub', ...categories.subcontractor },
    { label: 'Overhead', ...categories.overhead },
  ];

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
    setStatusLoading(true);
    try {
      await updateJob.mutateAsync({ id: id!, updates: { status: newStatus } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error handled silently, mutation will show stale data
    } finally {
      setStatusLoading(false);
    }
  };

  const handleMarkComplete = () => {
    Alert.alert(
      'Complete Job?',
      `${job.name}\n\n${expenses.length} expense${expenses.length !== 1 ? 's' : ''} · ${formatMoney(spent)} total\n${receipts.length} receipt${receipts.length !== 1 ? 's' : ''} · ${mileageTrips.length} trip${mileageTrips.length !== 1 ? 's' : ''}\n\nThis job will be marked as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => handleStatusChange('COMPLETED') },
      ],
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Job?',
      `${job.name} will be archived and hidden from active views.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: () => handleStatusChange('ARCHIVED') },
      ],
    );
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportJobReportPdf(id!, job.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportJobReport(id!, job.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExporting(false);
    }
  };

  const photoColumnWidth = (Dimensions.get('window').width - spacing.lg * 2 - spacing.sm * 2) / 3;

  const handleAddPhoto = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) launchCamera();
          else if (index === 1) launchLibrary();
        },
      );
    } else {
      Alert.alert('Add Photo', 'Choose a source', [
        { text: 'Take Photo', onPress: launchCamera },
        { text: 'Choose from Library', onPress: launchLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      doUpload(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      doUpload(result.assets[0].uri);
    }
  };

  const doUpload = async (uri: string) => {
    setPhotoUploading(true);
    try {
      await uploadPhoto.mutateAsync({ jobId: id!, uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo?', 'This photo will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto.mutateAsync({ jobId: id!, photoId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Failed to delete photo.');
          }
        },
      },
    ]);
  };

  const doSaveAsTemplate = async (templateName: string) => {
    if (!templateName.trim()) return;
    try {
      await createTemplate.mutateAsync({ jobId: id!, name: templateName.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Template Saved', `"${templateName.trim()}" has been saved as a template.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleSaveAsTemplate = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save as Template',
        'Enter a name for this template:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (text) => doSaveAsTemplate(text ?? '') },
        ],
        'plain-text',
        job?.name ? `${job.name} Template` : '',
      );
    } else {
      // Android: use default name since Alert.prompt is iOS-only
      const defaultName = job?.name ? `${job.name} Template` : 'New Template';
      Alert.alert('Save as Template', `Save "${defaultName}" as a reusable template?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => doSaveAsTemplate(defaultName) },
      ]);
    }
  };

  const activeCategories = [
    { label: 'Materials', ...categories.materials },
    { label: 'Labor', ...categories.labor },
    { label: 'Equipment', ...categories.equipment },
    { label: 'Subcontractor', ...categories.subcontractor },
    { label: 'Overhead', ...categories.overhead },
  ].filter((c) => c.spent > 0 || c.budget > 0);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title={job.name}
        showBack
        rightAction={{ icon: 'create-outline', onPress: () => router.push(`/job/edit/${id}`) }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job info */}
        <View style={styles.infoSection}>
          <Badge
            label={job.status}
            color={statusStyle.text}
            backgroundColor={statusStyle.bg}
          />
          {job.customerName && (
            <Text style={styles.customer}>{job.customerName}</Text>
          )}
          {job.customerAddress && (
            <Text style={styles.customerAddress}>{job.customerAddress}</Text>
          )}
          {(job.startDate || job.endDate) && (
            <Text style={styles.dates}>
              {job.startDate ? formatDate(job.startDate.toString()) : ''}
              {job.startDate && job.endDate ? ' — ' : ''}
              {job.endDate ? formatDate(job.endDate.toString()) : ''}
            </Text>
          )}
          {job.notes && (
            <Text style={styles.notes}>{job.notes}</Text>
          )}
        </View>

        {/* Messages */}
        <TouchableOpacity
          style={styles.messagesRow}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/messages/threads/[jobId]',
              params: { jobId: id!, jobName: job.name },
            })
          }
        >
          <View style={styles.messagesRowLeft}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <Text style={styles.messagesRowLabel}>Messages</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Status actions */}
        {job.status === 'ACTIVE' && (
          <View style={styles.statusActions}>
            <Button
              title="Mark Complete"
              onPress={handleMarkComplete}
              loading={statusLoading}
            />
          </View>
        )}
        {job.status === 'COMPLETED' && (
          <View style={styles.statusActions}>
            <Button
              title="Reactivate"
              onPress={() => handleStatusChange('ACTIVE')}
              variant="secondary"
              loading={statusLoading}
            />
            <Button
              title="Archive"
              onPress={handleArchive}
              variant="ghost"
              loading={statusLoading}
            />
          </View>
        )}
        {job.status === 'ARCHIVED' && (
          <View style={styles.statusActions}>
            <Button
              title="Reactivate"
              onPress={() => handleStatusChange('ACTIVE')}
              variant="secondary"
              loading={statusLoading}
            />
          </View>
        )}

        {/* Budget warning/alert */}
        {ratio >= 0.8 && budget > 0 && (
          <BudgetWarningBanner ratio={ratio} remaining={remaining} />
        )}

        {/* Total budget summary */}
        {budget > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Spent</Text>
                <MoneyText cents={spent} size="large" color={color} />
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryLabel}>Budget</Text>
                <MoneyText cents={budget} size="large" />
              </View>
            </View>
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>
                {remaining >= 0 ? 'Remaining' : 'Over by'}
              </Text>
              <Text style={[styles.remainingValue, { color }]}>
                {formatMoney(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        )}

        {/* Budget breakdown chart */}
        {budget > 0 && <BudgetBreakdownChart data={chartData} />}

        {/* Category cards (only non-zero) */}
        {activeCategories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {activeCategories.map((cat) => (
              <CategoryBreakdownCard
                key={cat.label}
                label={cat.label}
                spent={cat.spent}
                budget={cat.budget}
              />
            ))}
          </>
        )}

        {/* Progress Photos */}
        <View style={styles.photoSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Progress Photos ({photos.length})
          </Text>
          <TouchableOpacity
            onPress={handleAddPhoto}
            style={styles.addPhotoBtn}
            disabled={photoUploading}
          >
            {photoUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                onPress={() =>
                  router.push({
                    pathname: '/job/photo/[id]',
                    params: {
                      id: photo.id,
                      imageUrl: photo.imageUrl || '',
                      caption: photo.caption || '',
                    },
                  })
                }
                onLongPress={() => handleDeletePhoto(photo.id)}
                style={[styles.photoThumb, { width: photoColumnWidth, height: photoColumnWidth }]}
              >
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No photos yet — tap + to add progress photos
          </Text>
        )}

        {/* Daily Logs */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Daily Logs ({dailyLogs.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/daily-log/create?jobId=${id}`)}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {dailyLogs.length > 0 ? (
          <View style={styles.invoiceList}>
            {dailyLogs.slice(0, 3).map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.invoiceRow}
                onPress={() => router.push(`/daily-log/${log.id}`)}
              >
                <View style={styles.invoiceInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {log.weather && (
                      <Ionicons
                        name={WEATHER_ICONS[log.weather] || 'partly-sunny-outline'}
                        size={14}
                        color={colors.textSecondary}
                      />
                    )}
                    <Text style={styles.invoiceNumber}>
                      {formatDate(log.date)}
                    </Text>
                  </View>
                  <Text style={styles.invoiceDate} numberOfLines={1}>
                    {log.workPerformed}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {dailyLogs.length > 3 && (
              <TouchableOpacity
                onPress={() => router.push(`/daily-log?jobId=${id}`)}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>View All Daily Logs</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No daily logs yet — tap + to add one
          </Text>
        )}

        {/* Punch List */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Punch List {punchListTotal > 0 ? `(${punchListTotal})` : ''}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/punch-list/create?jobId=${id}`)}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {punchListTotal > 0 ? (
          <>
            <View style={styles.punchListProgress}>
              <View style={styles.punchListProgressHeader}>
                <Text style={styles.punchListProgressText}>
                  {punchListCompleted} of {punchListTotal} items complete
                </Text>
                <Text style={styles.punchListPercentText}>{punchListPercent}%</Text>
              </View>
              <View style={styles.punchListBarBg}>
                <View
                  style={[
                    styles.punchListBarFill,
                    { width: `${punchListPercent}%` },
                  ]}
                />
              </View>
            </View>
            {punchListItems.length > 0 && (
              <View style={styles.invoiceList}>
                {punchListItems.map((plItem) => {
                  const pColor =
                    plItem.priority === 'URGENT'
                      ? '#EF4444'
                      : plItem.priority === 'HIGH'
                      ? '#F97316'
                      : plItem.priority === 'MEDIUM'
                      ? '#EAB308'
                      : '#9CA3AF';
                  return (
                    <TouchableOpacity
                      key={plItem.id}
                      style={styles.invoiceRow}
                      onPress={() => router.push(`/punch-list/${plItem.id}`)}
                    >
                      <View style={styles.invoiceInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: pColor,
                            }}
                          />
                          <Text style={styles.invoiceNumber}>{plItem.title}</Text>
                        </View>
                        {plItem.assignedTo?.name && (
                          <Text style={styles.invoiceDate}>
                            {plItem.assignedTo.name}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => router.push(`/punch-list?jobId=${id}`)}
                  style={styles.viewAllBtn}
                >
                  <Text style={styles.viewAllText}>View All Punch List Items</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            onPress={() => router.push(`/punch-list/create?jobId=${id}`)}
            style={styles.punchListEmptyBtn}
          >
            <Text style={styles.emptyPhotos}>
              Add first punch list item
            </Text>
          </TouchableOpacity>
        )}

        {/* Invoices */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Invoices ({invoices.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/invoice/create', params: { jobId: id } })}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {invoices.length > 0 ? (
          <View style={styles.invoiceList}>
            {invoices.map((inv) => {
              const invStatus = inv.status === 'PAID'
                ? { bg: colors.success + '20', text: colors.success }
                : inv.status === 'SENT'
                ? { bg: colors.primary + '20', text: colors.primary }
                : inv.status === 'PARTIALLY_PAID'
                ? { bg: colors.warning + '20', text: colors.warning }
                : { bg: colors.textMuted + '20', text: colors.textMuted };
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.invoiceRow}
                  onPress={() => router.push(`/invoice/${inv.id}`)}
                >
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceTotal}>{formatMoney(inv.total)}</Text>
                    <View style={[styles.invoiceStatusBadge, { backgroundColor: invStatus.bg }]}>
                      <Text style={[styles.invoiceStatusText, { color: invStatus.text }]}>
                        {inv.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No invoices yet — tap + to create one
          </Text>
        )}

        {/* Estimates */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Estimates ({estimates.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/estimate/create', params: { jobId: id } })}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {estimates.length > 0 ? (
          <View style={styles.invoiceList}>
            {estimates.map((est) => {
              const estStatus = est.status === 'ACCEPTED'
                ? { bg: colors.success + '20', text: colors.success }
                : est.status === 'SENT'
                ? { bg: colors.primary + '20', text: colors.primary }
                : est.status === 'REJECTED'
                ? { bg: colors.error + '20', text: colors.error }
                : est.status === 'EXPIRED'
                ? { bg: colors.warning + '20', text: colors.warning }
                : est.status === 'CONVERTED'
                ? { bg: colors.success + '20', text: colors.success }
                : { bg: colors.textMuted + '20', text: colors.textMuted };
              return (
                <TouchableOpacity
                  key={est.id}
                  style={styles.invoiceRow}
                  onPress={() => router.push(`/estimate/${est.id}`)}
                >
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>{est.estimateNumber}</Text>
                    <Text style={styles.invoiceDate}>
                      {new Date(est.issueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceTotal}>{formatMoney(est.total)}</Text>
                    <View style={[styles.invoiceStatusBadge, { backgroundColor: estStatus.bg }]}>
                      <Text style={[styles.invoiceStatusText, { color: estStatus.text }]}>
                        {est.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No estimates yet — tap + to create one
          </Text>
        )}

        {/* Change Orders */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Change Orders ({changeOrders.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/change-order/create', params: { jobId: id } })}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {approvedCOCount > 0 && (
          <View style={styles.timeSummaryRow}>
            <Text style={styles.timeSummaryLabel}>
              {approvedCOCount > 0 ? `+${formatMoney(approvedCOTotal)} from ${approvedCOCount} change order${approvedCOCount !== 1 ? 's' : ''}` : ''}
            </Text>
          </View>
        )}
        {changeOrders.length > 0 ? (
          <View style={styles.invoiceList}>
            {changeOrders.map((co) => {
              const coStatus = co.status === 'APPROVED'
                ? { bg: colors.success + '20', text: colors.success }
                : co.status === 'SUBMITTED'
                ? { bg: colors.warning + '20', text: colors.warning }
                : co.status === 'REJECTED'
                ? { bg: colors.error + '20', text: colors.error }
                : { bg: colors.textMuted + '20', text: colors.textMuted };
              return (
                <TouchableOpacity
                  key={co.id}
                  style={styles.invoiceRow}
                  onPress={() => router.push(`/change-order/${co.id}`)}
                >
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>{co.title}</Text>
                    <Text style={styles.invoiceDate}>{co.changeOrderNumber}</Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceTotal}>{formatMoney(co.total)}</Text>
                    <View style={[styles.invoiceStatusBadge, { backgroundColor: coStatus.bg }]}>
                      <Text style={[styles.invoiceStatusText, { color: coStatus.text }]}>
                        {co.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No change orders yet — tap + to create one
          </Text>
        )}

        {/* Recurring Invoices */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Recurring Invoices ({recurringInvoices.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/recurring-invoice/create', params: { jobId: id } })}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {recurringInvoices.length > 0 ? (
          <View style={styles.invoiceList}>
            {recurringInvoices.map((ri) => (
              <TouchableOpacity
                key={ri.id}
                style={styles.invoiceRow}
                onPress={() => router.push(`/recurring-invoice/${ri.id}`)}
              >
                <View style={styles.invoiceInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="repeat" size={14} color={colors.primary} />
                    <Text style={styles.invoiceNumber}>{ri.frequency}</Text>
                  </View>
                  <Text style={styles.invoiceDate}>
                    Next: {new Date(ri.nextOccurrence).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.invoiceRight}>
                  <View style={[styles.invoiceStatusBadge, { backgroundColor: ri.isActive ? colors.success + '20' : colors.textMuted + '20' }]}>
                    <Text style={[styles.invoiceStatusText, { color: ri.isActive ? colors.success : colors.textMuted }]}>
                      {ri.isActive ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyPhotos}>
            No recurring invoices — tap + to set one up
          </Text>
        )}

        {/* Time Entries */}
        <View style={styles.invoiceSectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Time Entries ({timeEntries.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/time-tracking/create', params: { jobId: id } })}
            style={styles.addPhotoBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {timeSummary && (timeSummary.totalMinutes > 0) ? (
          <>
            <View style={styles.timeSummaryRow}>
              <Text style={styles.timeSummaryLabel}>
                {Math.floor(timeSummary.totalMinutes / 60)}h {timeSummary.totalMinutes % 60}m logged
              </Text>
              <Text style={styles.timeSummaryValue}>{formatMoney(timeSummary.totalCost)}</Text>
            </View>
            {timeEntries.slice(0, 3).map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.invoiceRow}
                onPress={() => router.push(`/time-tracking/edit/${entry.id}`)}
              >
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>
                    {Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m
                  </Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.invoiceTotal}>{formatMoney(entry.totalCost)}</Text>
              </TouchableOpacity>
            ))}
            {timeEntries.length > 3 && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/time-tracking', params: { jobId: id } })}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>View All Time Entries</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.emptyPhotos}>
            No time entries yet — tap + to log hours
          </Text>
        )}

        {/* Activity timeline */}
        <Text style={styles.sectionTitle}>
          Activity ({expenses.length + receipts.length + mileageTrips.length})
        </Text>
        <ActivityFeed items={activityItems} />

        {/* Export & Template */}
        <View style={styles.exportSection}>
          <Button
            title={exportingPdf ? 'Generating PDF...' : 'Export PDF Report'}
            onPress={handleExportPdf}
            loading={exportingPdf}
          />
          <Button
            title={exporting ? 'Exporting...' : 'Export CSV Report'}
            onPress={handleExport}
            variant="secondary"
            loading={exporting}
          />
          <Button
            title="Save as Template"
            onPress={handleSaveAsTemplate}
            variant="ghost"
            loading={createTemplate.isPending}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: ReturnType<typeof createTypography>) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  customer: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xs,
  },
  customerAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dates: {
    fontSize: 13,
    color: colors.textMuted,
  },
  notes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  messagesRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messagesRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  statusActions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remainingLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  addPhotoBtn: {
    padding: spacing.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoThumb: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotos: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  invoiceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  invoiceList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceInfo: {},
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invoiceTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums' as const],
  },
  invoiceStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  timeSummaryLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  timeSummaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums' as const],
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  punchListProgress: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  punchListProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  punchListProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  punchListPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  punchListBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  punchListBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 9999,
  },
  punchListEmptyBtn: {
    paddingVertical: spacing.sm,
  },
  exportSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
