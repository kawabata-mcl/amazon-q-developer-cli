/**
 * React hook for error handling
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  AppError, 
  ErrorType, 
  errorHandler, 
  handleError, 
  handleAsyncError,
  getUserFriendlyMessage,
  getErrorSeverity,
  ErrorSeverity
} from '@/lib/error-handler';
import { useNotificationStore } from '@/stores/notification-store';

export interface UseErrorHandlerOptions {
  showNotifications?: boolean;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: Record<string, unknown>) => AppError;
  handleAsyncError: <T>(promise: Promise<T>, context?: Record<string, unknown>) => Promise<T>;
  clearErrors: () => void;
  lastError: AppError | null;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showNotifications = true,
    logErrors = true,
    context: defaultContext
  } = options;
  
  const { addNotification } = useNotificationStore();
  const lastErrorRef = useRef<AppError | null>(null);
  
  // Error listener for notifications
  useEffect(() => {
    if (!showNotifications) return;
    
    const unsubscribe = errorHandler.addErrorListener((error: AppError) => {
      lastErrorRef.current = error;
      
      const severity = getErrorSeverity(error);
      const userMessage = getUserFriendlyMessage(error);
      
      // Map error severity to notification type
      let notificationType: 'error' | 'warning' | 'info' = 'error';
      if (severity === ErrorSeverity.LOW) {
        notificationType = 'info';
      } else if (severity === ErrorSeverity.MEDIUM) {
        notificationType = 'warning';
      }
      
      addNotification({
        type: notificationType,
        title: getErrorTitle(error.type),
        message: userMessage,
        duration: getNotificationDuration(severity),
        actions: getErrorActions(error)
      });
    });
    
    return unsubscribe;
  }, [showNotifications, addNotification]);
  
  const handleErrorCallback = useCallback((
    error: unknown, 
    context?: Record<string, unknown>
  ): AppError => {
    const combinedContext = { ...defaultContext, ...context };
    return handleError(error, combinedContext);
  }, [defaultContext]);
  
  const handleAsyncErrorCallback = useCallback(<T>(
    promise: Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> => {
    const combinedContext = { ...defaultContext, ...context };
    return handleAsyncError(promise, combinedContext);
  }, [defaultContext]);
  
  const clearErrors = useCallback(() => {
    lastErrorRef.current = null;
  }, []);
  
  return {
    handleError: handleErrorCallback,
    handleAsyncError: handleAsyncErrorCallback,
    clearErrors,
    lastError: lastErrorRef.current
  };
}

// Helper functions
function getErrorTitle(errorType: ErrorType): string {
  const titles: Record<ErrorType, string> = {
    [ErrorType.AUTH_FAILED]: '認証エラー',
    [ErrorType.AUTH_EXPIRED]: 'セッション期限切れ',
    [ErrorType.AUTH_INVALID]: '認証無効',
    [ErrorType.NETWORK_ERROR]: 'ネットワークエラー',
    [ErrorType.NETWORK_TIMEOUT]: 'タイムアウト',
    [ErrorType.NETWORK_OFFLINE]: 'オフライン',
    [ErrorType.API_ERROR]: 'APIエラー',
    [ErrorType.API_RATE_LIMIT]: 'レート制限',
    [ErrorType.API_UNAVAILABLE]: 'サービス利用不可',
    [ErrorType.FILE_NOT_FOUND]: 'ファイル未発見',
    [ErrorType.FILE_ACCESS_DENIED]: 'アクセス拒否',
    [ErrorType.FILE_TOO_LARGE]: 'ファイルサイズ超過',
    [ErrorType.FILE_INVALID_FORMAT]: '無効なファイル形式',
    [ErrorType.CHAT_SEND_FAILED]: 'メッセージ送信失敗',
    [ErrorType.CHAT_HISTORY_LOAD_FAILED]: '履歴読み込み失敗',
    [ErrorType.CHAT_CONTEXT_ERROR]: 'コンテキストエラー',
    [ErrorType.SETTINGS_LOAD_FAILED]: '設定読み込み失敗',
    [ErrorType.SETTINGS_SAVE_FAILED]: '設定保存失敗',
    [ErrorType.SYSTEM_ERROR]: 'システムエラー',
    [ErrorType.INITIALIZATION_ERROR]: '初期化エラー',
    [ErrorType.VALIDATION_ERROR]: '入力エラー',
    [ErrorType.UNKNOWN_ERROR]: '不明なエラー'
  };
  
  return titles[errorType] || titles[ErrorType.UNKNOWN_ERROR];
}

function getNotificationDuration(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 3000; // 3 seconds
    case ErrorSeverity.MEDIUM:
      return 5000; // 5 seconds
    case ErrorSeverity.HIGH:
      return 8000; // 8 seconds
    case ErrorSeverity.CRITICAL:
      return 0; // Persistent until manually dismissed
    default:
      return 5000;
  }
}

function getErrorActions(error: AppError): Array<{ label: string; action: () => void }> {
  const actions: Array<{ label: string; action: () => void }> = [];
  
  // Add retry action for certain error types
  if ([
    ErrorType.NETWORK_ERROR,
    ErrorType.NETWORK_TIMEOUT,
    ErrorType.API_ERROR,
    ErrorType.CHAT_SEND_FAILED
  ].includes(error.type)) {
    actions.push({
      label: '再試行',
      action: () => {
        // This would need to be implemented based on the specific context
        console.log('Retry action for error:', error.id);
      }
    });
  }
  
  // Add login action for auth errors
  if ([
    ErrorType.AUTH_FAILED,
    ErrorType.AUTH_EXPIRED,
    ErrorType.AUTH_INVALID
  ].includes(error.type)) {
    actions.push({
      label: 'ログイン',
      action: () => {
        // Navigate to login page or trigger login
        window.location.href = '/auth';
      }
    });
  }
  
  return actions;
}

// Specialized hooks for specific error types
export function useAuthErrorHandler() {
  return useErrorHandler({
    context: { component: 'auth' },
    showNotifications: true
  });
}

export function useChatErrorHandler() {
  return useErrorHandler({
    context: { component: 'chat' },
    showNotifications: true
  });
}

export function useFileErrorHandler() {
  return useErrorHandler({
    context: { component: 'file' },
    showNotifications: true
  });
}

export function useSettingsErrorHandler() {
  return useErrorHandler({
    context: { component: 'settings' },
    showNotifications: true
  });
}