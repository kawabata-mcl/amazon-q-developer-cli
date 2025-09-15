'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth' 
}: AuthGuardProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isAuthenticating, 
    hasError, 
    errorMessage,
    login,
    clearError 
  } = useAuth();

  // Redirect to auth page if not authenticated and not loading
  useEffect(() => {
    if (!isAuthenticating && !isAuthenticated && !hasError) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isAuthenticating, hasError, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Checking authentication status...
          </p>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (hasError && errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorMessage}
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
              onClick={() => router.push(redirectTo)}
              variant="outline"
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
    return <>{children}</>;
  }

  // Default fallback - should not reach here due to redirect effect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to login...
        </p>
      </Card>
    </div>
  );
}