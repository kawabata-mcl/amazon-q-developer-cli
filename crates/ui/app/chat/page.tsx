'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';

function ChatPageContent() {
  const handleNewChat = () => {
    console.log('New chat clicked');
  };

  const handleSettingsClick = () => {
    window.location.href = '/settings';
  };

  return (
    <MainLayout
      title="Amazon Q Developer"
      connectionStatus="connected"
      lastActivity={new Date()}
      onNewChat={handleNewChat}
      onSettingsClick={handleSettingsClick}
    >
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
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Code Generation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Auto-generate functions and class implementations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Code Review
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code improvement suggestions and best practices
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Debug Assistance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Error identification and fix suggestions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Technical Questions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Answer programming-related questions
                  </p>
                </CardContent>
              </Card>
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
            <Button disabled>
              Send
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            You can drag and drop files to add them as context
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  );
}