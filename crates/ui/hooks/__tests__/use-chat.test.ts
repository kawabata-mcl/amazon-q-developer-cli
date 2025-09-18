import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock the chat store BEFORE importing the hook under test
jest.mock('@/stores/chat-store', () => ({
  __esModule: true,
  useChatStore: jest.fn(),
}));

const chatStore = jest.requireMock('@/stores/chat-store') as { useChatStore: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useChat } = require('../use-chat');

describe('useChat', () => {
  const mockSendMessage = jest.fn();
  const mockStartNewConversation = jest.fn();
  const mockLoadConversation = jest.fn();
  const mockRefreshHistory = jest.fn();
  const mockSetCurrentConversation = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    chatStore.useChatStore.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      loadConversation: mockLoadConversation,
      refreshHistory: mockRefreshHistory,
      setCurrentConversation: mockSetCurrentConversation,
      clearError: mockClearError,
    }));
  });

  test('should return correct initial state', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.currentConversation).toBeNull();
    expect(result.current.conversations).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMessages).toBe(false);
    expect(result.current.canSendMessage).toBe(true);
  });

  test('should return correct state when loading', () => {
    chatStore.useChatStore.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: true,
      isStreaming: false,
      error: null,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      loadConversation: mockLoadConversation,
      refreshHistory: mockRefreshHistory,
      setCurrentConversation: mockSetCurrentConversation,
      clearError: mockClearError,
    }));

    const { result } = renderHook(() => useChat());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.canSendMessage).toBe(false);
  });

  test('should return correct state when streaming', () => {
    chatStore.useChatStore.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: true,
      error: null,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      loadConversation: mockLoadConversation,
      refreshHistory: mockRefreshHistory,
      setCurrentConversation: mockSetCurrentConversation,
      clearError: mockClearError,
    }));

    const { result } = renderHook(() => useChat());

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.canSendMessage).toBe(false);
  });

  test('should return correct state with messages', () => {
    const mockMessages = [
      { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
    ];

    chatStore.useChatStore.mockImplementation(() => ({
      currentConversation: { id: 'conv-1', title: 'Test Conversation' },
      conversations: [],
      messages: mockMessages,
      isLoading: false,
      isStreaming: false,
      error: null,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      loadConversation: mockLoadConversation,
      refreshHistory: mockRefreshHistory,
      setCurrentConversation: mockSetCurrentConversation,
      clearError: mockClearError,
    }));

    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.hasMessages).toBe(true);
    expect(result.current.canSendMessage).toBe(true);
  });

  test('should handle error state correctly', () => {
    const mockError = { type: 'server', message: 'Connection failed', retryable: true };

    chatStore.useChatStore.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: mockError,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      loadConversation: mockLoadConversation,
      refreshHistory: mockRefreshHistory,
      setCurrentConversation: mockSetCurrentConversation,
      clearError: mockClearError,
    }));

    const { result } = renderHook(() => useChat());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.canRetry).toBe(true);
    // Our hook normalizes server errors to the provided message when present
    expect(result.current.getErrorMessage(mockError)).toBe('Connection failed');
  });

  test('should call sendMessage correctly', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello world');
    });

    expect(mockSendMessage).toHaveBeenCalledWith('Hello world');
  });

  test('should call startNewConversation correctly', async () => {
    mockStartNewConversation.mockResolvedValue('new-conv-id');
    const { result } = renderHook(() => useChat());

    let conversationId: string | undefined;
    await act(async () => {
      conversationId = await result.current.startNewConversation();
    });

    expect(mockStartNewConversation).toHaveBeenCalled();
    expect(conversationId).toBe('new-conv-id');
  });
});