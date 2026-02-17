import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraViewfinder, RecentReceiptsStrip } from '../src/components/camera';
import { Button } from '../src/components/ui';
import { Screen, Header } from '../src/components/layout';
import { useReceiptUpload } from '../src/hooks/useReceiptUpload';
import { colors, spacing } from '../src/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CaptureScreen() {
  const router = useRouter();
  const { upload, isUploading, status, error, reset } = useReceiptUpload();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingUris, setPendingUris] = useState<string[]>([]);

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
    reset();
  }, [reset]);

  const handleUsePhoto = useCallback(async () => {
    const uris = [...pendingUris];
    setPreviewUri(null);
    setPendingUris([]);

    for (const uri of uris) {
      try {
        const receiptId = await upload(uri);
        if (receiptId && uri === uris[uris.length - 1]) {
          router.replace(`/receipt/${receiptId}`);
        }
      } catch {
        // Error state handled by hook
      }
    }
  }, [pendingUris, upload, router]);

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

        {previewUri ? (
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
});
