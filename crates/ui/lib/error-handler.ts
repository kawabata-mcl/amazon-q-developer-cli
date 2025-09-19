/**
 * Global error handling system for the desktop application
 */

// Load Tauri invoke lazily to avoid SSR issues
async function getInvoke() {
  const { invoke } = await import('@tauri-apps/api/tauri');
  return invoke;
}

// Error types and interfaces
export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
}

export enum ErrorType {
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  
  // File operation errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_FORMAT = 'FILE_INVALID_FORMAT',
  
  // Chat errors
  CHAT_SEND_FAILED = 'CHAT_SEND_FAILED',
  CHAT_HISTORY_LOAD_FAILED = 'CHAT_HISTORY_LOAD_FAILED',
  CHAT_CONTEXT_ERROR = 'CHAT_CONTEXT_ERROR',
  
  // Settings errors
  SETTINGS_LOAD_FAILED = 'SETTINGS_LOAD_FAILED',
  SETTINGS_SAVE_FAILED = 'SETTINGS_SAVE_FAILED',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error classification mapping
const ERROR_SEVERITY_MAP: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.AUTH_FAILED]: ErrorSeverity.HIGH,
  [ErrorType.AUTH_EXPIRED]: ErrorSeverity.MEDIUM,
  [ErrorType.AUTH_INVALID]: ErrorSeverity.HIGH,
  [ErrorType.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.NETWORK_TIMEOUT]: ErrorSeverity.MEDIUM,
  [ErrorType.NETWORK_OFFLINE]: ErrorSeverity.HIGH,
  [ErrorType.API_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.API_RATE_LIMIT]: ErrorSeverity.MEDIUM,
  [ErrorType.API_UNAVAILABLE]: ErrorSeverity.HIGH,
  [ErrorType.FILE_NOT_FOUND]: ErrorSeverity.LOW,
  [ErrorType.FILE_ACCESS_DENIED]: ErrorSeverity.MEDIUM,
  [ErrorType.FILE_TOO_LARGE]: ErrorSeverity.LOW,
  [ErrorType.FILE_INVALID_FORMAT]: ErrorSeverity.LOW,
  [ErrorType.CHAT_SEND_FAILED]: ErrorSeverity.MEDIUM,
  [ErrorType.CHAT_HISTORY_LOAD_FAILED]: ErrorSeverity.LOW,
  [ErrorType.CHAT_CONTEXT_ERROR]: ErrorSeverity.LOW,
  [ErrorType.SETTINGS_LOAD_FAILED]: ErrorSeverity.MEDIUM,
  [ErrorType.SETTINGS_SAVE_FAILED]: ErrorSeverity.MEDIUM,
  [ErrorType.SYSTEM_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.INITIALIZATION_ERROR]: ErrorSeverity.CRITICAL,
  [ErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ErrorType.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM
};

// User-friendly error messages
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTH_FAILED]: 'Login failed. Please check your credentials.',
  [ErrorType.AUTH_EXPIRED]: 'Session expired. Please log in again.',
  [ErrorType.AUTH_INVALID]: 'Invalid credentials. Please log in again.',
  [ErrorType.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
  [ErrorType.NETWORK_TIMEOUT]: 'Request timed out. Please try again later.',
  [ErrorType.NETWORK_OFFLINE]: 'No internet connection. Please check your connection.',
  [ErrorType.API_ERROR]: 'Service error occurred. Please try again later.',
  [ErrorType.API_RATE_LIMIT]: 'Rate limit reached. Please try again later.',
  [ErrorType.API_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [ErrorType.FILE_NOT_FOUND]: 'File not found.',
  [ErrorType.FILE_ACCESS_DENIED]: 'File access denied.',
  [ErrorType.FILE_TOO_LARGE]: 'File size too large.',
  [ErrorType.FILE_INVALID_FORMAT]: 'Unsupported file format.',
  [ErrorType.CHAT_SEND_FAILED]: 'Failed to send message.',
  [ErrorType.CHAT_HISTORY_LOAD_FAILED]: 'Failed to load conversation history.',
  [ErrorType.CHAT_CONTEXT_ERROR]: 'Error processing context.',
  [ErrorType.SETTINGS_LOAD_FAILED]: 'Failed to load settings.',
  [ErrorType.SETTINGS_SAVE_FAILED]: 'Failed to save settings.',
  [ErrorType.SYSTEM_ERROR]: 'System error occurred.',
  [ErrorType.INITIALIZATION_ERROR]: 'Application initialization failed.',
  [ErrorType.VALIDATION_ERROR]: 'Input validation error.',
  [ErrorType.UNKNOWN_ERROR]: 'Unexpected error occurred.'
};

// Error classification function
export function classifyError(error: unknown): ErrorType {
  let errorMessage: string | null = null;
  if (typeof error === 'string') {
    errorMessage = error.toLowerCase();
  } else if (error instanceof Error && typeof error.message === 'string') {
    errorMessage = error.message.toLowerCase();
  } else if (error && typeof (error as { message?: unknown }).message === 'string') {
    errorMessage = String((error as { message: string }).message).toLowerCase();
  }

  if (errorMessage) {
    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('unauthorized')) {
      if (errorMessage.includes('expired') || errorMessage.includes('timeout')) {
        return ErrorType.AUTH_EXPIRED;
      }
      if (errorMessage.includes('invalid') || errorMessage.includes('denied')) {
        return ErrorType.AUTH_INVALID;
      }
      return ErrorType.AUTH_FAILED;
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      if (errorMessage.includes('timeout')) {
        return ErrorType.NETWORK_TIMEOUT;
      }
      if (errorMessage.includes('offline') || errorMessage.includes('unreachable')) {
        return ErrorType.NETWORK_OFFLINE;
      }
      return ErrorType.NETWORK_ERROR;
    }

    // API errors
    if (errorMessage.includes('api') || errorMessage.includes('service')) {
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        return ErrorType.API_RATE_LIMIT;
      }
      if (errorMessage.includes('unavailable') || errorMessage.includes('maintenance')) {
        return ErrorType.API_UNAVAILABLE;
      }
      return ErrorType.API_ERROR;
    }

    // File errors
    if (errorMessage.includes('file')) {
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        return ErrorType.FILE_NOT_FOUND;
      }
      if (errorMessage.includes('access denied') || errorMessage.includes('permission')) {
        return ErrorType.FILE_ACCESS_DENIED;
      }
      if (errorMessage.includes('too large') || errorMessage.includes('size limit')) {
        return ErrorType.FILE_TOO_LARGE;
      }
      if (errorMessage.includes('format') || errorMessage.includes('invalid')) {
        return ErrorType.FILE_INVALID_FORMAT;
      }
    }

    // Chat errors
    if (errorMessage.includes('message') || errorMessage.includes('chat')) {
      if (errorMessage.includes('send') || errorMessage.includes('failed')) {
        return ErrorType.CHAT_SEND_FAILED;
      }
      if (errorMessage.includes('history') || errorMessage.includes('load')) {
        return ErrorType.CHAT_HISTORY_LOAD_FAILED;
      }
      return ErrorType.CHAT_CONTEXT_ERROR;
    }

    // Settings errors
    if (errorMessage.includes('settings') || errorMessage.includes('config')) {
      if (errorMessage.includes('load') || errorMessage.includes('read')) {
        return ErrorType.SETTINGS_LOAD_FAILED;
      }
      if (errorMessage.includes('save') || errorMessage.includes('write')) {
        return ErrorType.SETTINGS_SAVE_FAILED;
      }
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // System errors
    if (errorMessage.includes('system') || errorMessage.includes('initialization')) {
      return ErrorType.SYSTEM_ERROR;
    }
  }

  return ErrorType.UNKNOWN_ERROR;
}

