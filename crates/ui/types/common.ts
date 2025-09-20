export interface AppState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  authStatus: AuthStatus;
  settings: AppSettings;
  isLoading: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUses?: ToolUse[];
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  windowSettings: WindowSettings;
  chatSettings: ChatSettings;
}

export interface WindowSettings {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

export interface ChatSettings {
  model?: string;
  agent?: string;
  autoSave: boolean;
  maxHistoryLength: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  mimeType?: string | null;
}

export interface ContextFile {
  path: string;
  name: string;
  size: number;
  addedAt: Date;
}

// Error types for network handling
export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface RetryableError {
  canRetry: boolean;
  retryCount?: number;
  maxRetries?: number;
}