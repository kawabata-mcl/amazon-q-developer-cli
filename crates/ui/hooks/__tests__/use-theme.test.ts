import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

// jsdom doesn't implement classList.toggle with second argument in older envs consistently
// but our jest-environment-jsdom supports it; ensure documentElement exists

jest.mock('@/lib/tauri-env', () => {
  const actual = jest.requireActual('@/lib/tauri-env');
  return {
    __esModule: true,
    ...actual,
    safeInvoke: jest.fn().mockResolvedValue(undefined),
  };
});
jest.mock('../use-macos-integration', () => ({
  __esModule: true,
  useMacOSIntegration: () => ({
    getSystemTheme: jest.fn().mockResolvedValue({ Light: null }),
  }),
  isDarkTheme: (t: any) => 'Dark' in t,
}))
import * as tauriEnv from '@/lib/tauri-env';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useTheme } = require('../use-theme');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSettingsStore } = require('@/stores/settings-store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DEFAULT_SETTINGS } = require('@/types/settings');

describe('useTheme', () => {
  const originalMatchMedia = window.matchMedia;
  let mockSafeInvoke: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // reset settings store
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
    const mocked = jest.requireMock('@/lib/tauri-env') as { safeInvoke: jest.Mock };
    mockSafeInvoke = mocked.safeInvoke;
    mockSafeInvoke.mockResolvedValue(undefined);
    // system prefers light by default in setup
    window.matchMedia = jest.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    document.documentElement.classList.remove('dark');
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('Initially uses system theme and dark class is not applied', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isSystem).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('When theme is changed to Dark, dark class is applied and invoke is called', async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => {
      await result.current.setTheme('dark');
    });
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    expect(mockSafeInvoke).toHaveBeenCalledWith('apply_theme', { theme: 'dark' });
  });

  test('When theme is changed to Light, dark class is removed', async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => {
      await result.current.setTheme('dark');
    });
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    await act(async () => {
      await result.current.setTheme('light');
    });
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
  });
});


