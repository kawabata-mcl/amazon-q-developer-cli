'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginCommand, logoutCommand, getAuthStatusCommand } from '@/lib/tauri';
import type { AuthStatus } from '@/types/auth';
import { ROUTES } from '@/lib/constants';

export default function AuthPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthStatus = async () => {
    try {
      const status = await getAuthStatusCommand();
      setAuthStatus(status);
      
      // If already authenticated, redirect to chat
      if (status.isAuthenticated) {
        router.push(ROUTES.CHAT);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setError('Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    
    try {
      const response = await loginCommand();
      
      if (response.success && response.user) {
        setAuthStatus({
          isAuthenticated: true,
          user: response.user,
        });
        router.push(ROUTES.CHAT);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCommand();
      setAuthStatus({ isAuthenticated: false });
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError('An error occurred during logout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Amazon Q Desktop
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered development assistant
            </p>
          </div>

          {!authStatus?.isAuthenticated ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Login
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  To use Amazon Q Developer, you need to log in with your AWS account.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  'Login with AWS Account'
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  By logging in, you agree to our
                  <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Terms of Service
                  </a>
                  and
                  <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Logged In
                </h2>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="text-green-800 dark:text-green-200">
                    Logged in as {authStatus.user?.name || 'User'}
                  </p>
                  {authStatus.user?.email && (
                    <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                      {authStatus.user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(ROUTES.CHAT)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Start Chat
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Amazon Q Desktop v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}