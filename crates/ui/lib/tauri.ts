import { invoke } from '@tauri-apps/api/tauri';
import type { AuthStatus, LoginResponse } from '@/types/auth';
import type { ChatMessage, SendMessageRequest, ChatConversation } from '@/types/chat';
import type { AppSettings } from '@/types/common';

// Authentication commands
export async function loginCommand(): Promise<LoginResponse> {
  try {
    const status = await invoke<AuthStatus>('login');
    return {
      success: true,
      status,
    };
  } catch (error) {
    return {
      success: false,
      status: { type: 'Error', message: error as string },
      error: error as string,
    };
  }
}

export async function logoutCommand(): Promise<void> {
  return await invoke('logout');
}

export async function getAuthStatusCommand(): Promise<AuthStatus> {
  return await invoke('get_auth_status');
}

// Chat commands
export async function sendMessageCommand(request: SendMessageRequest): Promise<unknown> {
  return await invoke('send_message', {
    message: request.message,
    conversation_id: request.conversationId,
    context: request.context,
  });
}

export async function getConversationHistoryCommand(conversationId: string): Promise<ChatMessage[]> {
  return await invoke('get_conversation_history', { conversation_id: conversationId });
}

export async function startNewConversationCommand(): Promise<string> {
  return await invoke('start_new_conversation');
}

export async function getConversationsCommand(): Promise<ChatConversation[]> {
  return await invoke('get_all_conversations');
}

// File operations commands
export async function readFileContentCommand(filePath: string): Promise<{ path: string; content: string; size: number; mime_type?: string | null }> {
  return await invoke('read_file_content', { file_path: filePath });
}

export async function saveFileContentCommand(filePath: string, content: string): Promise<void> {
  return await invoke('save_file_content', { file_path: filePath, content });
}

export async function addFileContextCommand(fileName: string, content: string): Promise<void> {
  return await invoke('add_file_context', { file_name: fileName, content });
}

export async function addFileToContextByPathCommand(filePath: string): Promise<void> {
  return await invoke('add_file_to_context_by_path', { file_path: filePath });
}

export async function getContextFilesCommand(): Promise<Array<[string, string]>> {
  return await invoke('get_context_files');
}

export async function removeFileFromContextCommand(filePath: string): Promise<void> {
  return await invoke('remove_file_from_context', { file_path: filePath });
}

export async function clearContextCommand(): Promise<void> {
  return await invoke('clear_context');
}

// Settings commands
export async function getSettingsCommand(): Promise<Record<string, unknown>> {
  return await invoke('get_settings');
}

export async function saveSettingsCommand(settings: AppSettings): Promise<void> {
  return await invoke('update_settings', { settings });
}