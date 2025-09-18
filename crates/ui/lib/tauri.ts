import { invoke } from '@tauri-apps/api/tauri';
import type { AuthStatus } from '@/types/auth';
import type { ChatMessage, SendMessageRequest, ChatConversation } from '@/types/chat';
import type { AppSettings } from '@/types/settings';
import { handleAsyncError } from '@/lib/error-handler';

// Authentication commands
export async function loginCommand(): Promise<AuthStatus> {
  return await handleAsyncError(
    invoke<AuthStatus>('login'),
    { command: 'login', component: 'auth' }
  );
}

export async function logoutCommand(): Promise<void> {
  return await handleAsyncError(
    invoke('logout'),
    { command: 'logout', component: 'auth' }
  );
}

export async function getAuthStatusCommand(): Promise<AuthStatus> {
  return await handleAsyncError(
    invoke('get_auth_status'),
    { command: 'get_auth_status', component: 'auth' }
  );
}

// Chat commands
export async function sendMessageCommand(request: SendMessageRequest): Promise<unknown> {
  return await handleAsyncError(
    invoke('send_message', {
      message: request.message,
      conversation_id: request.conversationId,
      context: request.context,
    }),
    { command: 'send_message', component: 'chat', message: request.message }
  );
}

export async function sendMessageStreamCommand(message: string): Promise<void> {
  return await invoke('send_message_stream', { message });
}

export async function getConversationHistoryCommand(conversationId: string): Promise<ChatMessage[]> {
  return await invoke('get_conversation_history', { conversation_id: conversationId });
}

export async function startNewConversationCommand(): Promise<string> {
  return await invoke('start_new_conversation');
}

export async function getAllConversationsCommand(): Promise<ChatConversation[]> {
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
export async function getAppSettingsCommand(): Promise<AppSettings> {
  return await invoke('get_app_settings');
}

export async function updateAppSettingsCommand(settings: AppSettings): Promise<void> {
  return await invoke('update_app_settings', { settings });
}

export async function resetAppSettingsCommand(): Promise<void> {
  return await invoke('reset_app_settings');
}