import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

// jsdom doesn't implement classList.toggle with second argument in older envs consistently
// but our jest-environment-jsdom supports it; ensure documentElement exists

import { invoke } from '@tauri-apps/api/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useTheme } = require('../use-theme');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSettingsStore } = require('@/stores/settings-store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DEFAULT_SETTINGS } = require('@/types/settings');

describe('useTheme', () => {
  const originalMatchMedia = window.matchMedia;
  const mockInvoke = invoke as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // reset settings store
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
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
    expect(mockInvoke).toHaveBeenCalledWith('apply_theme', { theme: 'dark' });
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


