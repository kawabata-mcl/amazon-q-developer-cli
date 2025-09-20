/**
 * React hook for error handling
 */

import { useCallback, useRef } from 'react';
import { 
  AppError, 
  handleError, 
  handleAsyncError
} from '@/lib/error-handler';
import { TimeoutError, NetworkError } from '@/types/common';

export interface UseErrorHandlerOptions {
  context?: Record<string, unknown>;
}

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: Record<string, unknown>) => AppError;
  handleAsyncError: <T>(promise: Promise<T>, context?: Record<string, unknown>) => Promise<T>;
  handleTimeoutError: (error: TimeoutError) => void;
  handleNetworkError: (error: NetworkError) => void;
  clearErrors: () => void;
  lastError: AppError | null;
  retryCount: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    context: defaultContext,
  } = options;
  
  const lastErrorRef = useRef<AppError | null>(null);
  const retryCountRef = useRef<number>(0);
  
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
  
  const handleTimeoutError = useCallback((
    error: TimeoutError
  ) => {
    console.error('Timeout error:', error);
  }, []);

  const handleNetworkError = useCallback((
    error: NetworkError
  ) => {
    console.error('Network error:', error);
  }, []);

  const clearErrors = useCallback(() => {
    lastErrorRef.current = null;
    retryCountRef.current = 0;
  }, []);
  
  return {
    handleError: handleErrorCallback,
    handleAsyncError: handleAsyncErrorCallback,
    handleTimeoutError,
    handleNetworkError,
    clearErrors,
    lastError: lastErrorRef.current,
    retryCount: retryCountRef.current
  };
}

// Helper functions
function getErrorTitle(errorType: ErrorType): string {
  const titles: Record<ErrorType, string> = {
    [ErrorType.AUTH_FAILED]: 'Authentication Error',
    [ErrorType.AUTH_EXPIRED]: 'Session Expired',
    [ErrorType.AUTH_INVALID]: 'Invalid Authentication',
    [ErrorType.NETWORK_ERROR]: 'Network Error',
    [ErrorType.NETWORK_TIMEOUT]: 'Timeout',
    [ErrorType.NETWORK_OFFLINE]: 'Offline',
    [ErrorType.API_ERROR]: 'API Error',
    [ErrorType.API_RATE_LIMIT]: 'Rate Limit',
    [ErrorType.API_UNAVAILABLE]: 'Service Unavailable',
    [ErrorType.FILE_NOT_FOUND]: 'File Not Found',
    [ErrorType.FILE_ACCESS_DENIED]: 'Access Denied',
    [ErrorType.FILE_TOO_LARGE]: 'File Too Large',
    [ErrorType.FILE_INVALID_FORMAT]: 'Invalid File Format',
    [ErrorType.CHAT_SEND_FAILED]: 'Message Send Failed',
    [ErrorType.CHAT_HISTORY_LOAD_FAILED]: 'History Load Failed',
    [ErrorType.CHAT_CONTEXT_ERROR]: 'Context Error',
    [ErrorType.SETTINGS_LOAD_FAILED]: 'Settings Load Failed',
    [ErrorType.SETTINGS_SAVE_FAILED]: 'Settings Save Failed',
    [ErrorType.SYSTEM_ERROR]: 'System Error',
    [ErrorType.INITIALIZATION_ERROR]: 'Initialization Error',
    [ErrorType.VALIDATION_ERROR]: 'Input Error',
    [ErrorType.UNKNOWN_ERROR]: 'Unknown Error'
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
      label: 'Retry',
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
      label: 'Login',
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