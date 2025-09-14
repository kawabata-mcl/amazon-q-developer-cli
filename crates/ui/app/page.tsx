'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page as the main interface
    router.push(ROUTES.CHAT);
  }, [router]);

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