// Create AppError from unknown error
export function createAppError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  const errorType = classifyError(error);
  const timestamp = new Date();
  const id = `${errorType}_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let message: string;
  let details: string | undefined;
  let stack: string | undefined;
  
  if (error instanceof Error) {
    message = error.message;
    details = error.name;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'Unknown error occurred';
    details = JSON.stringify(error);
  }
  
  return {
    id,
    type: errorType,
    message,
    details,
    timestamp,
    context,
    stack
  };
}

// Get user-friendly message for error
export function getUserFriendlyMessage(error: AppError): string {
  return USER_FRIENDLY_MESSAGES[error.type] || USER_FRIENDLY_MESSAGES[ErrorType.UNKNOWN_ERROR];
}

// Get error severity
export function getErrorSeverity(error: AppError): ErrorSeverity {
  return ERROR_SEVERITY_MAP[error.type] || ErrorSeverity.MEDIUM;
}

// Log error to backend
export async function logError(error: AppError): Promise<void> {
  try {
    const invoke = await getInvoke();
    await invoke('log_error' as never, {
      error: {
        id: error.id,
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        context: error.context,
        stack: error.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log error to backend:', logError);
    console.error('Original error:', error);
  }
}

// Global error handler class
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];
  
  private constructor() {
    this.setupGlobalHandlers();
  }
  
  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }
  
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
      const error = createAppError(event.reason, { source: 'unhandledrejection' });
      this.handleError(error);
      event.preventDefault();
      });
    
    // Handle uncaught errors
      window.addEventListener('error', (event) => {
        const error = createAppError(event.error || event.message, {
          source: 'uncaughtError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        this.handleError(error);
      });
    
    // Handle React error boundary errors (if using React)
      if ((window as any).React) {
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          // Check if this is a React error
          if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
            const error = createAppError(args.join(' '), { source: 'react' });
            this.handleError(error);
          }
          originalConsoleError.apply(console, args);
        };
      }
    }
  }
  
  public handleError(error: AppError): void {
    // Log error
    logError(error).catch(console.error);
    
    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
  
  public addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }
  
  public handleAsyncError(promise: Promise<any>, context?: Record<string, unknown>): Promise<any> {
    return promise.catch(error => {
      const appError = createAppError(error, context);
      this.handleError(appError);
      throw appError;
    });
  }
}

// Convenience functions
let handlerSingleton: GlobalErrorHandler | null = null;
export function getErrorHandler(): GlobalErrorHandler {
  if (!handlerSingleton) {
    handlerSingleton = GlobalErrorHandler.getInstance();
  }
  return handlerSingleton;
}

export function handleError(error: unknown, context?: Record<string, unknown>): AppError {
  const appError = createAppError(error, context);
  getErrorHandler().handleError(appError);
  return appError;
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return getErrorHandler().handleAsyncError(promise, context);
}