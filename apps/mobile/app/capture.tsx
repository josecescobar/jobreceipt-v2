import React, { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraViewfinder, RecentReceiptsStrip } from '../src/components/camera';
import { Button } from '../src/components/ui';
import { Screen, Header } from '../src/components/layout';
import { useReceiptUpload } from '../src/hooks/useReceiptUpload';
import { enqueuePendingUpload } from '../src/lib/offline-queue';
import { useUIStore } from '../src/stores/ui.store';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../src/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface UploadedReceipt {
  id: string;
  uri: string;
}

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { upload, isUploading, status, error, reset } = useReceiptUpload();
  const addToast = useUIStore((s) => s.addToast);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingUris, setPendingUris] = useState<string[]>([]);
  const [uploadedReceipts, setUploadedReceipts] = useState<UploadedReceipt[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCapture = useCallback((uri: string) => {
    setPreviewUri(uri);
    setPendingUris([uri]);
  }, []);

  const handleGallerySelect = useCallback((uris: string[]) => {
    if (uris.length > 0) {
      setPreviewUri(uris[0]);
      setPendingUris(uris);
    }
  }, []);

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    setPendingUris([]);
    setShowSuccess(false);
    reset();
  }, [reset]);

  const handleUsePhoto = useCallback(async () => {
    const uris = [...pendingUris];

    // Multi-receipt: route to batch upload screen for progress tracking
    if (uris.length > 1) {
      setPreviewUri(null);
      setPendingUris([]);
      router.push(`/batch-upload?uris=${encodeURIComponent(JSON.stringify(uris))}`);
      return;
    }

    setPreviewUri(null);
    setPendingUris([]);

    for (const uri of uris) {
      try {
        const receiptId = await upload(uri);
        if (receiptId) {
          setUploadedReceipts((prev) => [...prev, { id: receiptId, uri }]);
          if (uri === uris[uris.length - 1]) {
            setShowSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (err: unknown) {
        // Check for network error — enqueue for offline replay
        const isNetworkError =
          err != null &&
          typeof err === 'object' &&
          'response' in err === false &&
          !('status' in err);
        if (isNetworkError) {
          await enqueuePendingUpload(uri);
          addToast({
            id: `offline_upload_${Date.now()}`,
            message: 'Receipt saved offline — will upload when back online',
            type: 'info',
          });
          router.replace('/(tabs)/receipts');
        }
        // Other errors handled by hook (error state shown in UI)
      }
    }
  }, [pendingUris, upload, router]);

  const handleScanAnother = useCallback(() => {
    setShowSuccess(false);
    setPreviewUri(null);
    setPendingUris([]);
    reset();
  }, [reset]);

  const handleDone = useCallback(() => {
    if (uploadedReceipts.length === 1) {
      router.replace(`/receipt/${uploadedReceipts[0].id}`);
    } else {
      router.replace('/(tabs)/receipts');
    }
  }, [uploadedReceipts, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Upload status overlay */}
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.uploadText}>
              {status === 'processing'
                ? 'Processing image...'
                : status === 'uploading'
                  ? 'Uploading...'
                  : 'Confirming...'}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {showSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successContent}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={48} color={colors.white} />
              </View>
              <Text style={styles.successTitle}>Receipt Uploaded!</Text>
              <Text style={styles.successCount}>
                {uploadedReceipts.length} receipt{uploadedReceipts.length !== 1 ? 's' : ''} scanned this session
              </Text>
            </View>
            <View style={styles.successActions}>
              <Button
                title="Scan Another"
                onPress={handleScanAnother}
                variant="primary"
                style={styles.previewButton}
              />
              <Button
                title="Done"
                onPress={handleDone}
                variant="secondary"
                style={styles.previewButton}
              />
            </View>
          </View>
        ) : previewUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />

            {pendingUris.length > 1 && (
              <Text style={styles.multiPhotoHint}>
                {pendingUris.length} photos selected
              </Text>
            )}

            <View style={styles.previewActions}>
              <Button
                title="Retake"
                onPress={handleRetake}
                variant="secondary"
                style={styles.previewButton}
              />
              <Button
                title="Use Photo"
                onPress={handleUsePhoto}
                variant="primary"
                loading={isUploading}
                style={styles.previewButton}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Camera */}
            <CameraViewfinder
              onCapture={handleCapture}
              onGallerySelect={handleGallerySelect}
              disabled={isUploading}
            />

            {/* Recent receipts */}
            <RecentReceiptsStrip />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  uploadText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  errorBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'space-between',
  },
  previewImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.65,
  },
  multiPhotoHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  previewButton: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  successCount: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  successActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
