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