import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

jest.useFakeTimers();

jest.mock('@/lib/tauri-env', () => {
  const actual = jest.requireActual('@/lib/tauri-env');
  return {
    __esModule: true,
    ...actual,
    safeInvoke: jest.fn().mockResolvedValue(undefined),
  };
});
import * as tauriEnv from '@/lib/tauri-env';

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
  let mockSafeInvoke: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
    const mocked = jest.requireMock('@/lib/tauri-env') as { safeInvoke: jest.Mock };
    mockSafeInvoke = mocked.safeInvoke;
    mockSafeInvoke.mockResolvedValue(undefined);
  });

  test('Shortcut trigger fires default action (toggle-sidebar event)', async () => {
    renderHook(() => useKeyboardShortcuts({}));

    const handler = jest.fn();
    window.addEventListener('toggle-sidebar', handler as unknown as EventListener);

    await act(async () => {}); // Wait for effect registration

    const event = new KeyboardEvent('keydown', {
      key: 'B',
      metaKey: true,
      shiftKey: true, // default is Cmd+Shift+S; use B to test toggle-sidebar mapping? use S
    });
    // toggle-sidebar は Cmd+Shift+S なので正しいキーで発火
    const event2 = new KeyboardEvent('keydown', { key: 'S', metaKey: true, shiftKey: true });
    document.dispatchEvent(event2);

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

    const unregisterCallsBefore = mockSafeInvoke.mock.calls.length;
    const { unmount } = renderHook(() => useKeyboardShortcuts({}));

    // register called for each shortcut
    const calls = (mockSafeInvoke.mock.calls as any[]).map((c: any[]) => c[0]);
    expect(calls).toContain('register_global_shortcut');

    // unmount to unregister
    unmount();
    const calls2 = (mockSafeInvoke.mock.calls as any[]).map((c: any[]) => c[0]);
    expect(calls2).toContain('unregister_global_shortcut');
    expect(mockSafeInvoke.mock.calls.length).toBeGreaterThan(unregisterCallsBefore);
  });

  test('Custom actions can be overridden', () => {
    const custom = jest.fn();
    renderHook(() => useKeyboardShortcuts({ 'search': custom }));

    // デフォルトは Cmd+K だが、カスタムは search アクション上書きで Cmd+K をトリガー
    const event = new KeyboardEvent('keydown', { key: 'K', metaKey: true });
    document.dispatchEvent(event);

    expect(custom).toHaveBeenCalled();
  });
});


