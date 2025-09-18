import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { useSettings } from './use-settings';
import { useMacOSIntegration, isDarkTheme, type SystemTheme } from './use-macos-integration';

export function useTheme() {
  const { settings, updateSetting } = useSettings();
  const { theme } = settings.appearance;
  const { getSystemTheme } = useMacOSIntegration();
  const [macOSTheme, setMacOSTheme] = useState<SystemTheme | null>(null);

  // Apply theme to document
  const applyTheme = async (themeValue: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (themeValue === 'system') {
      try {
        // Try to get macOS system theme first
        const systemTheme = await getSystemTheme();
        setMacOSTheme(systemTheme);
        root.classList.toggle('dark', isDarkTheme(systemTheme));
      } catch {
        // Fallback to web API if macOS theme detection fails
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      }
    } else {
      root.classList.toggle('dark', themeValue === 'dark');
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
    
    // Notify backend about theme change
    invoke('apply_theme', { theme }).catch(console.error);
  }, [theme, getSystemTheme]);

  // Listen for theme change events from backend
  useEffect(() => {
    const unlisten = listen<string>('theme-changed', (event) => {
      const newTheme = event.payload as 'light' | 'dark' | 'system';
      applyTheme(newTheme);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    await updateSetting('appearance', { theme: newTheme });
  };

  // Determine current effective theme
  const getEffectiveTheme = () => {
    if (theme === 'system') {
      if (macOSTheme) {
        return isDarkTheme(macOSTheme) ? 'dark' : 'light';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const effectiveTheme = getEffectiveTheme();

  return {
    theme,
    setTheme,
    effectiveTheme,
    macOSTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    isSystem: theme === 'system'
  };
}