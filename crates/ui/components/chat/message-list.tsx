'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './message-item';
import { Spinner } from '@/components/ui/spinner';
import type { ChatMessage } from '@/types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  onRetryMessage?: (messageId: string) => Promise<void>;
}

export function MessageList({ messages, isLoading = false, className = '', onRetryMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);

  // Handle scroll behavior for loading states
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [isLoading]);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 ${className}`}
      data-testid="message-list"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
                onRetry={onRetryMessage}
              />
            ))}
            
            {/* Loading indicator for streaming responses */}
            {isLoading && (
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Q</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Amazon Q is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}