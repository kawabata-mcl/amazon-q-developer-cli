import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useSettings } from './use-settings';
import { useChatStore } from '@/stores/chat-store';

interface ShortcutActions {
  'new-conversation': () => void;
  'toggle-sidebar': () => void;
  'search': () => void;
  'settings': () => void;
  'quit': () => void;
}

export function useKeyboardShortcuts(actions: Partial<ShortcutActions>) {
  const { settings } = useSettings();
  const { shortcuts, enableGlobalShortcuts } = settings.keyboard;
  const { startNewConversation } = useChatStore();

  // Default actions
  const defaultActions: ShortcutActions = {
    'new-conversation': () => {
      startNewConversation();
    },
    'toggle-sidebar': () => {
      // Emit event for sidebar toggle
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    },
    'search': () => {
      // Emit event for search
      window.dispatchEvent(new CustomEvent('open-search'));
    },
    'settings': () => {
      // Emit event for settings
      window.dispatchEvent(new CustomEvent('open-settings'));
    },
    'quit': () => {
      // This will be handled by the backend
      invoke('quit_app').catch(console.error);
    }
  };

  // Merge provided actions with defaults
  const allActions = { ...defaultActions, ...actions };

  // Parse shortcut string to key combination
  const parseShortcut = (shortcut: string) => {
    const parts = shortcut.toLowerCase().split('+');
    return {
      ctrlKey: parts.includes('ctrl'),
      metaKey: parts.includes('cmd') || parts.includes('meta'),
      altKey: parts.includes('alt') || parts.includes('option'),
      shiftKey: parts.includes('shift'),
      key: parts[parts.length - 1].toUpperCase()
    };
  };

  // Check if key event matches shortcut
  const matchesShortcut = (event: KeyboardEvent, shortcut: string) => {
    const parsed = parseShortcut(shortcut);
    return (
      event.ctrlKey === parsed.ctrlKey &&
      event.metaKey === parsed.metaKey &&
      event.altKey === parsed.altKey &&
      event.shiftKey === parsed.shiftKey &&
      event.key.toUpperCase() === parsed.key
    );
  };

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check each shortcut
    for (const [action, shortcut] of Object.entries(shortcuts)) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        
        const actionFn = allActions[action as keyof ShortcutActions];
        if (actionFn) {
          actionFn();
        }
        break;
      }
    }
  }, [shortcuts, allActions]);

  // Register global shortcuts if enabled
  useEffect(() => {
    if (enableGlobalShortcuts) {
      // Register global shortcuts with backend
      for (const [action, shortcut] of Object.entries(shortcuts)) {
        invoke('register_global_shortcut', { shortcut, action })
          .catch(error => {
            console.warn(`Failed to register global shortcut ${shortcut}:`, error);
          });
      }

      // Cleanup function to unregister shortcuts
      return () => {
        for (const shortcut of Object.values(shortcuts)) {
          invoke('unregister_global_shortcut', { shortcut })
            .catch(console.error);
        }
      };
    }
  }, [shortcuts, enableGlobalShortcuts]);

  // Register local keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    enableGlobalShortcuts,
    registerShortcut: (action: string, shortcut: string) => {
      // This would update the settings
      console.log(`Registering shortcut: ${action} -> ${shortcut}`);
    }
  };
}

// Hook for individual components to register custom shortcuts
export function useCustomShortcuts(customShortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const [shortcut, action] of Object.entries(customShortcuts)) {
        const parts = shortcut.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const modifiers = parts.slice(0, -1);

        const matches = (
          (!modifiers.includes('ctrl') || event.ctrlKey) &&
          (!modifiers.includes('cmd') || event.metaKey) &&
          (!modifiers.includes('alt') || event.altKey) &&
          (!modifiers.includes('shift') || event.shiftKey) &&
          event.key.toLowerCase() === key
        );

        if (matches) {
          event.preventDefault();
          action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [customShortcuts]);
}