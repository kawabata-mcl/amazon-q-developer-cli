'use client';

import { useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Card, CardContent } from '@/components/ui/card';

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className = '' }: ChatWindowProps) {
  const {
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    error,
    hasMessages,
    canRetry,
    sendMessage,
    retryMessage,
    startNewConversation,
    clearError,
    getErrorMessage,
  } = useChat();

  // Initialize with a new conversation if none exists
  useEffect(() => {
    if (!currentConversation) {
      startNewConversation().catch(console.error);
    }
  }, [currentConversation, startNewConversation]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    try {
      await retryMessage(messageId);
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      await startNewConversation();
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="chat-window">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">
                {getErrorMessage(error)}
              </div>
              {error.details && (
                <div className="text-red-500 dark:text-red-400 text-xs">
                  {error.details}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {canRetry && (
                <button
                  onClick={() => {
                    // For global errors, we might want to retry the last failed message
                    // This would need to be implemented based on specific requirements
                    console.log('Global retry not implemented yet');
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
                >
                  Retry
                </button>
              )}
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <MessageList 
            messages={messages}
            isLoading={isStreaming}
            onRetryMessage={handleRetryMessage}
          />
        ) : (
          <WelcomeScreen onNewChat={handleNewChat} />
        )}
      </div>

      {/* Message Input Area */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading || isStreaming}
          isLoading={isLoading || isStreaming}
          placeholder="Enter your questions or tasks for Amazon Q Developer..."
        />
      </div>
    </div>
  );
}

function WelcomeScreen({ onNewChat }: { onNewChat: () => void }) {
  return (
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
  );
}