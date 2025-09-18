import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * 判定: 現在がTauriランタイム上かどうか
 * - window.__TAURI__ が存在するかどうかで簡易判定
 */
export function isTauriRuntime(): boolean {
  const hasWindow = typeof window !== 'undefined';
  const hasTauri = hasWindow && typeof (window as any).__TAURI__ !== 'undefined';
  const hasTauriApi = hasWindow && typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';
  
  console.log(`[isTauriRuntime] hasWindow: ${hasWindow}, hasTauri: ${hasTauri}, hasTauriApi: ${hasTauriApi}`);
  
  return hasWindow && (hasTauri || hasTauriApi);
}

/**
 * Web/SSR 環境でも落ちない `invoke` ラッパー。
 * Tauri でなければ reject せず、適切なフォールバックを返す。
 */
export async function safeInvoke<T = unknown>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  const isTauri = isTauriRuntime();
  console.log(`[safeInvoke] Command: ${command}, isTauriRuntime: ${isTauri}`, args);
  
  if (isTauri) {
    console.log(`[safeInvoke] Invoking Tauri command: ${command}`);
    try {
      const result = await tauriInvoke<T>(command as any, args as any);
      console.log(`[safeInvoke] Tauri command result:`, result);
      return result;
    } catch (error) {
      console.error(`[safeInvoke] Tauri command failed:`, error);
      throw error;
    }
  }

  // フォールバック: 開発中のWeb環境では一部コマンドにダミー値を返す
  console.warn(`[safeInvoke] Non-tauri environment. Using fallback for command: ${command}`);
  switch (command) {
    case 'login':
    case 'get_auth_status': {
      // 未ログインを返却
      return { type: 'NotAuthenticated' } as unknown as T;
    }
    case 'logout': {
      return undefined as unknown as T;
    }
    default: {
      // それ以外は未実装として解決（ログだけ出す）
      if (typeof console !== 'undefined') {
        console.warn(`[safeInvoke] Non-tauri environment. Skipping command: ${command}`, args);
      }
      return undefined as unknown as T;
    }
  }
}


