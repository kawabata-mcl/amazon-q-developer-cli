'use client';

import { useState } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  FileText,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FileViewerProps } from '@/types/file-context';

export function FileViewer({ 
  file, 
  onEdit, 
  onRemove, 
  onClose,
  readOnly = false 
}: FileViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLanguageFromMimeType = (mimeType: string): string => {
    if (mimeType.includes('javascript')) return 'javascript';
    if (mimeType.includes('typescript')) return 'typescript';
    if (mimeType.includes('rust')) return 'rust';
    if (mimeType.includes('python')) return 'python';
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('html')) return 'html';
    if (mimeType.includes('css')) return 'css';
    if (mimeType.includes('markdown')) return 'markdown';
    if (mimeType.includes('yaml')) return 'yaml';
    if (mimeType.includes('xml')) return 'xml';
    return 'text';
  };

  const renderContent = () => {
    const language = getLanguageFromMimeType(file.mimeType);
    const lines = file.content.split('\n');
    
    return (
      <div className="relative">
        {/* Content display */}
        <pre className={cn(
          "text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto",
          "border border-gray-200 dark:border-gray-700",
          "max-h-96 whitespace-pre-wrap break-words"
        )}>
          <code className={`language-${language}`}>
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span className="text-gray-400 dark:text-gray-600 text-xs mr-4 select-none min-w-[2rem] text-right">
                  {index + 1}
                </span>
                <span className="flex-1">{line}</span>
              </div>
            ))}
          </code>
        </pre>
        
        {/* Copy button overlay */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyContent}
          className="absolute top-2 right-2 bg-white dark:bg-gray-800 shadow-sm border"
          title="Copy content"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-semibold">
                {file.name}
              </CardTitle>
              {file.isModified && (
                <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                  Modified
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!readOnly && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(file.content)}
                title="Edit file"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove()}
                className="text-red-500 hover:text-red-600"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* File metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{file.content.split('\n').length} lines</span>
          <span>•</span>
          <span>{file.mimeType}</span>
          <span>•</span>
          <span>Added {file.addedAt.toLocaleString()}</span>
        </div>
      </CardHeader>

      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}