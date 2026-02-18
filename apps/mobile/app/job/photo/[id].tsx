import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Header } from '../../../src/components/layout';
import { useTheme, type ThemeColors, spacing } from '../../../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const { id, imageUrl, caption } = useLocalSearchParams<{
    id: string;
    imageUrl: string;
    caption?: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Photo" showBack />
      <View style={styles.container}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
        {caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{caption}</Text>
          </View>
        ) : null}
      </View>
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
    image: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.75,
    },
    captionContainer: {
      position: 'absolute',
      bottom: spacing.xl,
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
  });
