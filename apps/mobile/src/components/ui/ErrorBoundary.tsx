import React, { Component, ErrorInfo, ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { useTheme, type ThemeColors, spacing, createTypography } from '../../theme';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  title,
  message,
  onReset,
}: {
  title: string;
  message: string;
  onReset: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      <Text style={[typography.bodySmall, styles.message]}>{message}</Text>
      <Button title="Try Again" onPress={onReset} variant="primary" />
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title={this.props.fallbackTitle || 'Something went wrong'}
          message={this.state.error?.message || 'An unexpected error occurred'}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
