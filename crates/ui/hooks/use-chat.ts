import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import type { ChatError } from '@/types/chat';

/**
 * Custom hook for chat functionality
 * Provides convenient methods for chat operations
 */
export function useChat() {
  const {
    currentConversation,
    conversations,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    retryMessage,
    startNewConversation,
    loadConversation,
    loadConversationHistory,
    setCurrentConversation,
    clearError,
  } = useChatStore();

  // Send a message with error handling
  const handleSendMessage = useCallback(async (message: string) => {
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

  // Retry a failed message
  const handleRetryMessage = useCallback(async (messageId: string) => {
    try {
      await retryMessage(messageId);
    } catch (error) {
      console.error('Failed to retry message:', error);
      throw error;
    }
  }, [retryMessage]);

  // Start a new conversation with error handling
  const handleNewConversation = useCallback(async () => {
    try {
      const conversationId = await startNewConversation();
      return conversationId;
    } catch (error) {
      console.error('Failed to start new conversation:', error);
      throw error;
    }
  }, [startNewConversation]);

  // Load a specific conversation
  const handleLoadConversation = useCallback(async (conversationId: string) => {
    try {
      await loadConversation(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }, [loadConversation]);

  // Refresh conversation history
  const handleRefreshHistory = useCallback(async () => {
    try {
      await loadConversationHistory();
    } catch (error) {
      console.error('Failed to refresh conversation history:', error);
      throw error;
    }
  }, [loadConversationHistory]);

  // Check if we can send messages
  const canSendMessage = !isLoading && !isStreaming;

  // Get current conversation messages
  const messages = currentConversation?.messages || [];

  // Check if there are any messages
  const hasMessages = messages.length > 0;

  // Check if error is retryable
  const canRetry = error?.retryable === true;

  // Get error message for display
  const getErrorMessage = useCallback((error: ChatError | null): string => {
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
    
    // Helpers
    getErrorMessage,
  };
}