import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../src/components/layout';
import { Button } from '../src/components/ui';
import { useReceiptUpload } from '../src/hooks/useReceiptUpload';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../src/theme';

interface UploadItem {
  uri: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  receiptId?: string;
  error?: string;
}

export default function BatchUploadScreen() {
  const router = useRouter();
  const { uris: urisParam } = useLocalSearchParams<{ uris: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { upload, reset } = useReceiptUpload();

  const [items, setItems] = useState<UploadItem[]>(() => {
    try {
      const parsed: string[] = JSON.parse(urisParam || '[]');
      return parsed.map((uri) => ({ uri, status: 'pending' as const }));
    } catch {
      return [];
    }
  });

  const [isRunning, setIsRunning] = useState(false);

  const completedCount = items.filter((i) => i.status === 'done').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && completedCount + errorCount === totalCount;

  useEffect(() => {
    if (allDone && completedCount > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [allDone, completedCount]);

  const uploadItems = useCallback(
    async (itemsToUpload: UploadItem[]) => {
      setIsRunning(true);

      for (let i = 0; i < itemsToUpload.length; i++) {
        const item = itemsToUpload[i];
        const itemIndex = items.findIndex((existing) => existing.uri === item.uri);
        if (itemIndex === -1) continue;

        // Mark as uploading
        setItems((prev) =>
          prev.map((it, idx) => (idx === itemIndex ? { ...it, status: 'uploading' as const, error: undefined } : it)),
        );

        reset();

        try {
          const receiptId = await upload(item.uri);
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === itemIndex ? { ...it, status: 'done' as const, receiptId: receiptId ?? undefined } : it,
            ),
          );
        } catch (err: any) {
          const errorMsg = err?.message || 'Upload failed';
          setItems((prev) =>
            prev.map((it, idx) => (idx === itemIndex ? { ...it, status: 'error' as const, error: errorMsg } : it)),
          );
        }
      }

      setIsRunning(false);
    },
    [items, upload, reset],
  );

  const handleUploadAll = useCallback(() => {
    const pending = items.filter((i) => i.status === 'pending');
    uploadItems(pending);
  }, [items, uploadItems]);

  const handleRetryFailed = useCallback(() => {
    const failed = items.filter((i) => i.status === 'error');
    uploadItems(failed);
  }, [items, uploadItems]);

  const handleReviewReceipts = useCallback(() => {
    router.replace('/(tabs)/receipts');
  }, [router]);

  const renderStatusIcon = useCallback(
    (item: UploadItem) => {
      switch (item.status) {
        case 'pending':
          return <Ionicons name="time-outline" size={22} color={colors.textMuted} />;
        case 'uploading':
          return <ActivityIndicator size="small" color={colors.primary} />;
        case 'done':
          return <Ionicons name="checkmark-circle" size={22} color={colors.success} />;
        case 'error':
          return (
            <View style={styles.errorStatus}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
              {item.error ? (
                <Text style={styles.errorText} numberOfLines={1}>
                  {item.error}
                </Text>
              ) : null}
            </View>
          );
      }
    },
    [colors, styles],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: UploadItem; index: number }) => (
      <View style={styles.itemRow}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <Text style={styles.itemLabel} numberOfLines={1}>
          Receipt {index + 1}
        </Text>
        <View style={styles.statusContainer}>{renderStatusIcon(item)}</View>
      </View>
    ),
    [styles, renderStatusIcon],
  );

  const keyExtractor = useCallback((_: UploadItem, index: number) => `upload-${index}`, []);

  return (
    <Screen>
      <Header title="Uploading Receipts" showBack />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={styles.footer}>
        {!isRunning && !allDone && (
          <Button
            title={`Upload All (${totalCount} receipts)`}
            onPress={handleUploadAll}
            variant="primary"
          />
        )}
        {isRunning && (
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} uploaded
          </Text>
        )}
        {allDone && (
          <>
            <Button
              title="Review Receipts"
              onPress={handleReviewReceipts}
              variant="primary"
              style={styles.footerButton}
            />
            {errorCount > 0 && (
              <Button
                title={`Retry Failed (${errorCount})`}
                onPress={handleRetryFailed}
                variant="secondary"
                style={styles.footerButton}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    thumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    itemLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginLeft: spacing.md,
    },
    statusContainer: {
      marginLeft: spacing.sm,
      alignItems: 'flex-end',
      minWidth: 32,
    },
    errorStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginLeft: spacing.xs,
      maxWidth: 120,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    footerButton: {
      width: '100%',
    },
    progressText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  });
