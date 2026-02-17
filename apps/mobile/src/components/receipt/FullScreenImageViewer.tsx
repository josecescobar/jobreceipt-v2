import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 150;

interface FullScreenImageViewerProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function FullScreenImageViewer({ visible, uri, onClose }: FullScreenImageViewerProps) {
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetAndClose = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onClose();
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        // When not zoomed, track vertical drag for dismiss
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Dismiss if dragged past threshold
        if (Math.abs(translateY.value) > DISMISS_THRESHOLD) {
          runOnJS(resetAndClose)();
        } else {
          translateY.value = withSpring(0);
        }
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = scale.value <= 1
      ? Math.max(0.6, 1 - Math.abs(translateY.value) / (SCREEN_HEIGHT * 0.5))
      : 1;
    return { opacity };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={resetAndClose}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={resetAndClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.closeCircle}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Zoomable image */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
