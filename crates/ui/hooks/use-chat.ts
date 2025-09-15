import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

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

    // Actions
    sendMessage: handleSendMessage,
    startNewConversation: handleNewConversation,
    loadConversation: handleLoadConversation,
    refreshHistory: handleRefreshHistory,
    setCurrentConversation,
    clearError,
  };
}