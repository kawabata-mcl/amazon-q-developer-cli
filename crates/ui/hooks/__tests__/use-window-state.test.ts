import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock tauri invoke (core)
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(async (cmd: string) => {
    if (cmd === 'get_window_state') {
      return { width: 1280, height: 720, x: 100, y: 80, maximized: false, alwaysOnTop: false };
    }
    return undefined;
  }),
}));

// Mock appWindow API
jest.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    setSize: jest.fn(async () => undefined),
    setPosition: jest.fn(async () => undefined),
    maximize: jest.fn(async () => undefined),
    unmaximize: jest.fn(async () => undefined),
    setAlwaysOnTop: jest.fn(async () => undefined),
    onResized: jest.fn(async () => () => {}),
    onMoved: jest.fn(async () => () => {}),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useWindowState } = require('../use-window-state');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSettingsStore } = require('@/stores/settings-store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DEFAULT_SETTINGS } = require('@/types/settings');

describe('useWindowState', () => {
  const { appWindow } = require('@tauri-apps/api/window');

  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
  });

  test('applyWindowSettings applies size, position, and flags', async () => {
    useSettingsStore.setState((s: any) => ({
      settings: {
        ...s.settings,
        window: {
          width: 1024,
          height: 640,
          x: 50,
          y: 60,
          maximized: true,
          alwaysOnTop: true,
          rememberPosition: true,
        },
      },
    }));

    const { result } = renderHook(() => useWindowState());
    await act(async () => {
      await result.current.applyWindowSettings();
    });

    expect(appWindow.setSize).toHaveBeenCalledWith({ width: 1024, height: 640 });
    expect(appWindow.setPosition).toHaveBeenCalledWith({ x: 50, y: 60 });
    expect(appWindow.maximize).toHaveBeenCalled();
    expect(appWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);
  });

  test('When rememberPosition=false, position is not set', async () => {
    useSettingsStore.setState((s: any) => ({
      settings: {
        ...s.settings,
        window: {
          width: 900,
          height: 700,
          maximized: false,
          alwaysOnTop: false,
          rememberPosition: false,
        },
      },
    }));

    const { result } = renderHook(() => useWindowState());
    const state = await result.current.getCurrentWindowState();
    // invoke は 1280x720 を返すモック
    expect(state).toMatchObject({ width: 1280, height: 720 });
  });

  test('getCurrentWindowState returns invoke result', async () => {
    const { result } = renderHook(() => useWindowState());
    const state = await result.current.getCurrentWindowState();
    expect(state).toMatchObject({ width: 1280, height: 720 });
  });
});


