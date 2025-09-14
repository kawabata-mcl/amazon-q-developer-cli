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