import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../src/components/ui';
import { useCreateJob } from '../src/hooks/useJobs';
import { useReceiptUpload } from '../src/hooks/useReceiptUpload';
import { organizationsApi } from '../src/api/organizations';
import { useAuthStore } from '../src/stores/auth.store';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../src/theme';

type Step = 'welcome' | 'company' | 'features' | 'job' | 'receipt';

const STEPS: Step[] = ['welcome', 'company', 'features', 'job', 'receipt'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createJob = useCreateJob();
  const { upload, isUploading, status: uploadStatus, error: uploadError, reset: resetUpload } = useReceiptUpload();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const orgId = useAuthStore((s) => s.organizationId);
  const orgName = useAuthStore((s) => s.organizationName);

  const FEATURES = [
    {
      icon: 'camera' as const,
      color: colors.primary,
      title: 'Scan Receipts',
      desc: 'AI-powered OCR extracts merchant, items, and totals automatically',
    },
    {
      icon: 'wallet' as const,
      color: colors.success,
      title: 'Track Expenses',
      desc: 'Organize costs by job and category with budget tracking',
    },
    {
      icon: 'car' as const,
      color: colors.warning,
      title: 'Log Mileage',
      desc: 'GPS tracking calculates IRS deductions for every trip',
    },
  ];

  const [step, setStep] = useState<Step>('welcome');
  const [companyName, setCompanyName] = useState(orgName || '');
  const [savingCompany, setSavingCompany] = useState(false);
  const [jobName, setJobName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  const handleComplete = () => {
    setOnboarded();
    router.replace('/(tabs)');
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // Company step
  const handleCompanyNext = async () => {
    const trimmed = companyName.trim();
    if (!trimmed) {
      setError('Company name is required');
      return;
    }
    setError('');

    // Only call API if name actually changed
    if (trimmed !== orgName && orgId) {
      setSavingCompany(true);
      try {
        await organizationsApi.update(orgId, { name: trimmed });
        useAuthStore.getState().setOrganization(orgId, trimmed);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update company name');
        setSavingCompany(false);
        return;
      }
      setSavingCompany(false);
    }
    setStep('features');
  };

  // Job step
  const handleCreateJob = async () => {
    if (!jobName.trim()) {
      setError('Job name is required');
      return;
    }
    setError('');
    try {
      await createJob.mutateAsync({
        name: jobName.trim(),
        customerName: customerName.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('receipt');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  // Receipt step
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is needed to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleChooseGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    setError('');
    try {
      await upload(uri);
      setReceiptUploaded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error state handled by hook
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header: back button + dots */}
        <View style={styles.header}>
          {step !== 'welcome' ? (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <View style={styles.dots}>
            {STEPS.map((s) => (
              <View
                key={s}
                style={[styles.dot, step === s && styles.dotActive]}
              />
            ))}
          </View>
          <View style={styles.backPlaceholder} />
        </View>

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.logoText}>JR</Text>
            </View>
            <Text style={styles.title}>Welcome to JobReceipt</Text>
            <Text style={styles.subtitle}>
              Track receipts, expenses, and mileage for your construction business
            </Text>
            <View style={styles.bottomActions}>
              <Button title="Get Started" onPress={() => setStep('company')} />
            </View>
          </View>
        )}

        {/* Step 2: Company Setup */}
        {step === 'company' && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
              <Ionicons name="business" size={36} color={colors.white} />
            </View>
            <Text style={styles.title}>Name your company</Text>
            <Text style={styles.subtitle}>
              This is how your organization appears across the app
            </Text>

            <View style={styles.formSection}>
              <Input
                label="Company Name *"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Smith Construction LLC"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <View style={styles.bottomActions}>
              <Button
                title="Next"
                onPress={handleCompanyNext}
                loading={savingCompany}
                disabled={!companyName.trim()}
              />
            </View>
          </View>
        )}

        {/* Step 3: Features */}
        {step === 'features' && (
          <View style={styles.content}>
            <Text style={styles.title}>Everything you need</Text>
            <Text style={styles.subtitle}>
              Powerful tools to manage your job finances
            </Text>

            <View style={styles.featureList}>
              {FEATURES.map((f) => (
                <View key={f.title} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                    <Ionicons name={f.icon} size={24} color={f.color} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.bottomActions}>
              <Button title="Next" onPress={() => { setError(''); setStep('job'); }} />
            </View>
          </View>
        )}

        {/* Step 4: Create Job */}
        {step === 'job' && (
          <View style={styles.content}>
            <Text style={styles.title}>Create your first job</Text>
            <Text style={styles.subtitle}>
              Jobs help you organize expenses, receipts, and mileage by project
            </Text>

            <View style={styles.formSection}>
              <Input
                label="Job Name *"
                value={jobName}
                onChangeText={setJobName}
                placeholder="Kitchen Remodel - Smith"
              />
              <Input
                label="Customer Name"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="John Smith"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <View style={styles.bottomActions}>
              <Button
                title="Create Job"
                onPress={handleCreateJob}
                loading={createJob.isPending}
                disabled={!jobName.trim()}
              />
              <Button
                title="Skip for now"
                onPress={() => { setError(''); setStep('receipt'); }}
                variant="ghost"
              />
            </View>
          </View>
        )}

        {/* Step 5: First Receipt */}
        {step === 'receipt' && (
          <View style={styles.content}>
            {receiptUploaded ? (
              // Success state
              <>
                <View style={styles.successCenter}>
                  <View style={styles.successCircle}>
                    <Ionicons name="checkmark" size={48} color={colors.white} />
                  </View>
                  <Text style={styles.title}>Receipt uploaded!</Text>
                  <Text style={styles.subtitle}>
                    Our AI is processing it now. You'll see the extracted details in a moment.
                  </Text>
                </View>
                <View style={styles.bottomActions}>
                  <Button title="Go to Dashboard" onPress={handleComplete} />
                </View>
              </>
            ) : isUploading ? (
              // Upload in progress
              <>
                <View style={styles.successCenter}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.title, { marginTop: spacing.xl }]}>
                    {uploadStatus === 'processing'
                      ? 'Processing image...'
                      : uploadStatus === 'uploading'
                        ? 'Uploading...'
                        : 'Almost done...'}
                  </Text>
                  <Text style={styles.subtitle}>
                    This should only take a few seconds
                  </Text>
                </View>
                <View style={styles.bottomActions} />
              </>
            ) : (
              // Ready to scan
              <>
                <Text style={styles.title}>Scan your first receipt</Text>
                <Text style={styles.subtitle}>
                  Try it out! Take a photo of any receipt and our AI will extract the details.
                </Text>

                {(error || uploadError) ? (
                  <Text style={styles.error}>{error || uploadError}</Text>
                ) : null}

                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.receiptActionCard}
                    onPress={handleTakePhoto}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.receiptActionIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="camera" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.receiptActionTitle}>Take Photo</Text>
                    <Text style={styles.receiptActionDesc}>
                      Use your camera to scan a receipt
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptActionCard}
                    onPress={handleChooseGallery}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.receiptActionIcon, { backgroundColor: colors.success + '15' }]}>
                      <Ionicons name="images" size={32} color={colors.success} />
                    </View>
                    <Text style={styles.receiptActionTitle}>From Gallery</Text>
                    <Text style={styles.receiptActionDesc}>
                      Choose an existing photo
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bottomActions}>
                  <Button
                    title="Skip for now"
                    onPress={handleComplete}
                    variant="ghost"
                  />
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  featureList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  formSection: {
    marginTop: spacing.lg,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  bottomActions: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  // Receipt step
  receiptActions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  receiptActionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  receiptActionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  receiptActionDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Success state
  successCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
});
