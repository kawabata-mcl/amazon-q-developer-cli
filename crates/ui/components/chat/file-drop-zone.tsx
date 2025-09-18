'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FilePlus, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFileContextStore } from '@/stores/file-context-store';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileAdded?: (fileName: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface DroppedFile {
  name: string;
  content: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [
  'txt', 'md', 'markdown', 'rst', 'adoc',
  'rs', 'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte',
  'py', 'rb', 'go', 'java', 'kt', 'scala', 'clj', 'hs',
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',
  'cs', 'fs', 'vb', 'php', 'swift', 'dart', 'r',
  'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
  'xml', 'html', 'htm', 'css', 'scss', 'sass', 'less',
  'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'log', 'csv', 'tsv', 'properties', 'env'
];

export function FileDropZone({ 
  onFileAdded, 
  onError, 
  className,
  disabled = false 
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<DroppedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFileToContext } = useFileContextStore();

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large: ${formatFileSize(file.size)} (max: ${formatFileSize(MAX_FILE_SIZE)})`;
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type not supported: .${extension}. Allowed types: ${ALLOWED_EXTENSIONS.slice(0, 10).join(', ')}...`;
    }

    return null;
  }, []);

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        
        // Check for binary content
        if (result.includes('\0') || /[\x00-\x08\x0E-\x1F\x7F]/.test(result)) {
          reject(new Error('File appears to contain binary data'));
          return;
        }
        
        resolve(result);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);
    const newProcessedFiles: DroppedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        // Read file content
        const content = await readFileAsText(file);
        
        // Add to context via store
        await addFileToContext(file.name, content);
        
        const processedFile: DroppedFile = {
          name: file.name,
          content,
          size: file.size,
          type: file.type || 'text/plain',
        };
        
        newProcessedFiles.push(processedFile);
        onFileAdded?.(file.name);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    // Update processed files
    setProcessedFiles(prev => [...prev, ...newProcessedFiles]);

    // Report errors
    if (errors.length > 0) {
      onError?.(errors.join('\n'));
    }

    setIsProcessing(false);
  }, [disabled, isProcessing, validateFile, readFileAsText, onFileAdded, onError, addFileToContext]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled || isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [disabled, isProcessing, processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const removeFile = useCallback((index: number) => {
    setProcessedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer",
          {
            "border-blue-500 bg-blue-50 dark:bg-blue-950 border-2": isDragOver,
            "border-dashed border-2 hover:border-gray-400 dark:hover:border-gray-500": !isDragOver,
            "opacity-50 cursor-not-allowed": disabled || isProcessing,
          }
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
        data-testid="file-drop-zone"
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {isProcessing ? (
            <>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Processing files...
              </p>
            </>
          ) : isDragOver ? (
            <>
              <FilePlus className="w-12 h-12 text-blue-500 mb-4" />
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Drop files here to add them as context
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                Drag & drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports text files, code files, and documents up to {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Processed Files List */}
      {processedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Added Files ({processedFiles.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {processedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {file.content.split('\n').length} lines
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500 p-1 h-auto"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          <strong>Supported file types:</strong> {ALLOWED_EXTENSIONS.slice(0, 15).join(', ')}
          {ALLOWED_EXTENSIONS.length > 15 && ` and ${ALLOWED_EXTENSIONS.length - 15} more`}
        </p>
        <p>
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Files are added as context for your conversation and will be available to the AI assistant.
        </p>
      </div>
    </div>
  );
}