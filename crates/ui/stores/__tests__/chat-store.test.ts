import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

// Mock Tauri API
jest.mock('@/lib/tauri', () => ({
  sendMessageStreamCommand: jest.fn(),
  startNewConversationCommand: jest.fn(),
  getConversationHistoryCommand: jest.fn(),
  getAllConversationsCommand: jest.fn(),
}));

// Mock Tauri events
jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(),
}));

import { useChatStore } from '@/stores/chat-store';
import {
  sendMessageStreamCommand,
  startNewConversationCommand,
  getConversationHistoryCommand,
  getAllConversationsCommand,
} from '@/lib/tauri';
import { listen } from '@tauri-apps/api/event';

const mockSendMessageStreamCommand = sendMessageStreamCommand as jest.MockedFunction<typeof sendMessageStreamCommand>;
const mockStartNewConversationCommand = startNewConversationCommand as jest.MockedFunction<typeof startNewConversationCommand>;
const mockGetConversationHistoryCommand = getConversationHistoryCommand as jest.MockedFunction<typeof getConversationHistoryCommand>;
const mockGetAllConversationsCommand = getAllConversationsCommand as jest.MockedFunction<typeof getAllConversationsCommand>;
const mockListen = listen as jest.MockedFunction<typeof listen>;

describe('chat-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useChatStore.setState({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
    });
  });

  test('should have correct initial state', () => {
    const state = useChatStore.getState();
    
    expect(state.currentConversation).toBeNull();
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isStreaming).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should start new conversation successfully', async () => {
    const mockConversationId = 'conv-123';
    mockStartNewConversationCommand.mockResolvedValue(mockConversationId);

    let result: string | undefined;
    await act(async () => {
      result = await useChatStore.getState().startNewConversation();
    });

    expect(result).toBe(mockConversationId);
    expect(mockStartNewConversationCommand).toHaveBeenCalled();
    
    const state = useChatStore.getState();
    expect(state.currentConversation).toMatchObject({
      id: mockConversationId,
      title: 'New Conversation',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(state.messages).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle start new conversation failure', async () => {
    const errorMessage = 'Failed to start conversation';
    mockStartNewConversationCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      try {
        await useChatStore.getState().startNewConversation();
      } catch (error) {
        // Expected to throw
      }
    });

    const state = useChatStore.getState();
    expect(state.error).toEqual({
      type: 'server',
      message: errorMessage,
      retryable: true,
    });
    expect(state.isLoading).toBe(false);
  });

  test('should send message successfully', async () => {
    // Set up a current conversation
    useChatStore.setState({
      currentConversation: {
        id: 'conv-123',
        title: 'Test Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
    });

    mockSendMessageStreamCommand.mockResolvedValue(undefined);
    mockListen.mockResolvedValue(() => {}); // Mock unlisten function

    await act(async () => {
      await useChatStore.getState().sendMessage('Hello world');
    });

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({
      id: expect.any(String),
      role: 'user',
      content: 'Hello world',
      timestamp: expect.any(Date),
    });
    expect(mockSendMessageStreamCommand).toHaveBeenCalledWith('Hello world');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle send message failure', async () => {
    // Set up a current conversation
    useChatStore.setState({
      currentConversation: {
        id: 'conv-123',
        title: 'Test Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
    });

    const errorMessage = 'Failed to send message';
    mockSendMessageStreamCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useChatStore.getState().sendMessage('Hello world');
    });

    const state = useChatStore.getState();
    expect(state.error).toMatchObject({
      type: 'server',
      message: errorMessage,
      retryable: true,
    });
    expect(state.isLoading).toBe(false);
    expect(state.isStreaming).toBe(false);
  });

  test('should load conversation history successfully', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: 'msg-2',
        role: 'assistant' as const,
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    mockGetConversationHistoryCommand.mockResolvedValue(mockMessages);

    await act(async () => {
      await useChatStore.getState().loadConversation('conv-123');
    });

    const state = useChatStore.getState();
    expect(state.messages).toEqual(mockMessages);
    expect(mockGetConversationHistoryCommand).toHaveBeenCalledWith('conv-123');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle load conversation failure', async () => {
    const errorMessage = 'Failed to load conversation';
    mockGetConversationHistoryCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useChatStore.getState().loadConversation('conv-123');
    });

    const state = useChatStore.getState();
    expect(state.error).toEqual({
      type: 'server',
      message: errorMessage,
      retryable: true,
    });
    expect(state.isLoading).toBe(false);
  });

  test('should refresh conversation history successfully', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Conversation 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'conv-2',
        title: 'Conversation 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockGetAllConversationsCommand.mockResolvedValue(mockConversations);

    await act(async () => {
      await useChatStore.getState().refreshHistory();
    });

    const state = useChatStore.getState();
    expect(state.conversations).toEqual(mockConversations);
    expect(mockGetAllConversationsCommand).toHaveBeenCalled();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should set current conversation', () => {
    const mockConversation = {
      id: 'conv-123',
      title: 'Test Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      useChatStore.getState().setCurrentConversation(mockConversation);
    });

    const state = useChatStore.getState();
    expect(state.currentConversation).toEqual(mockConversation);
  });

  test('should clear error', () => {
    // Set error state
    useChatStore.setState({
      error: { type: 'server', message: 'Some error', retryable: true },
    });

    act(() => {
      useChatStore.getState().clearError();
    });

    const state = useChatStore.getState();
    expect(state.error).toBeNull();
  });

  test('should handle streaming state correctly', async () => {
    // Set up a current conversation
    useChatStore.setState({
      currentConversation: {
        id: 'conv-123',
        title: 'Test Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
    });

    let resolveCommand: () => void;
    const commandPromise = new Promise<void>((resolve) => {
      resolveCommand = resolve;
    });
    mockSendMessageStreamCommand.mockReturnValue(commandPromise);
    mockListen.mockResolvedValue(() => {}); // Mock unlisten function

    // Start sending message (don't await)
    const sendPromise = useChatStore.getState().sendMessage('Hello');

    // Check streaming state
    expect(useChatStore.getState().isStreaming).toBe(true);

    // Resolve the command
    await act(async () => {
      resolveCommand();
      await sendPromise;
    });

    // Check final state
    expect(useChatStore.getState().isStreaming).toBe(false);
  });
});