import { useEffect, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useSettings } from './use-settings';
import { useChatStore } from '@/stores/chat-store';

interface ShortcutActions {
  'new-conversation': () => void;
  'toggle-sidebar': () => void;
  'search': () => void;
  'settings': () => void;
  'quit': () => void;
  'copy': () => void;
  'paste': () => void;
  'cut': () => void;
  'undo': () => void;
  'redo': () => void;
  'select-all': () => void;
  'find': () => void;
  'zoom-in': () => void;
  'zoom-out': () => void;
  'actual-size': () => void;
  'toggle-fullscreen': () => void;
  'minimize': () => void;
  'close-window': () => void;
  'save': () => void;
  'open': () => void;
  'refresh': () => void;
}

// macOS standard shortcuts
export const MACOS_STANDARD_SHORTCUTS = {
  'new-conversation': 'Cmd+N',
  'open': 'Cmd+O',
  'save': 'Cmd+S',
  'copy': 'Cmd+C',
  'paste': 'Cmd+V',
  'cut': 'Cmd+X',
  'undo': 'Cmd+Z',
  'redo': 'Cmd+Shift+Z',
  'select-all': 'Cmd+A',
  'find': 'Cmd+F',
  'quit': 'Cmd+Q',
  'minimize': 'Cmd+M',
  'close-window': 'Cmd+W',
  'toggle-fullscreen': 'Ctrl+Cmd+F',
  'zoom-in': 'Cmd+Plus',
  'zoom-out': 'Cmd+Minus',
  'actual-size': 'Cmd+0',
  'refresh': 'Cmd+R',
  'settings': 'Cmd+Comma',
  'toggle-sidebar': 'Cmd+Shift+S',
  'search': 'Cmd+K',
} as const;

// Accessibility shortcuts
export const ACCESSIBILITY_SHORTCUTS = {
  'increase-font-size': 'Cmd+Plus',
  'decrease-font-size': 'Cmd+Minus',
  'reset-font-size': 'Cmd+0',
  'toggle-high-contrast': 'Ctrl+Option+Cmd+8',
  'toggle-voice-over': 'Cmd+F5',
  'toggle-zoom': 'Option+Cmd+8',
} as const;

