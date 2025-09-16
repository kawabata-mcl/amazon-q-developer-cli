import { useCallback, useMemo } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useStableCallback, useDebouncedCallback, useSelector } from '@/lib/optimization-utils';
import type { ChatError, ConversationStats, ChatConversation } from '@/types/chat';

/**
 * Custom hook for chat functionality with optimized selectors
 * Provides convenient methods for chat operations
 */
export function useChat() {
  // Use optimized selectors to prevent unnecessary re-renders
  const currentConversation = useSelector(
    useChatStore,
    (state) => state.currentConversation,
    (a, b) => a?.id === b?.id && a?.updatedAt.getTime() === b?.updatedAt.getTime()
  );
  
  const conversations = useSelector(
    useChatStore,
    (state) => state.conversations,
    (a, b) => a.length === b.length && a.every((conv, i) => conv.id === b[i]?.id)
  );
  
  const isLoading = useSelector(useChatStore, (state) => state.isLoading);
  const isStreaming = useSelector(useChatStore, (state) => state.isStreaming);
  const error = useSelector(useChatStore, (state) => state.error);
  
  // Get actions from store
  const {
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
  } = useChatStore();

  // Optimized message sending with debouncing to prevent rapid submissions
  const handleSendMessage = useStableCallback(async (message: string) => {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [sendMessage]);

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
  }, 300, [searchConversations]);

  const handleGetStats = useStableCallback(async () => {
    try {
      return await getConversationStats();
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      throw error;
    }
  }, [getConversationStats]);

  // Memoized computed values to prevent unnecessary recalculations
  const canSendMessage = useMemo(() => !isLoading && !isStreaming, [isLoading, isStreaming]);
  
  const messages = useMemo(() => getCurrentMessages(), [getCurrentMessages]);
  
  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);
  
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
          return 'Server error occurred. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    };
  }, []);

  return {
    // State
    currentConversation,
    conversations,
    messages,
    isLoading,
    isStreaming,
    error,
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