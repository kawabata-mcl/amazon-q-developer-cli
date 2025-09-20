'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthPanel } from '@/components/auth/auth-panel';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect to chat if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Amazon Q Developer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to start chatting with Amazon Q
          </p>
        </div>

        {/* Authentication Panel */}
        <AuthPanel />

      </div>
    </div>
  );
}