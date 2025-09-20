'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAuthenticating } = useAuth();

  useEffect(() => {
    // Wait for auth check to complete
    if (isAuthenticating) return;
    
    // Redirect based on authentication status
    if (isAuthenticated) {
      router.push(ROUTES.CHAT);
    } else {
      router.push('/auth');
    }
  }, [router, isAuthenticated, isAuthenticating]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Amazon Q Desktop
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Loading...
        </p>
      </div>
    </div>
  );
}
