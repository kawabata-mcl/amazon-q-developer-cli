'use client';

import { useEffect, useState, memo, useMemo } from 'react';
import { useChat } from '@/hooks/use-chat';
import { VirtualMessageList } from './virtual-message-list';
import { MessageInput } from './message-input';
import { FileContextManager } from './file-context-manager';
import { FileDropZone } from './file-drop-zone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, X } from 'lucide-react';
import { useStableCallback, useDebouncedCallback } from '@/lib/optimization-utils';

interface ChatWindowProps {
  className?: string;
}

const ChatWindowComponent = memo(function ChatWindow({ className = '' }: ChatWindowProps) {
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

  const [showFileManager, setShowFileManager] = useState(false);
  const [fileDropError, setFileDropError] = useState<string | null>(null);

  // Initialize with a new conversation if none exists
  useEffect(() => {
    let mounted = true;
    
    const initializeConversation = async () => {
      if (mounted && !currentConversation && !isLoading && !isStreaming && !hasMessages) {
        try {
          await startNewConversation();
        } catch (error) {
          console.error('Failed to initialize conversation:', error);
        }
      }
    };
    
    // Only initialize once when component mounts
    initializeConversation();
    
    return () => {
      mounted = false;
    };
  }, [currentConversation, isLoading, isStreaming, hasMessages, startNewConversation]); // Add missing dependencies

  // Optimized message sending with debouncing to prevent rapid submissions
  const handleSendMessage = useDebouncedCallback(async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, 100);

  // Stable callback handlers
  const handleRetryMessage = useStableCallback(async (messageId: string) => {
    try {
      await retryMessage(messageId);
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  }, [retryMessage]);

  // removed unused handleNewChat

  const handleFileAdded = useStableCallback((fileName: string) => {
    console.log('File added to context:', fileName);
    // Optionally show a success message or update UI
  }, []);

  const handleFileError = useStableCallback((error: string) => {
    setFileDropError(error);
    setTimeout(() => setFileDropError(null), 5000); // Clear error after 5 seconds
  }, []);

  // Memoized error message
  const errorMessage = useMemo(() => error ? getErrorMessage(error) : null, [error, getErrorMessage]);

  return (
    <div className={`flex h-full ${className}`} data-testid="chat-window">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">
                  {errorMessage}
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

        {/* File Drop Error Display */}
        {fileDropError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">
                  File Error
                </div>
                <div className="text-red-500 dark:text-red-400 text-xs whitespace-pre-line">
                  {fileDropError}
                </div>
              </div>
              <button
                onClick={() => setFileDropError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-hidden">
          {hasMessages ? (
            <VirtualMessageList 
              messages={messages}
              isLoading={false}
              onRetryMessage={handleRetryMessage}
              enableDynamicHeight={true}
              itemHeight={120}
            />
          ) : (
            <WelcomeScreen 
              onFileAdded={handleFileAdded}
              onFileError={handleFileError}
            />
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

      {/* File Context Sidebar */}
      {showFileManager && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              File Context
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileManager(false)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 h-full overflow-hidden">
            <FileContextManager 
              maxHeight="calc(100vh - 200px)"
              allowEditing={true}
            />
          </div>
        </div>
      )}

      {/* File Manager Toggle Button */}
      {!showFileManager && (
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFileManager(true)}
            className="bg-white dark:bg-gray-800 shadow-sm"
            title="Show file context manager"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.className === nextProps.className;
});

ChatWindowComponent.displayName = 'ChatWindow';

export const ChatWindow = ChatWindowComponent;

const WelcomeScreen = memo(function WelcomeScreen({ 
  onFileAdded, 
  onFileError 
}: { 
  onFileAdded: (fileName: string) => void;
  onFileError: (error: string) => void;
}) {
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
          
          {/* File Drop Zone */}
          <div className="mb-8 max-w-2xl mx-auto">
            <FileDropZone
              onFileAdded={onFileAdded}
              onError={onFileError}
              className="mb-4"
            />
          </div>
          
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
});