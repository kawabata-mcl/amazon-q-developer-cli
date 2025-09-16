'use client';

import { useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useWindowState } from '@/hooks/use-window-state';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useSettings } from '@/hooks/use-settings';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <WindowStateProvider>
          <KeyboardShortcutProvider>
            {children}
          </KeyboardShortcutProvider>
        </WindowStateProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Settings will be loaded by the store automatically
  return <>{children}</>;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  
  // Apply theme and font settings
  useEffect(() => {
    const root = document.documentElement;
    const { theme, fontSize, fontFamily, accentColor } = settings.appearance;
    
    // Apply theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Apply font settings
    root.style.setProperty('--font-size-base', `${fontSize}px`);
    root.style.setProperty('--font-family-base', fontFamily);
    root.style.setProperty('--color-accent', accentColor);
    
    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.appearance]);

  return <>{children}</>;
}

function WindowStateProvider({ children }: { children: React.ReactNode }) {
  useWindowState();
  return <>{children}</>;
}

function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    'new-conversation': () => {
      window.dispatchEvent(new CustomEvent('new-conversation'));
    },
    'toggle-sidebar': () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    },
    'search': () => {
      window.dispatchEvent(new CustomEvent('open-search'));
    },
    'settings': () => {
      window.dispatchEvent(new CustomEvent('open-settings'));
    }
  });

  return <>{children}</>;
}