export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUses?: ToolUse[];
  metadata?: MessageMetadata;
  status?: MessageStatus;
  error?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'completed' | 'failed';

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

export interface ChatError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  message: string;
  details?: string;
  retryable?: boolean;
}

export interface StreamChunk {
  chunk_id: string;
  conversation_id: string;
  content: string;
  is_complete: boolean;
  error?: string;
}

export interface ConversationStats {
  total_conversations: number;
  total_messages: number;
  conversations_today: number;
  conversations_this_week: number;
  conversations_this_month: number;
}