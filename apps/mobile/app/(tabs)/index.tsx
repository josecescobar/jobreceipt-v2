import React, { useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraViewfinder, RecentReceiptsStrip } from '../../src/components/camera';
import { useReceiptUpload } from '../../src/hooks/useReceiptUpload';
import { colors, spacing, typography } from '../../src/theme';

export default function CaptureScreen() {
  const router = useRouter();
  const { upload, isUploading, status, error, reset } = useReceiptUpload();

  const handleCapture = useCallback(
    async (uri: string) => {
      try {
        const receiptId = await upload(uri);
        if (receiptId) {
          router.push(`/receipt/${receiptId}`);
        }
      } catch {
        // Error state handled by hook
      }
    },
    [upload, router],
  );

  const handleGallerySelect = useCallback(
    async (uris: string[]) => {
      // Process images sequentially
      for (const uri of uris) {
        try {
          const receiptId = await upload(uri);
          // Navigate to last uploaded receipt
          if (receiptId && uri === uris[uris.length - 1]) {
            router.push(`/receipt/${receiptId}`);
          }
        } catch {
          // Continue with remaining images
        }
      }
    },
    [upload, router],
  );

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

        {/* Camera */}
        <CameraViewfinder
          onCapture={handleCapture}
          onGallerySelect={handleGallerySelect}
          disabled={isUploading}
        />

        {/* Recent receipts */}
        <RecentReceiptsStrip />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
