'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Edit3, 
  Save, 
  Trash2, 
  Plus, 
  FolderOpen,
  AlertCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileContextStore } from '@/stores/file-context-store';
import { FileViewer } from './file-viewer';
import { FileEditor } from './file-editor';
import { cn } from '@/lib/utils';
import type { FileContextItem, FileContextManagerProps } from '@/types/file-context';

export function FileContextManager({ 
  className,
  maxHeight = '400px',
  showAddButton = true,
  allowEditing = true,
  disableInitialLoad = false,
}: FileContextManagerProps & { disableInitialLoad?: boolean }) {
  const {
    contextFiles,
    isLoading,
    error,
    loadContextFiles,
    removeFileFromContext,
    clearAllContext,
    clearError,
    getTotalFilesSize,
    getFileCount,
  } = useFileContextStore()

  // Ensure contextFiles is always an array to prevent runtime errors
  const safeContextFiles = Array.isArray(contextFiles) ? contextFiles : []

  const [selectedFile, setSelectedFile] = useState<FileContextItem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'viewer' | 'editor'>('list')
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Load context files on mount
  useEffect(() => {
    if (!disableInitialLoad && loadContextFiles) {
      loadContextFiles();
    }
  }, [loadContextFiles, disableInitialLoad]);

  const handleFileSelect = (file: FileContextItem, mode: 'viewer' | 'editor' = 'viewer') => {
    setSelectedFile(file);
    setViewMode(mode);
  };

  const handleFileRemove = async (filePath: string) => {
    if (!removeFileFromContext) return;
    
    try {
      await removeFileFromContext(filePath);
      
      // Close viewer/editor if the removed file was selected
      if (selectedFile?.path === filePath) {
        setSelectedFile(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  };

  const handleClearAll = async () => {
    if (!clearAllContext) return;
    
    if (window.confirm('Are you sure you want to remove all files from context?')) {
      try {
        await clearAllContext();
        setSelectedFile(null);
        setViewMode('list');
      } catch (error) {
        console.error('Failed to clear context:', error);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedFile(null);
    setViewMode('list');
  };

  const toggleFileExpansion = (filePath: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) {
      return '🟨';
    } else if (mimeType.includes('python')) {
      return '🐍';
    } else if (mimeType.includes('rust')) {
      return '🦀';
    } else if (mimeType.includes('json')) {
      return '📋';
    } else if (mimeType.includes('markdown')) {
      return '📝';
    } else if (mimeType.includes('html')) {
      return '🌐';
    } else if (mimeType.includes('css')) {
      return '🎨';
    }
    return '📄';
  };

  const downloadFile = (file: FileContextItem) => {
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

  // Render file viewer or editor
  if (viewMode === 'viewer' && selectedFile) {
    return (
      <div className={cn("space-y-4", className)}>
        <FileViewer
          file={selectedFile}
          onEdit={allowEditing ? () => setViewMode('editor') : undefined}
          onRemove={() => handleFileRemove(selectedFile.path)}
          onClose={handleBackToList}
          readOnly={!allowEditing}
        />
      </div>
    );
  }

  if (viewMode === 'editor' && selectedFile) {
    return (
      <div className={cn("space-y-4", className)}>
        <FileEditor
          file={selectedFile}
          onSave={() => {
            setViewMode('viewer');
            if (loadContextFiles) {
              loadContextFiles(); // Refresh the list
            }
          }}
          onCancel={() => setViewMode('viewer')}
          onClose={handleBackToList}
        />
      </div>
    );
  }

  // Render file list
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Context Files ({getFileCount()})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadContextFiles}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
            {safeContextFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
                title="Clear all files"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {safeContextFiles.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total size: {formatFileSize(getTotalFilesSize())}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {error.details}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                disabled={!clearError}
                className="text-red-500 hover:text-red-600 p-1 h-auto"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && safeContextFiles.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Loading context files...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && safeContextFiles.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No files in context
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Drag and drop files or use the file picker to add context
            </p>
          </div>
        )}

        {/* File list */}
        {safeContextFiles.length > 0 && (
          <div
            className="space-y-2 overflow-y-auto"
            style={{ maxHeight }}
          >
            {safeContextFiles.map((file) => {
              const isExpanded = expandedFiles.has(file.path)
              const previewLines = file.content.split('\n').slice(0, 3)

              return (
                <div
                  key={file.path}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* File header */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleFileExpansion(file.path)}
                    >
                      <span className="text-lg flex-shrink-0">
                        {getFileIcon(file.mimeType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.content.split('\n').length} lines</span>
                          {file.isModified && (
                            <>
                              <span>•</span>
                              <span className="text-orange-500">Modified</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileSelect(file, 'viewer')}
                        className="p-1 h-auto"
                        title="View file"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {allowEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileSelect(file, 'editor')}
                          className="p-1 h-auto"
                          title="Edit file"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(file)}
                        className="p-1 h-auto"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemove(file.path)}
                        className="p-1 h-auto text-red-500 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File preview */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {previewLines.join('\n')}
                        {file.content.split('\n').length > 3 && '\n...'}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}