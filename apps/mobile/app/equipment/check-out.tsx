import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCheckOutEquipment } from '../../src/hooks/useEquipment';
import { useJobs } from '../../src/hooks/useJobs';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CheckOutEquipmentScreen() {
  const router = useRouter();
  const { equipmentId, equipmentName, jobId: preselectedJobId } =
    useLocalSearchParams<{
      equipmentId: string;
      equipmentName?: string;
      jobId?: string;
    }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const checkOut = useCheckOutEquipment();

  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId || '');
  const [selectedJobName, setSelectedJobName] = useState('');
  const [notes, setNotes] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [error, setError] = useState('');

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const allJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return allJobs;
    const q = jobSearch.toLowerCase();
    return allJobs.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        (j.customerName && j.customerName.toLowerCase().includes(q)),
    );
  }, [allJobs, jobSearch]);

  const canSubmit = !!equipmentId && !!selectedJobId;

  const handleSubmit = async () => {
    if (!equipmentId) {
      setError('Equipment is required');
      return;
    }
    if (!selectedJobId) {
      setError('Please select a job');
      return;
    }
    setError('');

    try {
      await checkOut.mutateAsync({
        equipmentId,
        jobId: selectedJobId,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check out equipment');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Check Out Equipment" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Equipment name */}
          {equipmentName && (
            <View style={styles.equipmentBanner}>
              <Ionicons name="construct-outline" size={20} color={colors.primary} />
              <Text style={styles.equipmentName}>
                {decodeURIComponent(equipmentName)}
              </Text>
            </View>
          )}

          {/* Selected job indicator */}
          {selectedJobId && selectedJobName ? (
            <View style={styles.selectedJob}>
              <View style={styles.selectedJobLeft}>
                <Ionicons name="briefcase" size={18} color={colors.success} />
                <Text style={styles.selectedJobName}>{selectedJobName}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedJobId(''); setSelectedJobName(''); }}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Job search */}
          {!selectedJobId && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search jobs..."
                  placeholderTextColor={colors.textMuted}
                  value={jobSearch}
                  onChangeText={setJobSearch}
                />
              </View>
            </View>
          )}

          {/* Job list */}
          {!selectedJobId && (
            <FlatList
              data={filteredJobs}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => {
                    setSelectedJobId(item.id);
                    setSelectedJobName(item.name);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobName}>{item.name}</Text>
                    {item.customerName && (
                      <Text style={styles.jobCustomer}>{item.customerName}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.jobList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No active jobs found</Text>
              }
            />
          )}

          {/* Notes and submit */}
          {selectedJobId ? (
            <View style={styles.notesSection}>
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add check-out notes..."
                multiline
                numberOfLines={3}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title="Check Out"
                onPress={handleSubmit}
                loading={checkOut.isPending}
                disabled={!canSubmit}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    equipmentBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    equipmentName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    selectedJob: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.success + '10',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    selectedJobLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    selectedJobName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    searchContainer: {
      marginBottom: spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: spacing.xs,
    },
    jobList: {
      paddingBottom: spacing.lg,
    },
    jobCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    jobInfo: {
      flex: 1,
    },
    jobName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    jobCustomer: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 1,
    },
    notesSection: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: spacing.xl,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
