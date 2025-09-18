import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from './use-settings';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

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

  return {
    saveWindowState,
    getCurrentWindowState,
    // フロントではウィンドウ操作を行わない
  };
}