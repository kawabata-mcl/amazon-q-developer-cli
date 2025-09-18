import { safeInvoke } from '@/lib/tauri-env';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { startNewConversationCommand, getConversationHistoryCommand, getAllConversationsCommand, sendMessageStreamCommand } from '@/lib/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { AsyncOperationManager, createMemoizer, shallowEqual } from '@/lib/optimization-utils';
import type { 
  ChatConversation, 
  ChatMessage, 
  ChatError, 
  StreamChunk,
  MessageStatus,
  ConversationStats
} from '@/types/chat';

// Helper function to check if operation was cancelled
function checkCancellation(signal: AbortSignal): boolean {
  if (signal.aborted) {
    console.log('Operation was cancelled');
    return true;
  }
  return false;
}

interface ChatState {
  // Current conversation state
  currentConversation: ChatConversation | null;
  conversations: ChatConversation[];
  messages: ChatMessage[];
  
  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: ChatError | null;
  
  // Message state tracking
  pendingMessages: Map<string, ChatMessage>;
  
  // Optimization state
  _asyncManager: AsyncOperationManager;
  _memoizedSelectors: Map<string, unknown>;
  
  // Actions
  sendMessage: (message: string, conversationId?: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  startNewConversation: () => Promise<string>;
  loadConversation: (conversationId: string) => Promise<void>;
  // Keep legacy name for compatibility while providing the implemented one
  loadConversationHistory?: () => Promise<void>;
  setCurrentConversation: (conversation: ChatConversation | null) => void;
  clearError: () => void;
  
  // Conversation management
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  searchConversations: (query: string, limit?: number) => Promise<ChatConversation[]>;
  getConversationStats: () => Promise<ConversationStats>;
  
  // Internal helpers
  updateMessageStatus: (messageId: string, status: MessageStatus, error?: string) => void;
  addMessageToConversation: (conversationId: string, message: ChatMessage) => void;
  
  // Optimized selectors
  getCurrentMessages: () => ChatMessage[];
  getConversationById: (id: string) => ChatConversation | undefined;
  getFilteredConversations: (filter: string) => ChatConversation[];
  refreshHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => {
    // Create memoized selectors
    const getCurrentMessagesMemo = createMemoizer(
      (conversation: ChatConversation | null) => conversation?.messages || [],
      (a, b) => a?.id === b?.id && a?.updatedAt.getTime() === b?.updatedAt.getTime()
    );
    
    const getConversationByIdMemo = createMemoizer(
      (data: { conversations: ChatConversation[]; id: string }) => 
        data.conversations.find(c => c.id === data.id),
      (a, b) => a.id === b.id && shallowEqual(a.conversations, b.conversations)
    );
    
    const getFilteredConversationsMemo = createMemoizer(
      (data: { conversations: ChatConversation[]; filter: string }) => {
        if (!data.filter.trim()) return data.conversations;
        const lowerFilter = data.filter.toLowerCase();
        return data.conversations.filter(c => 
          c.title.toLowerCase().includes(lowerFilter) ||
          c.messages.some(m => m.content.toLowerCase().includes(lowerFilter))
        );
      },
      (a, b) => a.filter === b.filter && shallowEqual(a.conversations, b.conversations)
    );

    return {
      // Initial state
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      pendingMessages: new Map(),
      _asyncManager: new AsyncOperationManager(),
      _memoizedSelectors: new Map(),

      // Optimized selectors
      getCurrentMessages: () => {
        const state = get();
        return getCurrentMessagesMemo(state.currentConversation);
      },
      
      getConversationById: (id: string) => {
        const state = get();
        return getConversationByIdMemo({ conversations: state.conversations, id });
      },
      
      getFilteredConversations: (filter: string) => {
        const state = get();
        return getFilteredConversationsMemo({ conversations: state.conversations, filter });
      },

      // Send a message to the current conversation
      sendMessage: async (message: string, conversationId?: string) => {
        const state = get();
        
        if (!message.trim()) {
          throw new Error('Message cannot be empty');
        }

        // Generate unique IDs
        const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use async operation manager to handle concurrent requests
        return state._asyncManager.execute(
          `send-message-${conversationId || 'new'}`,
          async (signal) => {
            try {
              set({ isLoading: true, error: null });

              // Check if operation was cancelled
              if (checkCancellation(signal)) {
                throw new Error('Operation cancelled');
              }

              // Use existing conversation ID or create new one
              let targetConversationId = conversationId || state.currentConversation?.id;
              if (!targetConversationId) {
                // Ensure a conversation exists before sending/streaming
                try {
                  targetConversationId = await startNewConversationCommand();
                  
                  if (checkCancellation(signal)) {
                    return; // Silently return instead of throwing
                  }
                  
                  set({
                    currentConversation: {
                      id: targetConversationId,
                      title: 'New Conversation',
                      messages: [],
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  });
                } catch {
                  throw new Error('Failed to start a new conversation');
                }
              }

              // Create user message with sending status
              const userMessage: ChatMessage = {
                id: userMessageId,
                role: 'user',
                content: message,
                timestamp: new Date(),
                status: 'sending',
              };

              // Add user message to conversation immediately
              get().addMessageToConversation(targetConversationId, userMessage);
              set((s) => ({ messages: [...s.messages, userMessage] }));

              // Update user message status to sent
              get().updateMessageStatus(userMessageId, 'sent');

              // Prepare streaming
              set({ isStreaming: true });
              let unlisten: UnlistenFn | null = null;
              let accumulated = '';
              let streamError: string | null = null;
              let receivedAnyChunk = false;
              let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

              // Ensure a placeholder assistant message exists immediately for better UX
              {
                const latest = get();
                const conv = latest.currentConversation;
                if (conv) {
                  const exists = conv.messages.some(m => m.id === assistantMessageId);
                  if (!exists) {
                    const assistantMessage: ChatMessage = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      status: 'streaming',
                    };
                    set((s) => ({
                      currentConversation: s.currentConversation ? {
                        ...s.currentConversation,
                        messages: [...(s.currentConversation.messages || []), assistantMessage],
                        updatedAt: new Date(),
                      } : null,
                      messages: [...s.messages, assistantMessage],
                    }));
                  }
                }
              }

              try {
                // Listen for streaming chunks on conversation-specific channel
                const eventName = `message_chunk_${targetConversationId}`;
                console.log('[chat-store] listen: subscribing', {
                  eventName,
                  targetConversationId,
                  userMessageId,
                  assistantMessageId,
                });
                unlisten = await listen<StreamChunk>(eventName, (event) => {
                  console.log('[chat-store] chunk received', {
                    eventName,
                    conversation_id: event.payload?.conversation_id,
                    chunk_id: event.payload?.chunk_id,
                    is_complete: event.payload?.is_complete,
                    content_len: (event.payload?.content || '').length,
                    has_error: !!event.payload?.error,
                  });
                  receivedAnyChunk = true;
                  const chunk = event.payload;
                  // Channel is scoped by conversation id; no extra filtering needed

                  // Handle error in chunk
                  if (chunk.error) {
                    streamError = chunk.error;
                    const latest = get();
                    const conv = latest.currentConversation;
                    if (conv) {
                      const existing = conv.messages.find(m => m.id === assistantMessageId);
                      if (existing) {
                        get().updateMessageStatus(assistantMessageId, 'failed', chunk.error);
                      } else {
                        const assistantMessage: ChatMessage = {
                          id: assistantMessageId,
                          role: 'assistant',
                          content: '',
                          timestamp: new Date(),
                          status: 'failed',
                          error: chunk.error,
                        };
                        get().addMessageToConversation(conv.id, assistantMessage);
                      }
                    }
                    return;
                  }

                  // Accumulate content
                  accumulated += chunk.content || '';

                  // Update or create assistant message
                  const currentState = get();
                  const conversation = currentState.currentConversation;
                  
                  if (conversation) {
                    const existingMessage = conversation.messages.find(m => m.id === assistantMessageId);
                    
                    if (existingMessage) {
                      // Update existing message
                      set((s) => ({
                        currentConversation: s.currentConversation ? {
                          ...s.currentConversation,
                          messages: s.currentConversation.messages.map(m => 
                            m.id === assistantMessageId 
                              ? { ...m, content: accumulated, status: 'streaming', timestamp: new Date() }
                              : m
                          ),
                          updatedAt: new Date(),
                        } : null,
                        messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: accumulated, status: 'streaming', timestamp: new Date() } : m),
                      }));
                    } else {
                      // Create new assistant message
                      const assistantMessage: ChatMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: accumulated,
                        timestamp: new Date(),
                        status: 'streaming',
                      };
                      set((s) => ({
                        currentConversation: s.currentConversation ? {
                          ...s.currentConversation,
                          messages: [...(s.currentConversation.messages || []), assistantMessage],
                          updatedAt: new Date(),
                        } : null,
                        messages: [...s.messages, assistantMessage],
                      }));
                    }
                  }

                  // Handle completion
                  if (chunk.is_complete) {
                    if (streamError) {
                      get().updateMessageStatus(assistantMessageId, 'failed', streamError);
                      set({ 
                        error: {
                          type: 'server',
                          message: 'Failed to complete message',
                          details: streamError,
                          retryable: true,
                        },
                        isStreaming: false,
                        isLoading: false,
                      });
                    } else {
                      console.log('[chat-store] stream completed', { eventName, assistantMessageId, accumulated_len: accumulated.length });
                      get().updateMessageStatus(assistantMessageId, 'completed');
                      set({ isStreaming: false, isLoading: false });
                    }
                    
                    if (unlisten) {
                      console.log('[chat-store] unlisten on complete', { eventName });
                      unlisten();
                      unlisten = null;
                    }
                    if (fallbackTimer) {
                      clearTimeout(fallbackTimer);
                      fallbackTimer = null;
                    }
                  }
                });

                // Start streaming with the active conversation id and capture actual id
                const actualConvId = await sendMessageStreamCommand(message, targetConversationId);
                if (actualConvId && actualConvId !== targetConversationId) {
                  console.warn('[chat-store] conversation id mismatch', { expected: targetConversationId, actual: actualConvId });
                  // Re-subscribe to the correct event channel
                  const newEventName = `message_chunk_${actualConvId}`;
                  if (unlisten) {
                    unlisten();
                    unlisten = null;
                  }
                  unlisten = await listen<StreamChunk>(newEventName, (event) => {
                    // Reuse the same handler by delegating to the existing code path
                    const chunk = event.payload;
                    console.log('[chat-store] chunk received (resubscribed)', {
                      eventName: newEventName,
                      conversation_id: chunk?.conversation_id,
                      chunk_id: chunk?.chunk_id,
                      is_complete: chunk?.is_complete,
                      content_len: (chunk?.content || '').length,
                      has_error: !!chunk?.error,
                    });
                    // Duplicate of handler: accumulate and update state
                    if (chunk.error) {
                      streamError = chunk.error;
                      const latest = get();
                      const conv = latest.currentConversation;
                      if (conv) {
                        const existing = conv.messages.find(m => m.id === assistantMessageId);
                        if (existing) {
                          get().updateMessageStatus(assistantMessageId, 'failed', chunk.error);
                        } else {
                          const assistantMessage: ChatMessage = {
                            id: assistantMessageId,
                            role: 'assistant',
                            content: '',
                            timestamp: new Date(),
                            status: 'failed',
                            error: chunk.error,
                          };
                          get().addMessageToConversation(conv.id, assistantMessage);
                        }
                      }
                      return;
                    }
                    receivedAnyChunk = true;
                    accumulated += chunk.content || '';
                    const currentState = get();
                    const conversation = currentState.currentConversation;
                    if (conversation) {
                      const existingMessage = conversation.messages.find(m => m.id === assistantMessageId);
                      if (existingMessage) {
                        set((s) => ({
                          currentConversation: s.currentConversation ? {
                            ...s.currentConversation,
                            messages: s.currentConversation.messages.map(m => m.id === assistantMessageId
                              ? { ...m, content: accumulated, status: 'streaming', timestamp: new Date() }
                              : m
                            ),
                            updatedAt: new Date(),
                          } : null,
                          messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: accumulated, status: 'streaming', timestamp: new Date() } : m),
                        }));
                      } else {
                        const assistantMessage: ChatMessage = {
                          id: assistantMessageId,
                          role: 'assistant',
                          content: accumulated,
                          timestamp: new Date(),
                          status: 'streaming',
                        };
                        set((s) => ({
                          currentConversation: s.currentConversation ? {
                            ...s.currentConversation,
                            messages: [...(s.currentConversation.messages || []), assistantMessage],
                            updatedAt: new Date(),
                          } : null,
                          messages: [...s.messages, assistantMessage],
                        }));
                      }
                    }
                    if (chunk.is_complete) {
                      if (streamError) {
                        get().updateMessageStatus(assistantMessageId, 'failed', streamError);
                        set({ 
                          error: { type: 'server', message: 'Failed to complete message', details: streamError, retryable: true },
                          isStreaming: false, isLoading: false,
                        });
                      } else {
                        get().updateMessageStatus(assistantMessageId, 'completed');
                        set({ isStreaming: false, isLoading: false });
                      }
                      if (unlisten) { unlisten(); unlisten = null; }
                      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
                    }
                  });
                }
                // フロント側のフラグは完了チャンクでのみリセットする

                // Fallback: If no chunks arrive within 2s, poll conversation history once
                fallbackTimer = setTimeout(async () => {
                  if (receivedAnyChunk) return;
                  try {
                    const history = await getConversationHistoryCommand(targetConversationId!);
                    const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
                    if (lastAssistant) {
                      // Populate assistant message from history and stop spinner
                      set((s) => ({
                        currentConversation: s.currentConversation ? {
                          ...s.currentConversation,
                          messages: s.currentConversation.messages.some(m => m.id === assistantMessageId)
                            ? s.currentConversation.messages.map(m => m.id === assistantMessageId ? {
                                ...m,
                                content: lastAssistant.content,
                                status: 'completed',
                                timestamp: new Date(lastAssistant.timestamp),
                              } : m)
                            : [...s.currentConversation.messages, {
                                id: assistantMessageId,
                                role: 'assistant',
                                content: lastAssistant.content,
                                timestamp: new Date(lastAssistant.timestamp),
                                status: 'completed',
                              }],
                          updatedAt: new Date(),
                        } : null,
                        messages: s.messages.some(m => m.id === assistantMessageId)
                          ? s.messages.map(m => m.id === assistantMessageId ? {
                              ...m,
                              content: lastAssistant.content,
                              status: 'completed',
                              timestamp: new Date(lastAssistant.timestamp),
                            } : m)
                          : [...s.messages, {
                              id: assistantMessageId,
                              role: 'assistant',
                              content: lastAssistant.content,
                              timestamp: new Date(lastAssistant.timestamp),
                              status: 'completed',
                            }],
                        isStreaming: false,
                        isLoading: false,
                      }));
                      if (unlisten) {
                        unlisten();
                        unlisten = null;
                      }
                    } else {
                      // No chunks and no history: mark as failed and stop spinner
                      set((s) => ({
                        currentConversation: s.currentConversation ? {
                          ...s.currentConversation,
                          messages: s.currentConversation.messages.map(m => m.id === assistantMessageId ? {
                            ...m,
                            status: 'failed',
                            error: 'No response received from stream',
                            timestamp: new Date(),
                          } : m),
                          updatedAt: new Date(),
                        } : null,
                        messages: s.messages.map(m => m.id === assistantMessageId ? {
                          ...m,
                          status: 'failed',
                          error: 'No response received from stream',
                          timestamp: new Date(),
                        } : m),
                        isStreaming: false,
                        isLoading: false,
                        error: {
                          type: 'server',
                          message: 'No response received from stream',
                          retryable: true,
                        },
                      }));
                      if (unlisten) {
                        unlisten();
                        unlisten = null;
                      }
                    }
                  } catch (e) {
                    console.warn('[chat-store] fallback history poll failed', e);
                  }
                }, 2000);

              } catch (invokeError) {
                // Handle invoke error
                const errorMessage = invokeError instanceof Error ? invokeError.message : 'Unknown error';
                get().updateMessageStatus(userMessageId, 'failed', errorMessage);
                
                // Do not rethrow to allow UI/tests to inspect error state without exceptions
                set({
                  error: {
                    type: 'server',
                    message: errorMessage,
                    retryable: true,
                  },
                  isLoading: false,
                  isStreaming: false,
                });
                // Ensure we cleanup the listener on immediate invoke failures
                if (unlisten) {
                  console.log('[chat-store] unlisten on invoke error');
                  unlisten();
                  unlisten = null;
                }
                if (fallbackTimer) {
                  clearTimeout(fallbackTimer);
                  fallbackTimer = null;
                }
              }
            } catch (error) {
              const messageText = error instanceof Error ? error.message : 'Failed to send message';
              set({
                error: {
                  type: 'server',
                  message: messageText,
                  retryable: true,
                },
                isLoading: false,
                isStreaming: false,
              });
              // Error already stored in state
            }
          },
          { cancelPrevious: true, timeout: 30000 }
        );
      },

      // Start a new conversation
      startNewConversation: async () => {
        const state = get();
        
        return state._asyncManager.execute(
          'start-new-conversation',
          async (signal) => {
            try {
              set({ isLoading: true, error: null });

              const conversationId = await startNewConversationCommand();
              
              if (checkCancellation(signal)) {
                // キャンセル時でも生成済みIDを返して処理を穏便に終了
                return conversationId;
              }
              
              const newConversation: ChatConversation = {
                id: conversationId,
                title: 'New Conversation',
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              set({ 
                currentConversation: {
                  id: newConversation.id,
                  title: newConversation.title,
                  messages: [],
                  createdAt: newConversation.createdAt,
                  updatedAt: newConversation.updatedAt,
                },
                messages: [],
                isLoading: false,
              });

              return conversationId;
            } catch (error) {
              console.error('Failed to start new conversation:', error);
              set({ 
                error: {
                  type: 'server',
                  message: error instanceof Error ? error.message : 'Failed to start new conversation',
                  retryable: true,
                },
                isLoading: false,
              });
              throw error;
            }
          },
          { cancelPrevious: true }
        );
      },

      // Load a specific conversation
      loadConversation: async (conversationId: string) => {
        const state = get();
        
        return state._asyncManager.execute(
          `load-conversation-${conversationId}`,
          async (signal) => {
            try {
              set({ isLoading: true, error: null });

              const messages = await getConversationHistoryCommand(conversationId);

              if (checkCancellation(signal)) {
                return; // Silently return instead of throwing
              }

              const conversation: ChatConversation = {
                id: conversationId,
                title: messages.length > 0 ? 
                  messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '') : 
                  'Empty Conversation',
                messages: messages.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                })),
                createdAt: messages.length > 0 ? new Date(messages[0].timestamp) : new Date(),
                updatedAt: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : new Date(),
              };

              set({ 
                currentConversation: conversation,
                messages: conversation.messages,
                isLoading: false,
              });
            } catch (error) {
              console.error('Failed to load conversation:', error);
              set({ 
                error: {
                  type: 'server',
                  message: error instanceof Error ? error.message : 'Failed to load conversation',
                  retryable: true,
                },
                isLoading: false,
              });
            }
          },
          { cancelPrevious: true }
        );
      },

      // Load conversation history
      refreshHistory: async () => {
        const state = get();
        
        return state._asyncManager.execute(
          'load-conversation-history',
          async (signal) => {
            try {
              type ConversationSummary = { id: string; title?: string; created_at?: string; updated_at?: string };
              const summaries = await getAllConversationsCommand();
              
              if (checkCancellation(signal)) {
                return; // Silently return instead of throwing
              }
              
              const conversations = (summaries || []).map((s: ConversationSummary) => ({
                id: s.id,
                title: s.title ?? 'Conversation',
                createdAt: s.created_at ? new Date(s.created_at) : new Date(),
                updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(),
              })) as unknown as ChatConversation[];
              set({ conversations });
            } catch (error) {
              console.error('Failed to load conversation history:', error);
              set({ 
                error: {
                  type: 'server',
                  message: error instanceof Error ? error.message : 'Failed to load conversation history',
                  retryable: true,
                }
              });
            }
          },
          { cancelPrevious: true }
        );
      },

      // Backwards compatibility alias
      loadConversationHistory: async () => {
        await get().refreshHistory();
      },

      // Set current conversation
      setCurrentConversation: (conversation: ChatConversation | null) => {
        set({ currentConversation: conversation });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Retry failed message
      retryMessage: async (messageId: string) => {
    const state = get();
    const conversation = state.currentConversation;
    
    if (!conversation) {
      throw new Error('No active conversation');
    }

    const message = conversation.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'user') {
      throw new Error('Message not found or not retryable');
    }

    // Remove the failed message and any subsequent messages
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    const updatedMessages = conversation.messages.slice(0, messageIndex);
    
    set({
      currentConversation: {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      },
    });

        // Retry sending the message
        await get().sendMessage(message.content, conversation.id);
      },

      // Update message status
      updateMessageStatus: (messageId: string, status: MessageStatus, error?: string) => {
    set((state) => ({
      currentConversation: state.currentConversation ? {
        ...state.currentConversation,
        messages: state.currentConversation.messages.map(m => 
          m.id === messageId 
            ? { ...m, status, error, timestamp: new Date() }
            : m
        ),
        updatedAt: new Date(),
      } : null,
      // Keep top-level messages in sync with conversation messages
      messages: state.messages.map(m => 
        m.id === messageId 
          ? { ...m, status, error, timestamp: new Date() }
          : m
      ),
        }));
      },

      // Delete conversation
      deleteConversation: async (conversationId: string) => {
    try {
      await safeInvoke('delete_conversation', { conversation_id: conversationId });
      
      set((state) => ({
        conversations: state.conversations.filter(c => c.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId 
          ? null 
          : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
          throw error;
        }
      },

      // Rename conversation
      renameConversation: async (conversationId: string, newTitle: string) => {
    try {
      await safeInvoke('rename_conversation', { 
        conversation_id: conversationId, 
        new_title: newTitle 
      });
      
      set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId 
            ? { ...c, title: newTitle, updatedAt: new Date() }
            : c
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, title: newTitle, updatedAt: new Date() }
          : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to rename conversation:', error);
          throw error;
        }
      },

      // Search conversations
      searchConversations: async (query: string, limit?: number) => {
    try {
      const results = await invoke<ChatConversation[]>('search_conversations', { 
        query, 
        limit 
      });
      
      return results.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Failed to search conversations:', error);
          throw error;
        }
      },

      // Get conversation statistics
      getConversationStats: async () => {
    try {
      const stats = await invoke<ConversationStats>('get_conversation_stats');
      return stats;
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
          throw error;
        }
      },

      // Add message to conversation
      addMessageToConversation: (conversationId: string, message: ChatMessage) => {
    set((state) => {
      // If no current conversation or different conversation, create/update it
      if (!state.currentConversation || state.currentConversation.id !== conversationId) {
        const newConversation: ChatConversation = {
          id: conversationId,
          title: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
          messages: [message],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        return {
          currentConversation: newConversation,
          conversations: [
            ...state.conversations.filter(c => c.id !== conversationId),
            newConversation,
          ],
        };
      }

      // Add to existing conversation
      return {
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          messages: [...(state.currentConversation.messages || []), message],
          updatedAt: new Date(),
        } : null,
        };
      });
    },
  };
})
);