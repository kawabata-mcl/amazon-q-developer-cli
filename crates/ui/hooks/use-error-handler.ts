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

// Specialized hooks for specific error types (context-only)
export function useAuthErrorHandler() {
  return useErrorHandler({
    context: { component: 'auth' }
  });
}

export function useChatErrorHandler() {
  return useErrorHandler({
    context: { component: 'chat' }
  });
}

export function useFileErrorHandler() {
  return useErrorHandler({
    context: { component: 'file' }
  });
}

export function useSettingsErrorHandler() {
  return useErrorHandler({
    context: { component: 'settings' }
  });
}