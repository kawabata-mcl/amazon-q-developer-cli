'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, LogIn, LogOut, User } from 'lucide-react';

interface AuthPanelProps {
  className?: string;
}

export function AuthPanel({ className }: AuthPanelProps) {
  const {
    isAuthenticated,
    isAuthenticating,
    hasError,
    user,
    errorMessage,
    login,
    logout,
    clearError,
  } = useAuth();

  // Clear error when component unmounts or auth status changes
  useEffect(() => {
    return () => {
      if (hasError) {
        clearError();
      }
    };
  }, [hasError, clearError]);

  const handleLogin = async () => {
    clearError();
    await login();
  };

  const handleLogout = async () => {
    clearError();
    await logout();
  };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Authentication
          </h2>
        </div>

        {/* Authentication Status */}
        <div className="space-y-3">
          {isAuthenticating && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Spinner className="h-4 w-4" />
              <span className="text-sm">Authenticating...</span>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Authenticated</span>
              </div>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                <div className="text-sm text-green-800 dark:text-green-200">
                  <div><strong>Username:</strong> {user.username}</div>
                  <div><strong>Provider:</strong> {user.provider}</div>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && !isAuthenticating && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Not authenticated</span>
            </div>
          )}

          {hasError && errorMessage && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <div className="font-medium">Authentication Error</div>
                  <div className="mt-1">{errorMessage}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!isAuthenticated ? (
            <Button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="flex items-center space-x-2"
            >
              {isAuthenticating ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              <span>{isAuthenticating ? 'Logging in...' : 'Login'}</span>
            </Button>
          ) : (
            <Button
              onClick={handleLogout}
              disabled={isAuthenticating}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isAuthenticating ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{isAuthenticating ? 'Logging out...' : 'Logout'}</span>
            </Button>
          )}

          {hasError && (
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
            >
              Clear Error
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!isAuthenticated && !isAuthenticating && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            <p>
              Click "Login" to authenticate with Amazon Q Developer. 
              This will open your default browser for the authentication process.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}