export function useKeyboardShortcuts(actions: Partial<ShortcutActions>) {
  const { settings, updateSetting } = useSettings();
  const { shortcuts, enableGlobalShortcuts, enableAccessibilityShortcuts } = settings.keyboard;
  const { startNewConversation } = useChatStore();
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(100);

  // Default actions with macOS standard behavior
  const defaultActions: ShortcutActions = {
    'new-conversation': () => {
      startNewConversation();
      announceToScreenReader('New conversation started');
    },
    'toggle-sidebar': () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      announceToScreenReader('Sidebar toggled');
    },
    'search': () => {
      window.dispatchEvent(new CustomEvent('open-search'));
      announceToScreenReader('Search opened');
    },
    'settings': () => {
      window.dispatchEvent(new CustomEvent('open-settings'));
      announceToScreenReader('Settings opened');
    },
    'quit': () => {
      invoke('quit_app').catch(console.error);
    },
    'copy': () => {
      document.execCommand('copy');
      announceToScreenReader('Copied to clipboard');
    },
    'paste': () => {
      document.execCommand('paste');
      announceToScreenReader('Pasted from clipboard');
    },
    'cut': () => {
      document.execCommand('cut');
      announceToScreenReader('Cut to clipboard');
    },
    'undo': () => {
      document.execCommand('undo');
      announceToScreenReader('Undone');
    },
    'redo': () => {
      document.execCommand('redo');
      announceToScreenReader('Redone');
    },
    'select-all': () => {
      document.execCommand('selectAll');
      announceToScreenReader('All content selected');
    },
    'find': () => {
      window.dispatchEvent(new CustomEvent('open-find'));
      announceToScreenReader('Find dialog opened');
    },
    'zoom-in': () => {
      const newZoom = Math.min(currentZoomLevel + 10, 200);
      setCurrentZoomLevel(newZoom);
      document.documentElement.style.zoom = `${newZoom}%`;
      announceToScreenReader(`Zoomed in to ${newZoom}%`);
    },
    'zoom-out': () => {
      const newZoom = Math.max(currentZoomLevel - 10, 50);
      setCurrentZoomLevel(newZoom);
      document.documentElement.style.zoom = `${newZoom}%`;
      announceToScreenReader(`Zoomed out to ${newZoom}%`);
    },
    'actual-size': () => {
      setCurrentZoomLevel(100);
      document.documentElement.style.zoom = '100%';
      announceToScreenReader('Zoom reset to actual size');
    },
    'toggle-fullscreen': () => {
      invoke('handle_menu_event', { menuId: 'toggle_fullscreen' }).catch(console.error);
      announceToScreenReader('Fullscreen toggled');
    },
    'minimize': () => {
      invoke('minimize_window').catch(console.error);
      announceToScreenReader('Window minimized');
    },
    'close-window': () => {
      invoke('close_window').catch(console.error);
    },
    'save': () => {
      window.dispatchEvent(new CustomEvent('save-conversation'));
      announceToScreenReader('Conversation saved');
    },
    'open': () => {
      window.dispatchEvent(new CustomEvent('open-file-dialog'));
      announceToScreenReader('File dialog opened');
    },
    'refresh': () => {
      window.location.reload();
      announceToScreenReader('Page refreshed');
    },
  };

  // Screen reader announcement function
  const announceToScreenReader = (message: string) => {
    if (!isVoiceOverEnabled && !enableAccessibilityShortcuts) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Merge provided actions with defaults
  const allActions = { ...defaultActions, ...actions };

  // Parse shortcut string to key combination with macOS support
  const parseShortcut = (shortcut: string) => {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    
    // Handle special keys
    let parsedKey = key.toUpperCase();
    if (key === 'plus' || key === '=') parsedKey = '+';
    if (key === 'minus' || key === '-') parsedKey = '-';
    if (key === 'comma') parsedKey = ',';
    if (key === 'space') parsedKey = ' ';
    if (key === 'enter') parsedKey = 'Enter';
    if (key === 'escape') parsedKey = 'Escape';
    if (key === 'tab') parsedKey = 'Tab';
    if (key === 'backspace') parsedKey = 'Backspace';
    if (key === 'delete') parsedKey = 'Delete';
    
    return {
      ctrlKey: parts.includes('ctrl'),
      metaKey: parts.includes('cmd') || parts.includes('meta'),
      altKey: parts.includes('alt') || parts.includes('option'),
      shiftKey: parts.includes('shift'),
      key: parsedKey
    };
  };

  // Check if key event matches shortcut with improved matching
  const matchesShortcut = (event: KeyboardEvent, shortcut: string) => {
    const parsed = parseShortcut(shortcut);
    
    // Handle special key mappings
    let eventKey = event.key;
    if (event.key === '=' && event.shiftKey) eventKey = '+';
    if (event.key === '-' && !event.shiftKey) eventKey = '-';
    
    return (
      event.ctrlKey === parsed.ctrlKey &&
      event.metaKey === parsed.metaKey &&
      event.altKey === parsed.altKey &&
      event.shiftKey === parsed.shiftKey &&
      (eventKey === parsed.key || eventKey.toUpperCase() === parsed.key)
    );
  };

  // Handle keyboard events with accessibility support
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Only allow certain shortcuts in input fields
      const allowedInInputs = ['copy', 'paste', 'cut', 'undo', 'redo', 'select-all'];
      let matched = false;
      
      for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (allowedInInputs.includes(action) && matchesShortcut(event, shortcut)) {
          const actionFn = allActions[action as keyof ShortcutActions];
          if (actionFn) {
            actionFn();
            matched = true;
            break;
          }
        }
      }
      
      if (matched) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    // Check standard shortcuts
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

    // Check accessibility shortcuts if enabled
    if (enableAccessibilityShortcuts) {
      for (const [action, shortcut] of Object.entries(ACCESSIBILITY_SHORTCUTS)) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          handleAccessibilityShortcut(action);
          break;
        }
      }
    }
  }, [shortcuts, allActions, enableAccessibilityShortcuts]);

  // Handle accessibility-specific shortcuts
  const handleAccessibilityShortcut = (action: string) => {
    switch (action) {
      case 'increase-font-size':
        updateSetting('appearance', { 
          fontSize: Math.min(settings.appearance.fontSize + 2, 24) 
        });
        announceToScreenReader(`Font size increased to ${settings.appearance.fontSize + 2}px`);
        break;
      case 'decrease-font-size':
        updateSetting('appearance', { 
          fontSize: Math.max(settings.appearance.fontSize - 2, 12) 
        });
        announceToScreenReader(`Font size decreased to ${settings.appearance.fontSize - 2}px`);
        break;
      case 'reset-font-size':
        updateSetting('appearance', { fontSize: 16 });
        announceToScreenReader('Font size reset to default');
        break;
      case 'toggle-high-contrast':
        // Toggle high contrast mode
        document.documentElement.classList.toggle('high-contrast');
        const isHighContrast = document.documentElement.classList.contains('high-contrast');
        announceToScreenReader(`High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`);
        break;
      case 'toggle-voice-over':
        setIsVoiceOverEnabled(!isVoiceOverEnabled);
        announceToScreenReader(`Voice over ${!isVoiceOverEnabled ? 'enabled' : 'disabled'}`);
        break;
      case 'toggle-zoom':
        // This would typically be handled by the system, but we can provide feedback
        announceToScreenReader('System zoom toggled');
        break;
    }
  };

  // Listen for system accessibility changes
  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      try {
        // Check if VoiceOver is enabled (this would need to be implemented in the backend)
        const voiceOverStatus = await invoke<boolean>('is_voice_over_enabled').catch(() => false);
        setIsVoiceOverEnabled(voiceOverStatus);
      } catch (error) {
        console.warn('Failed to check accessibility settings:', error);
      }
    };

    checkAccessibilitySettings();

    // Listen for accessibility setting changes
    const unlistenAccessibility = listen('accessibility-changed', (event) => {
      const { voiceOver } = event.payload as { voiceOver: boolean };
      setIsVoiceOverEnabled(voiceOver);
    });

    return () => {
      unlistenAccessibility.then(fn => fn());
    };
  }, []);

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
    enableAccessibilityShortcuts,
    isVoiceOverEnabled,
    currentZoomLevel,
    registerShortcut: (action: string, shortcut: string) => {
      updateSetting('keyboard', {
        shortcuts: { ...shortcuts, [action]: shortcut }
      });
    },
    resetToDefaults: () => {
      updateSetting('keyboard', {
        shortcuts: MACOS_STANDARD_SHORTCUTS
      });
    },
    announceToScreenReader,
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