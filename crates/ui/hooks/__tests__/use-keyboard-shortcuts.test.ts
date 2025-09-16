import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

jest.useFakeTimers();

import { invoke } from '@tauri-apps/api/tauri';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useKeyboardShortcuts } = require('../use-keyboard-shortcuts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSettingsStore } = require('@/stores/settings-store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DEFAULT_SETTINGS } = require('@/types/settings');
jest.mock('@/stores/chat-store', () => {
  const mockStartNewConversation = jest.fn();
  return {
    __esModule: true,
    mockStartNewConversation,
    useChatStore: (selector?: any) => {
      const state = { startNewConversation: mockStartNewConversation };
      return selector ? selector(state) : state;
    },
  };
});

describe('useKeyboardShortcuts', () => {
  const mockInvoke = invoke as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
  });

  test('ショートカット発火でデフォルトアクション（toggle-sidebar イベント）が発火する', async () => {
    renderHook(() => useKeyboardShortcuts({}));

    const handler = jest.fn();
    window.addEventListener('toggle-sidebar', handler as unknown as EventListener);

    await act(async () => {}); // エフェクト登録待ち

    const event = new KeyboardEvent('keydown', {
      key: 'B',
      metaKey: true,
    });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  test('enableGlobalShortcuts=true で register/unregister が呼ばれる', () => {
    useSettingsStore.setState((s: any) => ({
      settings: {
        ...s.settings,
        keyboard: {
          ...s.settings.keyboard,
          enableGlobalShortcuts: true,
          shortcuts: { ...s.settings.keyboard.shortcuts, quit: 'Cmd+Q' },
        },
      },
    }));

    const unregisterCallsBefore = mockInvoke.mock.calls.length;
    const { unmount } = renderHook(() => useKeyboardShortcuts({}));

    // register called for each shortcut
    expect(mockInvoke).toHaveBeenCalledWith('register_global_shortcut', expect.any(Object));

    // unmount to unregister
    unmount();
    const calls = mockInvoke.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContain('unregister_global_shortcut');
    expect(mockInvoke.mock.calls.length).toBeGreaterThan(unregisterCallsBefore);
  });

  test('カスタムアクションを上書き可能', () => {
    const custom = jest.fn();
    renderHook(() => useKeyboardShortcuts({ 'search': custom }));

    const event = new KeyboardEvent('keydown', {
      key: 'F',
      metaKey: true,
    });
    document.dispatchEvent(event);

    expect(custom).toHaveBeenCalled();
  });
});


