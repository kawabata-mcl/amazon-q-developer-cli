import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock BEFORE requiring the component under test
jest.mock('@/hooks/use-chat', () => ({
  __esModule: true,
  useChat: jest.fn(),
}));
const useChatModule = jest.requireMock('@/hooks/use-chat') as { useChat: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ChatWindow } = require('../chat-window');

describe('ChatWindow', () => {
  const mockSendMessage = jest.fn<(message: string) => Promise<void>>();
  const mockStartNewConversation = jest.fn<() => Promise<string>>();
  const mockClearError = jest.fn<() => void>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockStartNewConversation.mockResolvedValue('conv-1');
    useChatModule.useChat.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      hasMessages: false,
      canSendMessage: true,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      clearError: mockClearError,
      loadConversation: jest.fn(),
      refreshHistory: jest.fn(),
      setCurrentConversation: jest.fn(),
      canRetry: false,
      getErrorMessage: (e: any) => (typeof e === 'string' ? e : e?.message ?? ''),
    } as any));
  });

  test('renders welcome screen when no messages', async () => {
    await import('react');
    render(<ChatWindow />);
    
    expect(!!screen.getByText('Welcome to Amazon Q Developer')).toBe(true);
    expect(!!screen.getByText('Code Generation')).toBe(true);
    expect(!!screen.getByTestId('message-input')).toBe(true);
  });

  test('displays error message when error occurs', async () => {
    useChatModule.useChat.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: { type: 'server', message: 'Test error message', retryable: true },
      hasMessages: false,
      canSendMessage: true,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      clearError: mockClearError,
      loadConversation: jest.fn(),
      refreshHistory: jest.fn(),
      setCurrentConversation: jest.fn(),
      canRetry: true,
      getErrorMessage: (e: any) => (typeof e === 'string' ? e : e?.message ?? ''),
    } as any));

    render(<ChatWindow />);
    
    expect(!!screen.getByText('Test error message')).toBe(true);
  });

  test('disables input when loading', async () => {
    useChatModule.useChat.mockImplementation(() => ({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: true,
      isStreaming: false,
      error: null,
      hasMessages: false,
      canSendMessage: false,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      clearError: mockClearError,
      loadConversation: jest.fn(),
      refreshHistory: jest.fn(),
      setCurrentConversation: jest.fn(),
    } as any));

    render(<ChatWindow />);
    
    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');
    
    expect((messageInput as HTMLTextAreaElement).disabled).toBe(true);
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);
  });
});