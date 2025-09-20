'use client';

import { useState, memo, useMemo } from 'react';
import { Copy, Check, User, Bot, AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { MessageContent } from './message-content';
import { useStableCallback } from '@/lib/optimization-utils';

interface MessageItemProps {
  message: ChatMessage;
  isLatest?: boolean;
  className?: string;
  onRetry?: (messageId: string) => Promise<void>;
}

const MessageItemComponent = memo(function MessageItem({ 
  message, 
  className = '', 
  onRetry 
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Stable callback handlers
  const handleCopy = useStableCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, [message.content]);

  const handleRetry = useStableCallback(async () => {
    if (!onRetry || isRetrying) return;
    
    try {
      setIsRetrying(true);
      await onRetry(message.id);
    } catch (error) {
      console.error('Failed to retry message:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, message.id, isRetrying]);

  // Memoized timestamp formatting
  const formattedTimestamp = useMemo(() => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(message.timestamp);
  }, [message.timestamp]);

  // Memoized role checks
  const isUser = useMemo(() => message.role === 'user', [message.role]);
  const isAssistant = useMemo(() => message.role === 'assistant', [message.role]);
  
  // Memoized status indicators
  const statusIcon = useMemo(() => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'streaming':
        return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  }, [message.status]);

  const statusText = useMemo(() => {
    switch (message.status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'streaming':
        return 'Receiving...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return message.error || 'Failed';
      default:
        return '';
    }
  }, [message.status, message.error]);

  return (
    <div className={`flex items-start space-x-4 group ${className}`} data-testid="message-item">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : isAssistant ? (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">S</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isUser ? 'You' : isAssistant ? 'Amazon Q' : 'System'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formattedTimestamp}
          </span>
          {/* Status indicator */}
          {message.status && (
            <div className="flex items-center space-x-1">
              {statusIcon}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statusText}
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          {/* Message bubble */}
          <div className={`
            rounded-lg p-4 
            ${isUser 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
              : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }
          `}>
            {/* Message content with syntax highlighting */}
            <MessageContent content={message.content} />

            {/* Tool uses display */}
            {message.toolUses && message.toolUses.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Tools used:
                </div>
                <div className="space-y-1">
                  {message.toolUses.map((tool) => (
                    <div key={tool.id} className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                      <span className="font-medium">{tool.name}</span>
                      <span className={`ml-2 ${
                        tool.status === 'success' ? 'text-green-600 dark:text-green-400' :
                        tool.status === 'error' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata display */}
            {message.metadata && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {message.metadata.model && (
                    <span>Model: {message.metadata.model}</span>
                  )}
                  {message.metadata.processingTime && (
                    <span>Time: {message.metadata.processingTime}ms</span>
                  )}
                  {message.metadata.tokenCount && (
                    <span>Tokens: {message.metadata.tokenCount}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            {/* Retry button for failed user messages */}
            {message.status === 'failed' && isUser && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="h-6 px-2"
                title="Retry message"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Error message display */}
          {message.status === 'failed' && message.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{message.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  
  return (
    prevMsg.id === nextMsg.id &&
    prevMsg.content === nextMsg.content &&
    prevMsg.status === nextMsg.status &&
    prevMsg.error === nextMsg.error &&
    prevMsg.timestamp.getTime() === nextMsg.timestamp.getTime() &&
    prevProps.className === nextProps.className &&
    prevProps.onRetry === nextProps.onRetry &&
    prevProps.isLatest === nextProps.isLatest
  );
});

MessageItemComponent.displayName = 'MessageItem';

export const MessageItem = MessageItemComponent;

