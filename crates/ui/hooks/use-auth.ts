import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthStatus } from '@/types/auth';

export function useAuth() {
  const {
    status,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus,
    clearError,
    setLoading,
  } = useAuthStore();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Helper functions
  const isAuthenticated = status?.type === 'Authenticated';
  const isAuthenticating = status?.type === 'Authenticating' || isLoading;
  const hasError = status?.type === 'Error' || error !== null;
  
  const getUser = () => {
    if (status?.type === 'Authenticated') {
      return {
        username: status.username,
        provider: status.provider,
      };
    }
    return null;
  };

  const getErrorMessage = () => {
    if (status?.type === 'Error') {
      return status.message;
    }
    return error;
  };

  return {
    // State
    status,
    isLoading,
    error,
    isAuthenticated,
    isAuthenticating,
    hasError,
    user: getUser(),
    errorMessage: getErrorMessage(),

    // Actions
    login,
    logout,
    checkAuthStatus,
    clearError,
    setLoading,
  };
}