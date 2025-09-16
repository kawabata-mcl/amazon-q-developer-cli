'use client';

import { useState } from 'react';
import { Copy, Check, User, Bot, AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';

interface MessageItemProps {
  message: ChatMessage;
  isLatest?: boolean;
  className?: string;
  onRetry?: (messageId: string) => Promise<void>;
}

export function MessageItem({ message, className = '', onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    try {
      setIsRetrying(true);
      await onRetry(message.id);
    } catch (error) {
      console.error('Failed to retry message:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(timestamp);
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  // Status indicators
  const getStatusIcon = () => {
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
  };

  const getStatusText = () => {
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
  };

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
            {formatTimestamp(message.timestamp)}
          </span>
          {/* Status indicator */}
          {message.status && (
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getStatusText()}
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
            {/* Message content with basic markdown-like formatting */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MessageContent content={message.content} />
            </div>

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
}

// Component to render message content with basic formatting
function MessageContent({ content }: { content: string }) {
  // Basic code block detection and formatting
  const renderContent = () => {
    // Split content by code blocks (```...```)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const codeContent = part.slice(3, -3);
        const lines = codeContent.split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="my-4">
            {language && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">
                {language}
              </div>
            )}
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else {
        // Regular text with inline code formatting
        const textParts = part.split(/(`[^`]+`)/g);
        return (
          <div key={index}>
            {textParts.map((textPart, textIndex) => {
              if (textPart.startsWith('`') && textPart.endsWith('`')) {
                // Inline code
                return (
                  <code 
                    key={textIndex}
                    className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono"
                  >
                    {textPart.slice(1, -1)}
                  </code>
                );
              } else {
                // Regular text - preserve line breaks
                return (
                  <span key={textIndex}>
                    {textPart.split('\n').map((line, lineIndex, lines) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < lines.length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                );
              }
            })}
          </div>
        );
      }
    });
  };

  return <div>{renderContent()}</div>;
}