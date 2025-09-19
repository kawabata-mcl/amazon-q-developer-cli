// Avoid importing Tauri APIs at module scope to prevent SSR issues
async function getInvoke() {
  // Dynamically import only on client
  const { invoke } = await import('@tauri-apps/api/tauri');
  return invoke;
}
import type { AuthStatus, LoginResponse } from '@/types/auth';
import type { ChatMessage, SendMessageRequest, ChatConversation } from '@/types/chat';
import type { AppSettings } from '@/types/common';
import { handleAsyncError } from '@/lib/error-handler';

// Authentication commands
export async function loginCommand(): Promise<LoginResponse> {
  try {
    const invoke = await getInvoke();
    const status = await handleAsyncError(
      invoke<AuthStatus>('login' as never),
      { command: 'login', component: 'auth' }
    );
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
  const invoke = await getInvoke();
  return await handleAsyncError(
    invoke('logout' as never),
    { command: 'logout', component: 'auth' }
  );
}

export async function getAuthStatusCommand(): Promise<AuthStatus> {
  const invoke = await getInvoke();
  return await handleAsyncError(
    invoke('get_auth_status' as never),
    { command: 'get_auth_status', component: 'auth' }
  );
}

// Chat commands
export async function sendMessageCommand(request: SendMessageRequest): Promise<unknown> {
  const invoke = await getInvoke();
  return await handleAsyncError(
    invoke('send_message' as never, {
      message: request.message,
      conversation_id: request.conversationId,
      context: request.context,
    }),
    { command: 'send_message', component: 'chat', message: request.message }
  );
}

export async function getConversationHistoryCommand(conversationId: string): Promise<ChatMessage[]> {
  const invoke = await getInvoke();
  return await invoke('get_conversation_history' as never, { conversation_id: conversationId });
}

export async function startNewConversationCommand(): Promise<string> {
  const invoke = await getInvoke();
  return await invoke('start_new_conversation' as never);
}

export async function getConversationsCommand(): Promise<ChatConversation[]> {
  const invoke = await getInvoke();
  return await invoke('get_all_conversations' as never);
}

// File operations commands
export async function readFileContentCommand(filePath: string): Promise<{ path: string; content: string; size: number; mime_type?: string | null }> {
  const invoke = await getInvoke();
  return await invoke('read_file_content' as never, { file_path: filePath });
}

export async function saveFileContentCommand(filePath: string, content: string): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('save_file_content' as never, { file_path: filePath, content });
}

export async function addFileContextCommand(fileName: string, content: string): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('add_file_context' as never, { file_name: fileName, content });
}

export async function addFileToContextByPathCommand(filePath: string): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('add_file_to_context_by_path' as never, { file_path: filePath });
}

export async function getContextFilesCommand(): Promise<Array<[string, string]>> {
  const invoke = await getInvoke();
  return await invoke('get_context_files' as never);
}

export async function removeFileFromContextCommand(filePath: string): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('remove_file_from_context' as never, { file_path: filePath });
}

export async function clearContextCommand(): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('clear_context' as never);
}

// Settings commands
export async function getSettingsCommand(): Promise<Record<string, unknown>> {
  const invoke = await getInvoke();
  return await invoke('get_settings' as never);
}

export async function saveSettingsCommand(settings: AppSettings): Promise<void> {
  const invoke = await getInvoke();
  return await invoke('update_settings' as never, { settings });
}