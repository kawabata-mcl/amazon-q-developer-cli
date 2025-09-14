export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUses?: ToolUse[];
  metadata?: MessageMetadata;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'success' | 'error';
}

export interface MessageMetadata {
  model?: string;
  agent?: string;
  processingTime?: number;
  tokenCount?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  agent?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  context?: FileContext[];
}

export interface SendMessageResponse {
  messageId: string;
  conversationId: string;
  response: ChatMessage;
}

export interface FileContext {
  fileName: string;
  content: string;
  mimeType?: string;
  size?: number;
}