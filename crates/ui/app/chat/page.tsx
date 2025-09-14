'use client';

import { useState, useEffect } from 'react';
import { getAuthStatusCommand } from '@/lib/tauri';
import type { AuthStatus } from '@/types/auth';

export default function ChatPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await getAuthStatusCommand();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ isAuthenticated: false, error: 'Failed to check authentication status' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Amazon Q Desktop
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to log in to use Amazon Q Developer.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversation History
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No conversation history yet
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Amazon Q Developer
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {authStatus.user?.name || 'User'}
              </span>
              <button
                onClick={() => window.location.href = '/settings'}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to Amazon Q Developer
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                I can help with code generation, answering questions, development assistance, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Code Generation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Auto-generate functions and class implementations
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Code Review
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code improvement suggestions and best practices
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Debug Assistance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Error identification and fix suggestions
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Technical Questions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Answer programming-related questions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  placeholder="Enter your questions or tasks for Amazon Q Developer..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                disabled
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              You can drag and drop files to add them as context
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}