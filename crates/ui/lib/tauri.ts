import { safeInvoke } from '@/lib/tauri-env';
import type { AuthStatus } from '@/types/auth';
import type { ChatMessage, SendMessageRequest, ChatConversation } from '@/types/chat';
import type { AppSettings } from '@/types/settings';
import { handleAsyncError } from '@/lib/error-handler';

// Authentication commands
export type LoginMethod = 'pkce' | 'device';
export interface LoginOptions {
  method?: LoginMethod;
  start_url?: string;
  region?: string;
}

export async function loginCommand(options?: LoginOptions): Promise<AuthStatus> {
  return await handleAsyncError(
    safeInvoke<AuthStatus>('login', options ? { options } : undefined),
    { command: 'login', component: 'auth', options }
  );
}

export async function logoutCommand(): Promise<void> {
  return await handleAsyncError(
    safeInvoke('logout'),
    { command: 'logout', component: 'auth' }
  );
}

export async function getAuthStatusCommand(): Promise<AuthStatus> {
  return await handleAsyncError(
    safeInvoke('get_auth_status'),
    { command: 'get_auth_status', component: 'auth' }
  );
}

export async function refreshAuthTokenCommand(): Promise<AuthStatus> {
  return await handleAsyncError(
    safeInvoke('refresh_auth_token'),
    { command: 'refresh_auth_token', component: 'auth' }
  );
}

// Chat commands
export async function sendMessageCommand(request: SendMessageRequest): Promise<unknown> {
  return await handleAsyncError(
    safeInvoke('send_message', {
      message: request.message,
      conversation_id: request.conversationId,
      context: request.context,
    }),
    { command: 'send_message', component: 'chat', message: request.message }
  );
}

export async function sendMessageStreamCommand(message: string, conversationId?: string): Promise<string> {
  return await safeInvoke<string>('send_message_stream', { message, conversation_id: conversationId, conversationId });
}

export async function getConversationHistoryCommand(conversationId: string): Promise<ChatMessage[]> {
  return await safeInvoke('get_conversation_history', { conversation_id: conversationId, conversationId });
}

export async function startNewConversationCommand(): Promise<string> {
  return await safeInvoke('start_new_conversation');
}

export async function getAllConversationsCommand(): Promise<ChatConversation[]> {
  return await safeInvoke('get_all_conversations');
}

// File operations commands
export async function readFileContentCommand(filePath: string): Promise<{ path: string; content: string; size: number; mime_type?: string | null }> {
  return await safeInvoke('read_file_content', { file_path: filePath });
}

export async function saveFileContentCommand(filePath: string, content: string): Promise<void> {
  return await safeInvoke('save_file_content', { file_path: filePath, content });
}

export async function addFileContextCommand(fileName: string, content: string): Promise<void> {
  return await safeInvoke('add_file_context', { file_name: fileName, content });
}

export async function addFileToContextByPathCommand(filePath: string): Promise<void> {
  return await safeInvoke('add_file_to_context_by_path', { file_path: filePath });
}

export async function getContextFilesCommand(): Promise<Array<[string, string]>> {
  return await safeInvoke('get_context_files');
}

export async function removeFileFromContextCommand(filePath: string): Promise<void> {
  return await safeInvoke('remove_file_from_context', { file_path: filePath });
}

export async function clearContextCommand(): Promise<void> {
  return await safeInvoke('clear_context');
}

// Settings commands
export async function getAppSettingsCommand(): Promise<AppSettings> {
  return await safeInvoke('get_app_settings');
}

export async function updateAppSettingsCommand(settings: AppSettings): Promise<void> {
  return await safeInvoke('update_app_settings', { settings });
}

export async function resetAppSettingsCommand(): Promise<void> {
  return await safeInvoke('reset_app_settings');
}