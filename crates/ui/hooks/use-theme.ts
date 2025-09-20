import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { useSettings } from './use-settings';

export function useTheme() {
  const { settings, updateSetting } = useSettings();
  const { theme } = settings.appearance;

  // Apply theme to document
  const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (themeValue === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
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
  }, [theme]);

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

  return {
    theme,
    setTheme,
    isDark: theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    isLight: theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches),
    isSystem: theme === 'system'
  };
}