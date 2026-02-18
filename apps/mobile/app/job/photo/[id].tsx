import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { MarkupCanvas } from '../../../src/components/markup/MarkupCanvas';
import {
  MarkupToolbar,
  type MarkupTool,
} from '../../../src/components/markup/MarkupToolbar';
import { useSaveAnnotations } from '../../../src/hooks/useJobs';
import { useTheme, type ThemeColors, spacing } from '../../../src/theme';
import type { Annotation } from '@jobreceipt/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const { id, imageUrl, caption, jobId, annotationsJson } =
    useLocalSearchParams<{
      id: string;
      imageUrl: string;
      caption?: string;
      jobId?: string;
      annotationsJson?: string;
    }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Parse initial annotations
  const initialAnnotations = useMemo<Annotation[]>(() => {
    if (!annotationsJson) return [];
    try {
      const parsed = JSON.parse(annotationsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [annotationsJson]);

  // Mode
  const [editing, setEditing] = useState(false);

  // Image dimensions
  const [imageHeight, setImageHeight] = useState(SCREEN_WIDTH * 0.75);
  const imageWidth = SCREEN_WIDTH;

  // Get image aspect ratio
  React.useEffect(() => {
    if (imageUrl) {
      Image.getSize(
        imageUrl,
        (w, h) => {
          const aspect = h / w;
          setImageHeight(SCREEN_WIDTH * aspect);
        },
        () => {
          // Fallback
          setImageHeight(SCREEN_WIDTH * 0.75);
        },
      );
    }
  }, [imageUrl]);

  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Tool state
  const [tool, setTool] = useState<MarkupTool>('arrow');
  const [color, setColor] = useState('#FF3B30');
  const [strokeWidth, setStrokeWidth] = useState(4);

  // Text modal
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textInput, setTextInput] = useState('');
  const pendingTextPos = useRef<{ x: number; y: number } | null>(null);

  // Save mutation
  const saveAnnotationsMutation = useSaveAnnotations();

  const generateId = () => Math.random().toString(36).slice(2, 10);

  const pushUndo = useCallback(
    (prevAnnotations: Annotation[]) => {
      setUndoStack((prev) => [...prev, prevAnnotations]);
      setRedoStack([]);
    },
    [],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, annotations]);
    setAnnotations(prev);
    setUndoStack((u) => u.slice(0, -1));
  }, [undoStack, annotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, annotations]);
    setAnnotations(next);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack, annotations]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (evt: any) => {
      if (!editing) return;
      const touch = evt.nativeEvent;
      const nx = touch.locationX / imageWidth;
      const ny = touch.locationY / imageHeight;

      if (tool === 'text') {
        pendingTextPos.current = { x: nx, y: ny };
        setTextInput('');
        setTextModalVisible(true);
        return;
      }

      const base: Annotation = {
        id: generateId(),
        type: tool,
        color,
        strokeWidth,
        data: {},
      };

      switch (tool) {
        case 'arrow':
          base.data = { startX: nx, startY: ny, endX: nx, endY: ny };
          break;
        case 'circle':
          base.data = { cx: nx, cy: ny, rx: 0, ry: 0 };
          break;
        case 'rectangle':
          base.data = { x: nx, y: ny, width: 0, height: 0 };
          break;
        case 'freehand':
          base.data = { points: [{ x: nx, y: ny }] };
          break;
      }

      setCurrentAnnotation(base);
    },
    [editing, tool, color, strokeWidth, imageWidth, imageHeight],
  );

  const handleTouchMove = useCallback(
    (evt: any) => {
      if (!editing || !currentAnnotation) return;
      const touch = evt.nativeEvent;
      const nx = touch.locationX / imageWidth;
      const ny = touch.locationY / imageHeight;

      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        const updated = { ...prev, data: { ...prev.data } };

        switch (prev.type) {
          case 'arrow':
            updated.data.endX = nx;
            updated.data.endY = ny;
            break;
          case 'circle':
            updated.data.rx = nx - (prev.data.cx ?? 0);
            updated.data.ry = ny - (prev.data.cy ?? 0);
            break;
          case 'rectangle':
            updated.data.width = nx - (prev.data.x ?? 0);
            updated.data.height = ny - (prev.data.y ?? 0);
            break;
          case 'freehand':
            updated.data.points = [
              ...(prev.data.points ?? []),
              { x: nx, y: ny },
            ];
            break;
        }

        return updated;
      });
    },
    [editing, currentAnnotation, imageWidth, imageHeight],
  );

  const handleTouchEnd = useCallback(() => {
    if (!editing || !currentAnnotation) return;

    pushUndo(annotations);
    setAnnotations((prev) => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
  }, [editing, currentAnnotation, annotations, pushUndo]);

  const handleTextConfirm = useCallback(() => {
    if (!pendingTextPos.current || !textInput.trim()) {
      setTextModalVisible(false);
      return;
    }

    const annotation: Annotation = {
      id: generateId(),
      type: 'text',
      color,
      strokeWidth,
      data: {
        x: pendingTextPos.current.x,
        y: pendingTextPos.current.y,
        text: textInput.trim(),
        fontSize: 16,
      },
    };

    pushUndo(annotations);
    setAnnotations((prev) => [...prev, annotation]);
    setTextModalVisible(false);
    setTextInput('');
    pendingTextPos.current = null;
  }, [textInput, color, strokeWidth, annotations, pushUndo]);

  const handleSave = useCallback(async () => {
    if (!jobId) {
      Alert.alert('Error', 'Missing job information.');
      return;
    }

    try {
      await saveAnnotationsMutation.mutateAsync({
        jobId,
        photoId: id!,
        annotations,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch {
      Alert.alert('Save Failed', 'Could not save annotations. Please try again.');
    }
  }, [jobId, id, annotations, saveAnnotationsMutation]);

  const handleCancel = useCallback(() => {
    setAnnotations(initialAnnotations);
    setUndoStack([]);
    setRedoStack([]);
    setCurrentAnnotation(null);
    setEditing(false);
  }, [initialAnnotations]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const fileUri = FileSystem.cacheDirectory + `photo-${id}.jpg`;
      await FileSystem.downloadAsync(imageUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch {
      Alert.alert('Share Failed', 'Could not share photo.');
    }
  }, [imageUrl, id]);

  const handleEnterEdit = useCallback(() => {
    if (!jobId) {
      Alert.alert(
        'Cannot Edit',
        'Photo must be viewed from a job to enable markup.',
      );
      return;
    }
    setEditing(true);
  }, [jobId]);

  // Clamp image height to something reasonable for the screen
  const displayHeight = Math.min(imageHeight, Dimensions.get('window').height * 0.65);

  // VIEW MODE
  if (!editing) {
    return (
      <Screen padded={false} edges={['top', 'bottom']}>
        <Header
          title="Photo"
          showBack
          rightAction={
            jobId
              ? { icon: 'brush-outline', onPress: handleEnterEdit }
              : undefined
          }
        />
        <View style={styles.container}>
          {imageUrl ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, { width: imageWidth, height: displayHeight }]}
                resizeMode="contain"
              />
              {annotations.length > 0 && (
                <MarkupCanvas
                  annotations={annotations}
                  currentAnnotation={null}
                  width={imageWidth}
                  height={displayHeight}
                />
              )}
            </View>
          ) : null}

          {caption ? (
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>{caption}</Text>
            </View>
          ) : null}

          <View style={styles.bottomActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
            {jobId && (
              <TouchableOpacity
                onPress={handleEnterEdit}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="brush-outline" size={24} color="#fff" />
                <Text style={styles.actionBtnText}>Markup</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Screen>
    );
  }

  // EDIT MODE
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Markup" showBack onBackPress={handleCancel} />
      <View style={styles.editContainer}>
        <View
          style={[
            styles.canvasWrapper,
            { width: imageWidth, height: displayHeight },
          ]}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: imageWidth, height: displayHeight }}
            resizeMode="contain"
          />
          <MarkupCanvas
            annotations={annotations}
            currentAnnotation={currentAnnotation}
            width={imageWidth}
            height={displayHeight}
          />
        </View>
      </View>

      <MarkupToolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saveAnnotationsMutation.isPending}
      />

      {/* Text input modal */}
      <Modal
        visible={textModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTextModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text</Text>
            <TextInput
              style={styles.modalInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type annotation text..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleTextConfirm}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setTextModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTextConfirm}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrapper: {
      position: 'relative',
    },
    image: {
      // width and height set inline
    },
    captionContainer: {
      position: 'absolute',
      bottom: 100,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 8,
      padding: spacing.md,
    },
    caption: {
      color: '#fff',
      fontSize: 14,
      textAlign: 'center',
    },
    bottomActions: {
      position: 'absolute',
      bottom: spacing.xl,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xl,
    },
    actionBtn: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    editContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    canvasWrapper: {
      position: 'relative',
    },
    // Text modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      width: SCREEN_WIDTH - spacing.xl * 2,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    modalCancelBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalConfirmBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    modalConfirmText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.white,
    },
  });
