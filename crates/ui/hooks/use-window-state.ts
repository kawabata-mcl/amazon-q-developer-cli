import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { useSettings } from './use-settings';

export function useWindowState() {
  const { settings, updateSetting } = useSettings();
  const { rememberPosition } = settings.window;

  // Save current window state
  const saveWindowState = async () => {
    try {
      await invoke('save_window_state');
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  };

  // Get current window state
  const getCurrentWindowState = async () => {
    try {
      const windowState = await invoke('get_window_state');
      return windowState;
    } catch (error) {
      console.error('Failed to get window state:', error);
      return null;
    }
  };

  // Apply window settings
  const applyWindowSettings = async () => {
    try {
      const { width, height, x, y, maximized, alwaysOnTop } = settings.window;

      // Set window size
      await appWindow.setSize({ width, height });

      // Set window position if specified and remember position is enabled
      if (rememberPosition && x !== undefined && y !== undefined) {
        await appWindow.setPosition({ x, y });
      }

      // Set maximized state
      if (maximized) {
        await appWindow.maximize();
      } else {
        await appWindow.unmaximize();
      }

      // Set always on top
      await appWindow.setAlwaysOnTop(alwaysOnTop);

    } catch (error) {
      console.error('Failed to apply window settings:', error);
    }
  };

  // Listen for window events and auto-save state
  useEffect(() => {
    if (!rememberPosition) return;

    let saveTimeout: NodeJS.Timeout;

    const handleWindowEvent = () => {
      // Debounce saves to avoid excessive file writes
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveWindowState, 500);
    };

    // Listen for window resize and move events
    const unlistenResize = appWindow.onResized(handleWindowEvent);
    const unlistenMove = appWindow.onMoved(handleWindowEvent);

    return () => {
      clearTimeout(saveTimeout);
      unlistenResize.then(fn => fn());
      unlistenMove.then(fn => fn());
    };
  }, [rememberPosition]);

  // Apply window settings when they change
  useEffect(() => {
    applyWindowSettings();
  }, [settings.window]);

  return {
    saveWindowState,
    getCurrentWindowState,
    applyWindowSettings
  };
}