import { useCallback, useMemo, useState, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useStableCallback, useDebouncedCallback } from '@/lib/optimization-utils';
import { useNotificationActions, notificationHelpers } from '@/stores/notification-store';
import { TimeoutError, NetworkError } from '@/types/common';
import type { ChatError, ConversationStats, ChatConversation } from '@/types/chat';

/**
 * Custom hook for chat functionality with optimized selectors
 * Provides convenient methods for chat operations with enhanced error handling
 */
export function useChat() {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortedByTimeoutRef = useRef<boolean>(false);
  const { error: notificationError, success: notificationSuccess } = useNotificationActions();
  // NOTE:
  // We intentionally use a single call to the zustand hook instead of a custom selector
  // because unit tests mock the store with a plain function that returns a state object
  // (without getState/subscribe). This keeps the hook compatible with tests and runtime.
  const state = useChatStore();
  const {
    currentConversation,
    conversations,
    isLoading,
    isStreaming,
    isWaitingForResponse,
    error,
    sendMessage,
    retryMessage,
    startNewConversation,
    loadConversation,
    loadConversationHistory,
    setCurrentConversation,
    clearError,
    deleteConversation,
    renameConversation,
    searchConversations,
    getConversationStats,
    getCurrentMessages,
    getConversationById,
    getFilteredConversations,
    messages,
  } = state as unknown as {
    currentConversation: ChatConversation | null;
    conversations: ChatConversation[];
    isLoading: boolean;
    isStreaming: boolean;
    isWaitingForResponse: boolean;
    error: ChatError | null;
    sendMessage: (message: string) => Promise<void>;
    retryMessage: (messageId: string) => Promise<void>;
    startNewConversation: () => Promise<string>;
    loadConversation: (conversationId: string) => Promise<void>;
    loadConversationHistory: () => Promise<void>;
    setCurrentConversation: (conversation: ChatConversation | null) => void;
    clearError: () => void;
    deleteConversation: (conversationId: string) => Promise<void>;
    renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
    searchConversations: (query: string, limit?: number) => Promise<ChatConversation[]>;
    getConversationStats: () => Promise<ConversationStats>;
    getCurrentMessages: () => Array<any>;
    getConversationById: (id: string) => ChatConversation | undefined;
    getFilteredConversations: (filter: string) => ChatConversation[];
    messages?: Array<any>;
  };

  // Enhanced message sending with timeout control and error handling
  const handleSendMessage = useStableCallback(async (message: string) => {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (isSending) {
      throw new Error('Another message is already being sent');
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    abortedByTimeoutRef.current = false;

    setIsSending(true);
    setSendError(null);

    try {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        abortedByTimeoutRef.current = true;
        controller.abort();
      }, 30000); // 30 second timeout

      try {
        await sendMessage(message);
        clearTimeout(timeoutId);
        
        // Success notification
        notificationSuccess(
          'Message sent',
          'Your message has been sent successfully'
        );
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle different error types
        let errorMessage = 'Failed to send message';
        let canRetry = true;

        if (controller.signal.aborted) {
          if (abortedByTimeoutRef.current) {
            errorMessage = 'Network timeout - please try again';
            setSendError(errorMessage);
            notificationHelpers.networkTimeout(() => handleSendMessage(message));
            throw new TimeoutError(errorMessage);
          } else {
            // Manual cancellation: set error and do not throw
            setSendError('Send operation cancelled');
            return;
          }
        } else if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network connection failed. Please check your internet connection.';
            setSendError(errorMessage);
            notificationHelpers.networkError(() => handleSendMessage(message));
            throw new NetworkError(errorMessage);
          } else {
            errorMessage = error.message || 'An unexpected error occurred';
            setSendError(errorMessage);
            notificationHelpers.sendMessageFailed(
              canRetry ? () => handleSendMessage(message) : undefined
            );
          }
        }
        // If we get here and haven't thrown, rethrow original error to preserve behavior
        if (error) {
          throw error;
        }
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [sendMessage, isSending, notificationError, notificationSuccess]);

  // Optimized handlers with stable callbacks
  const handleRetryMessage = useStableCallback(async (messageId: string) => {
    try {
      await retryMessage(messageId);
    } catch (error) {
      console.error('Failed to retry message:', error);
      throw error;
    }
  }, [retryMessage]);

  const handleNewConversation = useStableCallback(async () => {
    try {
      const conversationId = await startNewConversation();
      return conversationId;
    } catch (error) {
      console.error('Failed to start new conversation:', error);
      throw error;
    }
  }, [startNewConversation]);

  const handleLoadConversation = useStableCallback(async (conversationId: string) => {
    try {
      await loadConversation(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }, [loadConversation]);

  const handleRefreshHistory = useStableCallback(async () => {
    try {
      await loadConversationHistory();
    } catch (error) {
      console.error('Failed to refresh conversation history:', error);
      throw error;
    }
  }, [loadConversationHistory]);

  const handleDeleteConversation = useStableCallback(async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [deleteConversation]);

  const handleRenameConversation = useStableCallback(async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      throw new Error('Conversation title cannot be empty');
    }
    
    try {
      await renameConversation(conversationId, newTitle.trim());
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      throw error;
    }
  }, [renameConversation]);

  // Debounced search to prevent excessive API calls
  const handleSearchConversations = useDebouncedCallback(async (query: string, limit?: number) => {
    if (!query.trim()) {
      return [];
    }
    
    try {
      return await searchConversations(query.trim(), limit);
    } catch (error) {
      console.error('Failed to search conversations:', error);
      throw error;
    }
  }, 300);

  const handleGetStats = useStableCallback(async () => {
    try {
      return await getConversationStats();
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      throw error;
    }
  }, [getConversationStats]);

  // Enhanced send state management
  const canSendMessage = useMemo(() => !isLoading && !isStreaming && !isSending, [isLoading, isStreaming, isSending]);
  
  // Clear send error function
  const clearSendError = useCallback(() => {
    setSendError(null);
  }, []);
  
  // Cancel current send operation
  const cancelSend = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSending(false);
      setSendError('Send operation cancelled');
    }
  }, []);
  
  // Prefer store-provided messages (tests mock this),
  // otherwise fall back to the computed selector if available
  const computedMessages = useMemo(() => {
    try {
      return typeof getCurrentMessages === 'function' ? getCurrentMessages() : [];
    } catch {
      return [];
    }
  }, [getCurrentMessages]);

  const resolvedMessages = Array.isArray(messages) ? messages : computedMessages;
  const hasMessages = useMemo(() => resolvedMessages.length > 0, [resolvedMessages.length]);
  
  const canRetry = useMemo(() => error?.retryable === true, [error?.retryable]);
  
  // Memoized conversation finder
  const findConversation = useCallback((id: string) => getConversationById(id), [getConversationById]);
  
  // Memoized conversation filter
  const filterConversations = useCallback((filter: string) => getFilteredConversations(filter), [getFilteredConversations]);

  // Memoized error message formatter
  const getErrorMessage = useMemo(() => {
    return (error: ChatError | null): string => {
      if (!error) return '';
      
      switch (error.type) {
        case 'network':
          return 'Network connection failed. Please check your internet connection and try again.';
        case 'auth':
          return 'Authentication failed. Please log in again.';
        case 'validation':
          return 'Invalid input. Please check your message and try again.';
        case 'server':
          return error.message || 'Server error occurred. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    };
  }, []);

  return {
    // State
    currentConversation,
    conversations,
    messages: resolvedMessages,
    isLoading,
    isStreaming,
    isWaitingForResponse,
    isSending,
    error,
    sendError,
    canSendMessage,
    hasMessages,
    canRetry,

    // Actions
    sendMessage: handleSendMessage,
    retryMessage: handleRetryMessage,
    startNewConversation: handleNewConversation,
    loadConversation: handleLoadConversation,
    refreshHistory: handleRefreshHistory,
    setCurrentConversation,
    clearError,
    clearSendError,
    cancelSend,
    
    // Conversation management
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    searchConversations: handleSearchConversations,
    getConversationStats: handleGetStats,
    
    // Optimized helpers
    findConversation,
    filterConversations,
    getErrorMessage,
  };
}