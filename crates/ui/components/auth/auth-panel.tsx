'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, LogIn, LogOut, User, RefreshCw } from 'lucide-react';

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

  // Local UI state for login options
  const [authMethod, setAuthMethod] = useState<'pkce' | 'device'>('pkce');
  const [startUrl, setStartUrl] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  const { refreshToken } = useAuthStore();

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
    const options = authMethod === 'pkce'
      ? {
          method: 'pkce' as const,
          start_url: startUrl || undefined,
          region: region || undefined,
        }
      : {
          method: 'device' as const,
          start_url: startUrl || undefined,
          region: region || undefined,
        };
    await login(options);
  };

  const handleLogout = async () => {
    clearError();
    try {
      await logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      console.error(message);
    }
  };

  const handleRefreshToken = async () => {
    clearError();
    try {
      await refreshToken();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      console.error(message);
    }
  };

  return (
    <Card className={`p-6 ${className || ''}`} data-testid="auth-panel">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sign in
          </h2>
        </div>

        {/* Authentication Status */}
        <div className="space-y-3">
          {/* Removed authenticating indicator per requirements */}

          {isAuthenticated && user && (
            <div className="space-y-2" data-testid="auth-success">
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


          {hasError && errorMessage && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="auth-error">
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

        {/* Method Selection & Inputs */}
        {!isAuthenticated && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">Method</label>
              <select
                className="text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value as 'pkce' | 'device')}
                data-testid="auth-method-select"
              >
                <option value="pkce">Identity Center</option>
                <option value="device">Builder ID</option>
              </select>
            </div>
            {authMethod === 'pkce' && (
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start URL</label>
                  <input
                    className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                    placeholder="https://your-domain.awsapps.com/start"
                    value={startUrl}
                    onChange={(e) => setStartUrl(e.target.value)}
                    data-testid="start-url-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Region</label>
                  <input
                    className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                    placeholder="us-east-1"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    data-testid="region-input"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isAuthenticated ? (
            <Button
              onClick={handleLogin}
              disabled={
                isAuthenticating || (authMethod === 'pkce' && (!startUrl.trim() || !region.trim()))
              }
              className="flex items-center space-x-2 cursor-pointer"
              data-testid="login-button"
            >
              {isAuthenticating ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              <span>{isAuthenticating ? 'Logging in...' : 'Login'}</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleLogout}
                disabled={isAuthenticating}
                variant="outline"
                className="flex items-center space-x-2"
                data-testid="logout-button"
              >
                {isAuthenticating ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>{isAuthenticating ? 'Logging out...' : 'Logout'}</span>
              </Button>
              
              <Button
                onClick={handleRefreshToken}
                disabled={isAuthenticating}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="refresh-token-button"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Token</span>
              </Button>
            </>
          )}

          {hasError && (
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              data-testid="clear-error-button"
            >
              Clear Error
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!isAuthenticated && !isAuthenticating && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            <p>
              Choose Identity Center or Builder ID to sign in.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}