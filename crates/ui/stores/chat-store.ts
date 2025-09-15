import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ChatConversation, ChatMessage, SendMessageRequest } from '@/types/chat';

interface ChatState {
  // Current conversation state
  currentConversation: ChatConversation | null;
  conversations: ChatConversation[];
  
  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (message: string, conversationId?: string) => Promise<void>;
  startNewConversation: () => Promise<string>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadConversationHistory: () => Promise<void>;
  setCurrentConversation: (conversation: ChatConversation | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  // Send a message to the current conversation
  sendMessage: async (message: string, conversationId?: string) => {
    const state = get();
    
    try {
      set({ isLoading: true, isStreaming: true, error: null });

      // Use existing conversation ID or create new one
      const targetConversationId = conversationId || state.currentConversation?.id;

      const request: SendMessageRequest = {
        message,
        conversationId: targetConversationId,
      };

      // Add user message to current conversation immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      // Update current conversation with user message
      if (state.currentConversation) {
        const updatedConversation = {
          ...state.currentConversation,
          messages: [...state.currentConversation.messages, userMessage],
          updatedAt: new Date(),
        };
        set({ currentConversation: updatedConversation });
      }

      // Prepare streaming listener
      let unlisten: UnlistenFn | null = null;
      let assistantMessageId = `assistant-${Date.now()}`;
      let accumulated = '';

      try {
        unlisten = await listen<any>('message_chunk', (event) => {
          const chunk = event.payload as any;
          if (!chunk || (chunk.conversation_id && state.currentConversation && chunk.conversation_id !== state.currentConversation.id)) {
            return;
          }

          accumulated += chunk.content || '';

          // Append or update assistant message
          set((s) => {
            const base = s.currentConversation ?? {
              id: chunk.conversation_id || state.currentConversation?.id || `conv-${Date.now()}`,
              title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
              messages: [userMessage],
              createdAt: new Date(),
              updatedAt: new Date(),
            } as ChatConversation;

            const exists = base.messages.find((m) => m.id === assistantMessageId);
            const assistantMsg: ChatMessage = exists ? {
              ...exists,
              content: accumulated,
              timestamp: new Date(),
            } : {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulated,
              timestamp: new Date(),
            };

            const nextMessages = exists
              ? base.messages.map((m) => (m.id === assistantMessageId ? assistantMsg : m))
              : [...base.messages, assistantMsg];

            return {
              currentConversation: {
                ...base,
                messages: nextMessages,
                updatedAt: new Date(),
              },
            };
          });

          if (chunk.is_complete) {
            set({ isStreaming: false, isLoading: false });
            if (unlisten) {
              unlisten();
              unlisten = null;
            }
          }
        });

        // Start streaming send
        await invoke('send_message_stream', {
          message,
          conversation_id: targetConversationId,
        });
      } finally {
        // Ensure cleanup on error
        if (unlisten) {
          unlisten();
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        isStreaming: false,
      });
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
        error: error instanceof Error ? error.message : 'Failed to start new conversation',
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
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoading: false,
      });
    }
  },

  // Load conversation history
  loadConversationHistory: async () => {
    try {
      const summaries = await invoke<any[]>('get_all_conversations');
      const conversations: ChatConversation[] = (summaries || []).map((s) => ({
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
        error: error instanceof Error ? error.message : 'Failed to load conversation history'
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
}));