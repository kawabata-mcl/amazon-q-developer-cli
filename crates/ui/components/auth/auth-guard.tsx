'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle, RefreshCw } from 'lucide-react';

type AuthGuardRenderProps = {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  hasError: boolean;
  user: { username: string; provider: 'AWS' | string } | null;
};

interface AuthGuardProps {
  children: ReactNode | ((props: AuthGuardRenderProps) => ReactNode);
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  fallback,
  loadingComponent,
  redirectTo = '/auth' 
}: AuthGuardProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isAuthenticating, 
    hasError, 
    errorMessage,
    error,
    login,
    clearError,
    user,
    status,
  } = useAuth();

  const { initializeAuth, refreshToken } = useAuthStore();

  // Initialize authentication state on component mount
  useEffect(() => {
    console.log('AuthGuard: Initializing authentication...');
    initializeAuth().catch((error) => {
      console.error('AuthGuard: Failed to initialize auth:', error);
    });
  }, [initializeAuth]);

  // Redirect to auth page if not authenticated and not loading
  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // Don't redirect during initial loading or if there's an error
    if (!isAuthenticating && !isAuthenticated && !hasError && status?.type === 'NotAuthenticated') {
      console.log('AuthGuard: Redirecting to auth page - user not authenticated');
      router.push(redirectTo);
    }
  }, [isAuthenticated, isAuthenticating, hasError, status?.type, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center">
          {loadingComponent ?? (
            <>
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Checking authentication...
              </p>
            </>
          )}
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (hasError) {
    const message = (errorMessage as string | undefined) ?? (typeof error === 'string' ? error : 'Authentication failed');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => {
                clearError();
                login();
              }}
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Try Login Again</span>
            </Button>
            <Button
              onClick={async () => {
                clearError();
                try {
                  await refreshToken();
                  console.info('Token refreshed successfully');
                } catch (error) {
                  const msg = error instanceof Error ? error.message : 'Token refresh failed';
                  console.error(msg);
                }
              }}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Token</span>
            </Button>
            <Button
              onClick={() => router.push(redirectTo)}
              variant="ghost"
              className="w-full"
            >
              Go to Login Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show custom fallback if provided and not authenticated
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Show children if authenticated
  if (isAuthenticated) {
    const renderProps: AuthGuardRenderProps = {
      isAuthenticated,
      isAuthenticating,
      hasError,
      user,
    };
    if (typeof children === 'function') {
      const rendered = (children as (p: AuthGuardRenderProps) => ReactNode)(renderProps);
      return <>{rendered}</>;
    }
    return <>{children}</>;
  }

  // Default fallback for unauthenticated
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-400">Please sign in to continue</p>
      </Card>
    </div>
  );
}