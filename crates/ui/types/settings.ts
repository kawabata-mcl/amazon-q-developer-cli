export interface AppSettings {
  appearance: AppearanceSettings;
  window: WindowSettings;
  keyboard: KeyboardSettings;
  general: GeneralSettings;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  accentColor: string;
}

export interface WindowSettings {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
  alwaysOnTop: boolean;
  rememberPosition: boolean;
}

export interface KeyboardSettings {
  shortcuts: Record<string, string>;
  enableGlobalShortcuts: boolean;
  enableAccessibilityShortcuts: boolean;
}

export interface GeneralSettings {
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  maxConversationHistory: number;
  enableNotifications: boolean;
  language: string;
}

export interface SettingsTab {
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'system',
    fontSize: 14,
    fontFamily: 'system-ui',
    accentColor: '#3b82f6'
  },
  window: {
    width: 1200,
    height: 800,
    maximized: false,
    alwaysOnTop: false,
    rememberPosition: true
  },
  keyboard: {
    shortcuts: {
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
    },
    enableGlobalShortcuts: false,
    enableAccessibilityShortcuts: true,
  },
  general: {
    autoSave: true,
    autoSaveInterval: 30,
    maxConversationHistory: 100,
    enableNotifications: true,
    language: 'en'
  }
};

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'general', label: 'General', icon: 'Settings' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { id: 'window', label: 'Window', icon: 'Monitor' },
  { id: 'keyboard', label: 'Keyboard', icon: 'Keyboard' }
];