export const APP_NAME = 'Amazon Q Desktop';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  SETTINGS: '/settings',
  AUTH: '/auth',
} as const;

export const STORAGE_KEYS = {
  THEME: 'theme',
  WINDOW_SETTINGS: 'windowSettings',
  CHAT_SETTINGS: 'chatSettings',
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_FILE_TYPES = [
  '.txt',
  '.md',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.rs',
  '.go',
  '.java',
  '.cpp',
  '.c',
  '.h',
  '.css',
  '.html',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
];