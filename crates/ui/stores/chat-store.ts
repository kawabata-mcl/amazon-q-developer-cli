import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { 
  ChatConversation, 
  ChatMessage, 
  ChatError, 
  StreamChunk,
  MessageStatus 
} from '@/types/chat';

interface ChatState {
  // Current conversation state
  currentConversation: ChatConversation | null;
  conversations: ChatConversation[];
  
  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: ChatError | null;
  
  // Message state tracking
  pendingMessages: Map<string, ChatMessage>;
  
  // Actions
  sendMessage: (message: string, conversationId?: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  startNewConversation: () => Promise<string>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadConversationHistory: () => Promise<void>;
  setCurrentConversation: (conversation: ChatConversation | null) => void;
  clearError: () => void;
  
  // Internal helpers
  updateMessageStatus: (messageId: string, status: MessageStatus, error?: string) => void;
  addMessageToConversation: (conversationId: string, message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  pendingMessages: new Map(),

  // Send a message to the current conversation
  sendMessage: async (message: string, conversationId?: string) => {
    const state = get();
    
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Generate unique IDs
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      set({ isLoading: true, error: null });

      // Use existing conversation ID or create new one
      let targetConversationId = conversationId || state.currentConversation?.id;
      if (!targetConversationId) {
        // Ensure a conversation exists before sending/streaming
        try {
          targetConversationId = await invoke<string>('start_new_conversation');
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

      // Update user message status to sent
      get().updateMessageStatus(userMessageId, 'sent');

      // Prepare streaming
      set({ isStreaming: true });
      let unlisten: UnlistenFn | null = null;
      let accumulated = '';
      let streamError: string | null = null;

      try {
        // Listen for streaming chunks
        unlisten = await listen<StreamChunk>('message_chunk', (event) => {
          const chunk = event.payload;
          
          // Check if chunk belongs to current conversation
          const latestState = get();
          if (chunk.conversation_id && 
              latestState.currentConversation && 
              chunk.conversation_id !== latestState.currentConversation.id) {
            return;
          }

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
              get().updateMessageStatus(assistantMessageId, 'streaming');
              set((s) => ({
                currentConversation: s.currentConversation ? {
                  ...s.currentConversation,
                  messages: s.currentConversation.messages.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, content: accumulated, timestamp: new Date() }
                      : m
                  ),
                  updatedAt: new Date(),
                } : null,
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
              get().addMessageToConversation(conversation.id, assistantMessage);
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
              get().updateMessageStatus(assistantMessageId, 'completed');
              set({ isStreaming: false, isLoading: false });
            }
            
            if (unlisten) {
              unlisten();
              unlisten = null;
            }
          }
        });

        // Start streaming
        await invoke('send_message_stream', {
          message,
          conversation_id: targetConversationId,
        });

      } catch (invokeError) {
        // Handle invoke error
        const errorMessage = invokeError instanceof Error ? invokeError.message : 'Unknown error';
        get().updateMessageStatus(userMessageId, 'failed', errorMessage);
        
        throw new Error(`Failed to send message: ${errorMessage}`);
      } finally {
        // Cleanup listener
        if (unlisten) {
          unlisten();
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Determine error type
      let errorType: ChatError['type'] = 'unknown';
      let retryable = true;
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorType = 'network';
        } else if (error.message.includes('auth')) {
          errorType = 'auth';
          retryable = false;
        } else if (error.message.includes('validation')) {
          errorType = 'validation';
          retryable = false;
        } else if (error.message.includes('server')) {
          errorType = 'server';
        }
      }

      set({ 
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : 'Failed to send message',
          retryable,
        },
        isLoading: false,
        isStreaming: false,
      });
      
      throw error;
    }
  },

  // Start a new conversation
  startNewConversation: async () => {
    try {
      set({ isLoading: true, error: null });

      const conversationId = await invoke<string>('start_new_conversation');
      
      const newConversation: ChatConversation = {
        id: conversationId,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set({ 
        currentConversation: newConversation,
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

  // Load a specific conversation
  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });

      const messages = await invoke<ChatMessage[]>('get_conversation_history', { 
        conversation_id: conversationId 
      });

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

  // Load conversation history
  loadConversationHistory: async () => {
    try {
      type ConversationSummary = { id: string; title?: string; created_at?: string; updated_at?: string };
      const summaries = await invoke<ConversationSummary[]>('get_all_conversations');
      const conversations: ChatConversation[] = (summaries || []).map((s: ConversationSummary) => ({
        id: s.id,
        title: s.title ?? 'Conversation',
        messages: [],
        createdAt: s.created_at ? new Date(s.created_at) : new Date(),
        updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(),
      }));
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
    }));
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
        currentConversation: {
          ...state.currentConversation,
          messages: [...state.currentConversation.messages, message],
          updatedAt: new Date(),
        },
      };
    });
  },
}));