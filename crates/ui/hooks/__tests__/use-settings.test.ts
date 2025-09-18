import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock the settings store BEFORE importing the hook under test
jest.mock('@/stores/settings-store', () => ({
  __esModule: true,
  useSettingsStore: jest.fn(),
}));

const settingsStore = jest.requireMock('@/stores/settings-store') as { useSettingsStore: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSettings } = require('../use-settings');

describe('useSettings', () => {
  const mockUpdateSettings = jest.fn();
  const mockResetSettings = jest.fn();
  const mockLoadSettings = jest.fn();

  const defaultSettings = {
    appearance: {
      theme: 'system' as const,
      fontSize: 14,
      fontFamily: 'system',
    },
    window: {
      width: 1200,
      height: 800,
      x: null,
      y: null,
      maximized: false,
      alwaysOnTop: false,
    },
    keyboard: {
      shortcuts: {
        sendMessage: 'Cmd+Enter',
        newConversation: 'Cmd+N',
        clearConversation: 'Cmd+K',
        toggleSidebar: 'Cmd+B',
      },
    },
    general: {
      autoSave: true,
      confirmBeforeDelete: true,
      maxHistoryItems: 100,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    settingsStore.useSettingsStore.mockImplementation(() => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      loadSettings: mockLoadSettings,
    }));
  });

  test('should return correct initial settings', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(defaultSettings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should return loading state correctly', () => {
    settingsStore.useSettingsStore.mockImplementation(() => ({
      settings: defaultSettings,
      isLoading: true,
      error: null,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      loadSettings: mockLoadSettings,
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.isLoading).toBe(true);
  });

  test('should handle error state correctly', () => {
    const mockError = 'Failed to load settings';

    settingsStore.useSettingsStore.mockImplementation(() => ({
      settings: defaultSettings,
      isLoading: false,
      error: mockError,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      loadSettings: mockLoadSettings,
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.error).toBe(mockError);
  });

  test('should call updateSettings correctly', async () => {
    const { result } = renderHook(() => useSettings());

    const newSettings = {
      appearance: {
        theme: 'dark' as const,
        fontSize: 16,
        fontFamily: 'monospace',
      },
    };

    await act(async () => {
      await result.current.updateSettings(newSettings);
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith(newSettings);
  });

  test('should call resetSettings correctly', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(mockResetSettings).toHaveBeenCalled();
  });

  test('should call loadSettings correctly', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.loadSettings();
    });

    expect(mockLoadSettings).toHaveBeenCalled();
  });

  test('should provide theme helper functions', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.isDarkMode).toBe(false); // system theme default
    expect(result.current.isLightMode).toBe(false); // system theme default
    expect(result.current.isSystemTheme).toBe(true);
  });

  test('should handle dark theme correctly', () => {
    const darkSettings = {
      ...defaultSettings,
      appearance: {
        ...defaultSettings.appearance,
        theme: 'dark' as const,
      },
    };

    settingsStore.useSettingsStore.mockImplementation(() => ({
      settings: darkSettings,
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      loadSettings: mockLoadSettings,
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.isLightMode).toBe(false);
    expect(result.current.isSystemTheme).toBe(false);
  });

  test('should handle light theme correctly', () => {
    const lightSettings = {
      ...defaultSettings,
      appearance: {
        ...defaultSettings.appearance,
        theme: 'light' as const,
      },
    };

    settingsStore.useSettingsStore.mockImplementation(() => ({
      settings: lightSettings,
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      loadSettings: mockLoadSettings,
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.isDarkMode).toBe(false);
    expect(result.current.isLightMode).toBe(true);
    expect(result.current.isSystemTheme).toBe(false);
  });
});