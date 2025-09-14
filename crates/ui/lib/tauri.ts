import { invoke } from '@tauri-apps/api/tauri';
import type { AuthStatus, LoginResponse } from '@/types/auth';
import type { ChatMessage, SendMessageRequest, SendMessageResponse, ChatConversation } from '@/types/chat';
import type { AppSettings } from '@/types/common';

// Authentication commands
export async function loginCommand(): Promise<LoginResponse> {
  return await invoke('login');
}

export async function logoutCommand(): Promise<void> {
  return await invoke('logout');
}

export async function getAuthStatusCommand(): Promise<AuthStatus> {
  return await invoke('get_auth_status');
}

// Chat commands
export async function sendMessageCommand(request: SendMessageRequest): Promise<SendMessageResponse> {
  return await invoke('send_message', {
    message: request.message,
    conversationId: request.conversationId,
    context: request.context,
  });
}

export async function getConversationHistoryCommand(conversationId: string): Promise<ChatMessage[]> {
  return await invoke('get_conversation_history', { conversationId });
}

export async function startNewConversationCommand(): Promise<string> {
  return await invoke('start_new_conversation');
}

export async function getConversationsCommand(): Promise<ChatConversation[]> {
  return await invoke('get_conversations');
}

// File operations commands
export async function readFileContentCommand(filePath: string): Promise<string> {
  return await invoke('read_file_content', { filePath });
}

export async function saveFileContentCommand(filePath: string, content: string): Promise<void> {
  return await invoke('save_file_content', { filePath, content });
}

export async function addFileContextCommand(fileName: string, content: string): Promise<void> {
  return await invoke('add_file_context', { fileName, content });
}

// Settings commands
export async function getSettingsCommand(): Promise<Record<string, unknown>> {
  return await invoke('get_settings');
}

export async function saveSettingsCommand(settings: AppSettings): Promise<void> {
  return await invoke('save_settings', { settings });
}