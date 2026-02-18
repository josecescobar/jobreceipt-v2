import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../../src/components/layout';
import {
  useMessages,
  useSendMessage,
  useMarkRead,
  messageKeys,
} from '../../../src/hooks/useMessages';
import { messagesApi } from '../../../src/api/messages';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';
import type { Message } from '@jobreceipt/shared';

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday ${time}`;

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} ${time}`;
}

export default function ChatScreen() {
  const { jobId, jobName } = useLocalSearchParams<{
    jobId: string;
    jobName?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useMessages(jobId!);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const [inputText, setInputText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mark as read on mount and focus
  useFocusEffect(
    useCallback(() => {
      if (jobId) {
        markRead.mutate(jobId);
      }
    }, [jobId]),
  );

  const handleSend = useCallback(() => {
    const body = inputText.trim();
    if (!body || !jobId) return;

    setInputText('');
    sendMessage.mutate({ jobId, body });
  }, [inputText, jobId, sendMessage]);

  const handleLoadMore = useCallback(async () => {
    if (!messages || messages.length === 0 || loadingMore) return;

    // The list is inverted, so "oldest" messages are at the end of the array
    const oldest = messages[messages.length - 1];
    if (!oldest) return;

    setLoadingMore(true);
    try {
      const olderMessages = await messagesApi.getByJob({
        jobId: jobId!,
        before: oldest.createdAt,
        limit: 50,
      });

      if (olderMessages.length > 0) {
        queryClient.setQueryData(
          messageKeys.byJob(jobId!),
          (old: Message[] | undefined) => [...(old ?? []), ...olderMessages],
        );
      }
    } finally {
      setLoadingMore(false);
    }
  }, [messages, jobId, loadingMore, queryClient]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.senderId === userId;

      return (
        <View
          style={[
            styles.messageBubbleRow,
            isMine ? styles.myRow : styles.theirRow,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMine ? styles.myBubble : styles.theirBubble,
            ]}
          >
            {!isMine && item.sender?.name && (
              <Text style={styles.senderName}>{item.sender.name}</Text>
            )}
            <Text
              style={[
                styles.messageBody,
                isMine ? styles.myMessageBody : styles.theirMessageBody,
              ]}
            >
              {item.body}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMine ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    },
    [userId, styles],
  );

  return (
    <>
      <Stack.Screen options={{ title: jobName || 'Chat' }} />
      <Screen padded={false} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {jobName || 'Messages'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Messages */}
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages ?? []}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.messagesList}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.loadingMore}
                  />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    No messages yet. Send the first one!
                  </Text>
                </View>
              }
            />
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessage.isPending}
              activeOpacity={0.7}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 56,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      minHeight: 48,
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesList: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    messageBubbleRow: {
      marginVertical: 4,
      flexDirection: 'row',
    },
    myRow: {
      justifyContent: 'flex-end',
    },
    theirRow: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    myBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    theirBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    senderName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    messageBody: {
      fontSize: 15,
      lineHeight: 20,
    },
    myMessageBody: {
      color: '#FFFFFF',
    },
    theirMessageBody: {
      color: colors.text,
    },
    messageTime: {
      fontSize: 11,
      marginTop: 4,
    },
    myMessageTime: {
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'right',
    },
    theirMessageTime: {
      color: colors.textMuted,
    },
    loadingMore: {
      paddingVertical: spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
      // Inverted list: empty state shown upside-down, so rotate
      transform: [{ scaleY: -1 }],
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
  });
