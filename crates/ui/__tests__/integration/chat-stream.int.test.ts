import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { waitFor } from '@testing-library/react';
import { useChatStore } from '@/stores/chat-store';
import { sendMessageStreamCommand, startNewConversationCommand } from '@/lib/tauri';
import { listen } from '@tauri-apps/api/event';

const mockStream = sendMessageStreamCommand as unknown as jest.MockedFunction<typeof sendMessageStreamCommand>;
const mockStart = startNewConversationCommand as unknown as jest.MockedFunction<typeof startNewConversationCommand>;
const mockListen = listen as unknown as jest.MockedFunction<typeof listen>;

describe('Integration: Chat streaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      pendingMessages: new Map(),
      _asyncManager: new (useChatStore.getState() as any)._asyncManager.constructor(),
      _memoizedSelectors: new Map(),
    } as any);
  });

  test('streams assistant chunks to a new conversation and completes', async () => {
    mockStart.mockResolvedValueOnce('conv-int-1');

    // Capture the listener and simulate streaming
    let unlistenFn: () => void = () => {};
    mockListen.mockImplementationOnce(async (_event, handler: any) => {
      // simulate two chunks and completion on microtask queue
      setTimeout(() => handler({ payload: { conversation_id: 'conv-int-1', chunk_id: '1', content: 'Hello', is_complete: false } }), 0);
      setTimeout(() => handler({ payload: { conversation_id: 'conv-int-1', chunk_id: '2', content: ' World', is_complete: false } }), 1);
      setTimeout(() => handler({ payload: { conversation_id: 'conv-int-1', chunk_id: '3', content: '', is_complete: true } }), 2);
      return () => { /* unlisten */ };
    });

    mockStream.mockResolvedValueOnce(undefined);

    await useChatStore.getState().sendMessage('Hi');

    await waitFor(() => {
      const state = useChatStore.getState();
      expect(state.currentConversation?.id).toBe('conv-int-1');
      const assistant = state.messages.find(m => m.role === 'assistant');
      expect(assistant?.content).toBe('Hello World');
      expect(state.isStreaming).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  test('handles stream error chunk', async () => {
    mockStart.mockResolvedValueOnce('conv-int-err');
    mockListen.mockImplementationOnce(async (_event, handler: any) => {
      // simulate one streaming chunk followed by an error completion
      setTimeout(() => handler({ payload: { conversation_id: 'conv-int-err', chunk_id: 'p1', content: 'partial', is_complete: false } }), 0);
      setTimeout(() => handler({ payload: { conversation_id: 'conv-int-err', chunk_id: 'e1', content: '', is_complete: true, error: 'server boom' } }), 1);
      return () => {};
    });
    mockStream.mockResolvedValueOnce(undefined);

    await useChatStore.getState().sendMessage('Hi');

    await waitFor(() => {
      const state = useChatStore.getState();
      const assistant = state.messages.find(m => m.role === 'assistant');
      expect(assistant?.status === 'failed' || state.error?.message).toBeTruthy();
      expect(state.isStreaming).toBe(false);
    });
  });
});


