import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from './use-settings';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import * as windowApi from '@tauri-apps/api/window';

async function getAppWindow() {
  if (typeof window === 'undefined') return null;
  return getCurrentWebviewWindow();
}

type CurrentWindowState = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
  alwaysOnTop: boolean;
};

export function useWindowState() {
  const { settings } = useSettings();
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
  const getCurrentWindowState = async (): Promise<CurrentWindowState | null> => {
    try {
      const windowState = await invoke<CurrentWindowState>('get_window_state');
      return windowState;
    } catch (error) {
      console.error('Failed to get window state:', error);
      return null;
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
    let unlistenResize: Promise<() => void> | null = null;
    let unlistenMove: Promise<() => void> | null = null;

    (async () => {
      const win = await getAppWindow();
      if (!win) return;
      unlistenResize = win.onResized(handleWindowEvent);
      unlistenMove = win.onMoved(handleWindowEvent);
    })();

    return () => {
      clearTimeout(saveTimeout);
      unlistenResize?.then(fn => fn()).catch(() => {});
      unlistenMove?.then(fn => fn()).catch(() => {});
    };
  }, [rememberPosition]);

  const applyWindowSettings = async (): Promise<void> => {
    try {
      const appWindow = (windowApi as unknown as { appWindow: {
        setSize: (size: { width: number; height: number }) => Promise<void>;
        setPosition: (pos: { x: number; y: number }) => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        setAlwaysOnTop: (v: boolean) => Promise<void>;
      }}).appWindow;
      const { width, height, x, y, maximized, alwaysOnTop } = settings.window as {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
        maximized?: boolean;
        alwaysOnTop?: boolean;
      };
      if (width && height) {
        await appWindow.setSize({ width, height });
      }
      if (rememberPosition && typeof x === 'number' && typeof y === 'number') {
        await appWindow.setPosition({ x, y });
      }
      if (maximized) {
        await appWindow.maximize();
      } else {
        await appWindow.unmaximize();
      }
      await appWindow.setAlwaysOnTop(!!alwaysOnTop);
    } catch (error) {
      console.error('Failed to apply window settings:', error);
    }
  };

  return {
    saveWindowState,
    getCurrentWindowState,
    applyWindowSettings,
  };
}