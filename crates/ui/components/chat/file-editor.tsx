'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileContextStore } from '@/stores/file-context-store';
import { cn } from '@/lib/utils';
import type { FileContextItem } from '@/types/file-context';

interface FileEditorProps {
  file: FileContextItem;
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function FileEditor({ file, onSave, onCancel, onClose }: FileEditorProps) {
  const { updateFileContent } = useFileContextStore();
  const [content, setContent] = useState(file.content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(content !== file.content);
  }, [content, file.content]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateFileContent(file.path, content);
      setHasUnsavedChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save file:', error);
      setError(error instanceof Error ? error.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setContent(file.content);
        setHasUnsavedChanges(false);
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save with Cmd/Ctrl + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lines = content.split('\n');
        const startLine = content.substring(0, start).split('\n').length - 1;
        const endLine = content.substring(0, end).split('\n').length - 1;
        
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].startsWith('  ')) {
            lines[i] = lines[i].substring(2);
          } else if (lines[i].startsWith('\t')) {
            lines[i] = lines[i].substring(1);
          }
        }
        
        const newContent = lines.join('\n');
        setContent(newContent);
      } else {
        // Tab: Add indentation
        const newContent = content.substring(0, start) + '  ' + content.substring(end);
        setContent(newContent);
        
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentSize = new Blob([content]).size;
  const lineCount = content.split('\n').length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-semibold">
                Edit: {file.name}
              </CardTitle>
              {hasUnsavedChanges && (
                <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              title="Cancel editing"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              title="Save changes (Cmd/Ctrl + S)"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        {/* File metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(currentSize)}</span>
          <span>•</span>
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{file.mimeType}</span>
          {currentSize !== file.size && (
            <>
              <span>•</span>
              <span className="text-orange-500">
                Size changed: {currentSize > file.size ? '+' : ''}{formatFileSize(currentSize - file.size)}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Failed to save file
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-600 p-1 h-auto"
                aria-label="Close"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full p-4 text-sm font-mono",
              "bg-gray-50 dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "resize-none overflow-hidden",
              "min-h-[300px]"
            )}
            placeholder="Enter file content..."
            spellCheck={false}
            disabled={isSaving}
          />
          
          {/* Line numbers overlay */}
          <div className="absolute left-2 top-4 text-xs text-gray-400 dark:text-gray-600 pointer-events-none select-none">
            {content.split('\n').map((_, index) => (
              <div key={index} className="h-5 leading-5">
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Editor help */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            <strong>Keyboard shortcuts:</strong> Cmd/Ctrl + S to save, Tab to indent, Shift + Tab to unindent
          </p>
          <p>
            Changes are automatically saved to the context when you click Save.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}