import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

// Mock Tauri API
jest.mock('@/lib/tauri', () => ({
  getAppSettingsCommand: jest.fn(),
  updateAppSettingsCommand: jest.fn(),
  resetAppSettingsCommand: jest.fn(),
}));

import { useSettingsStore, DEFAULT_SETTINGS } from '@/stores/settings-store';
import {
  getAppSettingsCommand,
  updateAppSettingsCommand,
  resetAppSettingsCommand,
} from '@/lib/tauri';

const mockGetAppSettingsCommand = getAppSettingsCommand as jest.MockedFunction<typeof getAppSettingsCommand>;
const mockUpdateAppSettingsCommand = updateAppSettingsCommand as jest.MockedFunction<typeof updateAppSettingsCommand>;
const mockResetAppSettingsCommand = resetAppSettingsCommand as jest.MockedFunction<typeof resetAppSettingsCommand>;

describe('settings-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useSettingsStore.setState({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
    });
  });

  test('should have correct initial state', () => {
    const state = useSettingsStore.getState();
    
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should load settings successfully', async () => {
    const mockSettings = {
      ...DEFAULT_SETTINGS,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        theme: 'dark' as const,
        fontSize: 16,
      },
    };

    mockGetAppSettingsCommand.mockResolvedValue(mockSettings);

    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(mockSettings);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockGetAppSettingsCommand).toHaveBeenCalled();
  });

  test('should handle load settings failure', async () => {
    const errorMessage = 'Failed to load settings';
    mockGetAppSettingsCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS); // Should remain default
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should update settings successfully', async () => {
    const settingsUpdate = {
      appearance: {
        theme: 'dark' as const,
        fontSize: 16,
      },
    };

    const expectedSettings = {
      ...DEFAULT_SETTINGS,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...settingsUpdate.appearance,
      },
    };

    mockUpdateAppSettingsCommand.mockResolvedValue(undefined);

    await act(async () => {
      await useSettingsStore.getState().updateSettings(settingsUpdate);
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(expectedSettings);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockUpdateAppSettingsCommand).toHaveBeenCalledWith(expectedSettings);
  });

  test('should handle update settings failure', async () => {
    const settingsUpdate = {
      appearance: {
        theme: 'dark' as const,
      },
    };

    const errorMessage = 'Failed to update settings';
    mockUpdateAppSettingsCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useSettingsStore.getState().updateSettings(settingsUpdate);
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS); // Should remain unchanged
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should reset settings successfully', async () => {
    // First set some custom settings
    useSettingsStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        appearance: {
          ...DEFAULT_SETTINGS.appearance,
          theme: 'dark',
          fontSize: 18,
        },
      },
    });

    mockResetAppSettingsCommand.mockResolvedValue(undefined);

    await act(async () => {
      await useSettingsStore.getState().resetSettings();
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockResetAppSettingsCommand).toHaveBeenCalled();
  });

  test('should handle reset settings failure', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        theme: 'dark' as const,
      },
    };

    // Set custom settings
    useSettingsStore.setState({
      settings: customSettings,
    });

    const errorMessage = 'Failed to reset settings';
    mockResetAppSettingsCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useSettingsStore.getState().resetSettings();
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(customSettings); // Should remain unchanged
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should set loading state during operations', async () => {
    let resolveLoad: (value: any) => void;
    const loadPromise = new Promise((resolve) => {
      resolveLoad = resolve;
    });
    mockGetAppSettingsCommand.mockReturnValue(loadPromise);

    // Start loading (don't await)
    const loadCall = useSettingsStore.getState().loadSettings();

    // Check loading state
    expect(useSettingsStore.getState().isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolveLoad(DEFAULT_SETTINGS);
      await loadCall;
    });

    // Check final state
    expect(useSettingsStore.getState().isLoading).toBe(false);
  });

  test('should handle partial settings updates', async () => {
    const partialUpdate = {
      window: {
        width: 1400,
        height: 900,
      },
    };

    const expectedSettings = {
      ...DEFAULT_SETTINGS,
      window: {
        ...DEFAULT_SETTINGS.window,
        ...partialUpdate.window,
      },
    };

    mockUpdateAppSettingsCommand.mockResolvedValue(undefined);

    await act(async () => {
      await useSettingsStore.getState().updateSettings(partialUpdate);
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(expectedSettings);
  });

  test('should handle nested settings updates', async () => {
    const nestedUpdate = {
      keyboard: {
        shortcuts: {
          sendMessage: 'Ctrl+Enter',
        },
      },
    };

    const expectedSettings = {
      ...DEFAULT_SETTINGS,
      keyboard: {
        ...DEFAULT_SETTINGS.keyboard,
        shortcuts: {
          ...DEFAULT_SETTINGS.keyboard.shortcuts,
          ...nestedUpdate.keyboard.shortcuts,
        },
      },
    };

    mockUpdateAppSettingsCommand.mockResolvedValue(undefined);

    await act(async () => {
      await useSettingsStore.getState().updateSettings(nestedUpdate);
    });

    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(expectedSettings);
  });
});