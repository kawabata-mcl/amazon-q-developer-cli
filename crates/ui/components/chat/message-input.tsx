'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  isSending?: boolean;
  sendError?: string | null;
  onClearError?: () => void;
  onCancelSend?: () => void;
  placeholder?: string;
  className?: string;
}

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false,
  isLoading = false,
  isSending = false,
  sendError = null,
  onClearError,
  onCancelSend,
  placeholder = "Type your message...",
  className = '' 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim() || disabled || isLoading || isSending) return;

    const messageToSend = message.trim();
    const filesToSend = [...attachedFiles];

    try {
      // Clear any previous errors
      if (onClearError) {
        onClearError();
      }

      // Clear input immediately for better UX
      setMessage('');
      setAttachedFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Prepare full message with attachments
      let fullMessage = messageToSend;
      
      if (filesToSend.length > 0) {
        fullMessage += '\n\nAttached files:\n';
        filesToSend.forEach(file => {
          fullMessage += `- ${file.name} (${formatFileSize(file.size)})\n`;
          fullMessage += `\`\`\`\n${file.content}\n\`\`\`\n`;
        });
      }

      await onSendMessage(fullMessage);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Restore message and files on error
      setMessage(messageToSend);
      setAttachedFiles(filesToSend);
    }
  };

  const handleRetry = () => {
    if (message.trim()) {
      handleSend();
    }
  };

  const handleCancel = () => {
    if (onCancelSend) {
      onCancelSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const newAttachedFiles: AttachedFile[] = [];

    for (const file of files) {
      try {
        // Only process text files for now
        if (file.type.startsWith('text/') || 
            file.name.endsWith('.md') || 
            file.name.endsWith('.json') ||
            file.name.endsWith('.js') ||
            file.name.endsWith('.ts') ||
            file.name.endsWith('.tsx') ||
            file.name.endsWith('.jsx')) {
          
          const content = await readFileAsText(file);
          newAttachedFiles.push({
            name: file.name,
            content,
            size: file.size,
          });
        }
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }

    setAttachedFiles(prev => [...prev, ...newAttachedFiles]);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isInputDisabled = disabled || isLoading || isSending;
  const showSendingState = isSending;
  const showErrorState = sendError && !isSending;

  return (
    <div className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {showErrorState && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{sendError}</p>
                <div className="mt-2 flex space-x-2">
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                  <Button
                    onClick={onClearError}
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2"
              >
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="text-gray-500 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div 
          className={`
            flex items-end space-x-4 border-2 border-dashed rounded-lg p-3 transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-transparent'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                showSendingState 
                  ? "Sending message..." 
                  : isLoading 
                    ? "Loading..." 
                    : placeholder
              }
              disabled={isInputDisabled}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[48px] max-h-[200px] disabled:opacity-50"
              rows={1}
              data-testid="message-input"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* File attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isInputDisabled}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Send/Cancel button */}
            {showSendingState ? (
              <div className="flex space-x-1">
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  disabled
                  size="sm"
                  data-testid="sending-button"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSend}
                disabled={isInputDisabled || !message.trim()}
                size="sm"
                data-testid="send-button"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.rs,.go,.java,.cpp,.c,.h,.hpp,.css,.html,.xml,.yaml,.yml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Help text */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          You can drag and drop files to add them as context. Press Enter for new line, Shift+Enter to send.
        </div>
      </div>
    </div>
  );
}