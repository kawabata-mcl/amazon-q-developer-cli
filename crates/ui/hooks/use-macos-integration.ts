import { safeInvoke } from '@/lib/tauri-env';
import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface SystemTheme {
  Light: null
  Dark: null
  Auto: null
}

export interface MacOSSystemInfo {
  theme: SystemTheme
  accent_color?: string
  system_version: string
}

export function useMacOSIntegration() {
  const [systemInfo, setSystemInfo] = useState<MacOSSystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get system theme
  const getSystemTheme = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const theme = await invoke<SystemTheme>('get_system_theme')
      return theme
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system theme'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get comprehensive system info
  const getSystemInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const info = await invoke<MacOSSystemInfo>('get_macos_system_info')
      setSystemInfo(info)
      return info
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system info'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Reveal file in Finder
  const revealInFinder = useCallback(async (path: string) => {
    try {
      setError(null)
      await safeInvoke('reveal_in_finder', { path })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reveal in Finder'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Open with default application
  const openWithDefaultApp = useCallback(async (path: string) => {
    try {
      setError(null)
      await safeInvoke('open_with_default_app', { path })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open with default app'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Setup native menu
  const setupNativeMenu = useCallback(async () => {
    try {
      setError(null)
      await safeInvoke('setup_native_menu')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup native menu'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Handle menu events
  const handleMenuEvent = useCallback(async (menuId: string) => {
    try {
      setError(null)
      await safeInvoke('handle_menu_event', { menuId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to handle menu event'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Initialize system info on mount
  useEffect(() => {
    getSystemInfo().catch(console.error)
  }, [getSystemInfo])

  // Listen for menu events
  useEffect(() => {
    const unlistenPromises = [
      listen('show_preferences', () => {
        // Handle preferences menu
        window.dispatchEvent(new CustomEvent('show-preferences'))
      }),
      listen('new_conversation', () => {
        // Handle new conversation menu
        window.dispatchEvent(new CustomEvent('new-conversation'))
      }),
      listen('open_file_dialog', () => {
        // Handle open file menu
        window.dispatchEvent(new CustomEvent('open-file-dialog'))
      }),
      listen('save_conversation', () => {
        // Handle save conversation menu
        window.dispatchEvent(new CustomEvent('save-conversation'))
      }),
      listen('toggle_sidebar', () => {
        // Handle toggle sidebar menu
        window.dispatchEvent(new CustomEvent('toggle-sidebar'))
      }),
      listen('zoom_in', () => {
        // Handle zoom in menu
        window.dispatchEvent(new CustomEvent('zoom-in'))
      }),
      listen('zoom_out', () => {
        // Handle zoom out menu
        window.dispatchEvent(new CustomEvent('zoom-out'))
      }),
      listen('actual_size', () => {
        // Handle actual size menu
        window.dispatchEvent(new CustomEvent('actual-size'))
      }),
      listen('show_keyboard_shortcuts', () => {
        // Handle keyboard shortcuts menu
        window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'))
      }),
    ]

    return () => {
      Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(unlisten => unlisten())
      })
    }
  }, [])

  return {
    systemInfo,
    isLoading,
    error,
    getSystemTheme,
    getSystemInfo,
    revealInFinder,
    openWithDefaultApp,
    setupNativeMenu,
    handleMenuEvent,
  }
}

// Helper function to determine if current theme is dark
export function isDarkTheme(theme: SystemTheme): boolean {
  return 'Dark' in theme
}

// Helper function to get theme name as string
export function getThemeName(theme: SystemTheme): string {
  if ('Dark' in theme) return 'dark'
  if ('Light' in theme) return 'light'
  return 'auto'
}