import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { TimeoutError, NetworkError } from '@/types/common';

// Mock the chat store BEFORE importing the hook under test
jest.mock('@/stores/chat-store', () => ({
  __esModule: true,
  useChatStore: jest.fn(),
}));

const chatStore = jest.requireMock('@/stores/chat-store') as { useChatStore: jest.Mock };
const { useChat } = require('../use-chat');

describe('useChat', () => {
  const mockSendMessage = jest.fn(async (_msg: string) => {});
  const mockStartNewConversation = jest.fn(async () => '');
  const mockLoadConversation = jest.fn(async (_id: string) => {});
  const mockRefreshHistory = jest.fn(async () => {});
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

  test('handles timeout by aborting and exposing TimeoutError with sendError set', async () => {
    jest.useFakeTimers();

    // sendMessage rejects after a short delay to allow the 30s timeout to fire first
    mockSendMessage.mockImplementation((() => new Promise((_, reject) => setTimeout(() => reject(new Error('request aborted')), 1))) as any);

    const { result } = renderHook(() => useChat());

    let caught: unknown;
    await act(async () => {
      const p = result.current.sendMessage('Hello');
      jest.advanceTimersByTime(30050);
      try {
        await p;
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBeInstanceOf(TimeoutError);
    expect(result.current.sendError).toBe('Network timeout - please try again');

    jest.useRealTimers();
  });

  test('maps network errors to NetworkError and sets friendly message', async () => {
    mockSendMessage.mockRejectedValue(new Error('network unreachable'));

    const { result } = renderHook(() => useChat());

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.sendMessage('Ping');
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBeInstanceOf(NetworkError);
    expect(result.current.sendError).toBe('Network connection failed. Please check your internet connection.');
  });

  test('cancelSend aborts current operation and sets cancellation error', async () => {
    // Long-running promise to simulate in-flight send
    let rejectFn: ((e: unknown) => void) | undefined;
    mockSendMessage.mockImplementation((() => new Promise((_, reject) => { rejectFn = reject; })) as any);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      // Fire and forget; do not await to allow cancel before rejection
      void result.current.sendMessage('Long task');
    });

    await act(async () => {
      result.current.cancelSend();
    });

    expect(result.current.isSending).toBe(false);
    expect(result.current.sendError).toBe('Send operation cancelled');

    // Clean up the pending promise to avoid unhandled rejection warnings
    await act(async () => {
      (rejectFn as unknown as (e: unknown) => void)?.(new Error('cancelled'));
    });
  });
});