import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { CaptureButton } from './CaptureButton';
import { GalleryButton } from './GalleryButton';
import { FlashToggle } from './FlashToggle';
import { useTheme, type ThemeColors, spacing } from '../../theme';
import { Button } from '../ui';

interface CameraViewfinderProps {
  onCapture: (uri: string) => void;
  onGallerySelect: (uris: string[]) => void;
  disabled?: boolean;
}

export function CameraViewfinder({
  onCapture,
  onGallerySelect,
  disabled,
}: CameraViewfinderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cameraRef = useRef<CameraView>(null);
  const [flash, setFlash] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Button
          title="Grant Camera Access"
          onPress={requestPermission}
          variant="primary"
        />
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || disabled) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
    });
    if (photo?.uri) {
      onCapture(photo.uri);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets.length > 0) {
      onGallerySelect(result.assets.map((a) => a.uri));
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash ? 'on' : 'off'}
      >
        {/* Top controls */}
        <View style={styles.topBar}>
          <View style={styles.topSpacer} />
          <FlashToggle enabled={flash} onToggle={() => setFlash(!flash)} />
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <GalleryButton onPress={handleGallery} />
          <CaptureButton onPress={handleCapture} disabled={disabled} />
          <View style={{ width: 48 }} />
        </View>
      </CameraView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  topSpacer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
});
