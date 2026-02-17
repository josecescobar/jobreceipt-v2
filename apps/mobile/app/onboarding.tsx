import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../src/components/ui';
import { useCreateJob } from '../src/hooks/useJobs';
import { useAuthStore } from '../src/stores/auth.store';
import { colors, spacing, borderRadius } from '../src/theme';

type Step = 'welcome' | 'features' | 'job';

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

export default function OnboardingScreen() {
  const router = useRouter();
  const createJob = useCreateJob();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const [step, setStep] = useState<Step>('welcome');
  const [jobName, setJobName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');

  const handleComplete = () => {
    setOnboarded();
    router.replace('/(tabs)');
  };

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
      handleComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Step indicators */}
        <View style={styles.dots}>
          {(['welcome', 'features', 'job'] as Step[]).map((s) => (
            <View
              key={s}
              style={[styles.dot, step === s && styles.dotActive]}
            />
          ))}
        </View>

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
              <Button title="Get Started" onPress={() => setStep('features')} />
            </View>
          </View>
        )}

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
              <Button title="Next" onPress={() => setStep('job')} />
            </View>
          </View>
        )}

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
                title="Create Job & Get Started"
                onPress={handleCreateJob}
                loading={createJob.isPending}
                disabled={!jobName.trim()}
              />
              <Button
                title="Skip for now"
                onPress={handleComplete}
                variant="ghost"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    marginTop: spacing.xxl,
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
  },
  bottomActions: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
