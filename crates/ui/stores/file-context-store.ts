import { safeInvoke } from '@/lib/tauri-env';
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { FileContextItem, FileContextError } from '@/types/file-context';

interface FileContextState {
  // File context state
  contextFiles: FileContextItem[];
  isLoading: boolean;
  error: FileContextError | null;
  
  // Actions
  loadContextFiles: () => Promise<void>;
  addFileToContext: (fileName: string, content: string) => Promise<void>;
  addFileByPath: (filePath: string) => Promise<void>;
  removeFileFromContext: (filePath: string) => Promise<void>;
  updateFileContent: (filePath: string, content: string) => Promise<void>;
  clearAllContext: () => Promise<void>;
  
  // UI helpers
  clearError: () => void;
  getFileByPath: (filePath: string) => FileContextItem | undefined;
  getTotalFilesSize: () => number;
  getFileCount: () => number;
}

export const useFileContextStore = create<FileContextState>((set, get) => ({
  // Initial state
  contextFiles: [],
  isLoading: false,
  error: null,

  // Load all context files from backend
  loadContextFiles: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const files = await invoke<Array<[string, string]>>('get_context_files');
      
      const contextFiles: FileContextItem[] = files.map(([path, content]) => ({
        path,
        content,
        name: path.split('/').pop() || path,
        size: new Blob([content]).size,
        mimeType: guessContentType(path),
        addedAt: new Date(),
        isModified: false,
      }));
      
      set({ 
        contextFiles,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load context files:', error);
      set({
        error: {
          type: 'load_failed',
          message: error instanceof Error ? error.message : 'Failed to load context files',
          retryable: true,
        },
        isLoading: false,
      });
    }
  },

  // Add file to context with content
  addFileToContext: async (fileName: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await safeInvoke('add_file_context', {
        file_name: fileName,
        content,
      });
      
      // Add to local state
      const newFile: FileContextItem = {
        path: fileName,
        content,
        name: fileName,
        size: new Blob([content]).size,
        mimeType: guessContentType(fileName),
        addedAt: new Date(),
        isModified: false,
      };
      
      set((state) => ({
        contextFiles: [...(state.contextFiles || []).filter(f => f.path !== fileName), newFile],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to add file to context:', error);
      set({
        error: {
          type: 'add_failed',
          message: error instanceof Error ? error.message : 'Failed to add file to context',
          retryable: true,
        },
        isLoading: false,
      });
      throw error;
    }
  },

  // Add file to context by file path
  addFileByPath: async (filePath: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await safeInvoke('add_file_to_context_by_path', {
        file_path: filePath,
      });
      
      // Reload context files to get the updated list
      await get().loadContextFiles();
    } catch (error) {
      console.error('Failed to add file by path:', error);
      set({
        error: {
          type: 'add_failed',
          message: error instanceof Error ? error.message : 'Failed to add file to context',
          retryable: true,
        },
        isLoading: false,
      });
      throw error;
    }
  },

  // Remove file from context
  removeFileFromContext: async (filePath: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await safeInvoke('remove_file_from_context', {
        file_path: filePath,
      });
      
      // Remove from local state
      set((state) => ({
        contextFiles: (state.contextFiles || []).filter(f => f.path !== filePath),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to remove file from context:', error);
      set({
        error: {
          type: 'remove_failed',
          message: error instanceof Error ? error.message : 'Failed to remove file from context',
          retryable: true,
        },
        isLoading: false,
      });
      throw error;
    }
  },

  // Update file content in context
  updateFileContent: async (filePath: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Remove old version and add updated version
      await safeInvoke('remove_file_from_context', {
        file_path: filePath,
      });
      
      const fileName = filePath.split('/').pop() || filePath;
      await safeInvoke('add_file_context', {
        file_name: fileName,
        content,
      });
      
      // Update local state
      set((state) => ({
        contextFiles: (state.contextFiles || []).map(f => 
          f.path === filePath 
            ? {
                ...f,
                content,
                size: new Blob([content]).size,
                isModified: true,
              }
            : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update file content:', error);
      set({
        error: {
          type: 'update_failed',
          message: error instanceof Error ? error.message : 'Failed to update file content',
          retryable: true,
        },
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear all context files
  clearAllContext: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await safeInvoke('clear_context');
      
      set({
        contextFiles: [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to clear context:', error);
      set({
        error: {
          type: 'clear_failed',
          message: error instanceof Error ? error.message : 'Failed to clear context',
          retryable: true,
        },
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Get file by path
  getFileByPath: (filePath: string) => {
    const state = get();
    return (state.contextFiles || []).find(f => f.path === filePath);
  },

  // Get total size of all files
  getTotalFilesSize: () => {
    const state = get();
    return (state.contextFiles || []).reduce((total, file) => total + file.size, 0);
  },

  // Get file count
  getFileCount: () => {
    const state = get();
    return (state.contextFiles || []).length;
  },
}));

// Helper function to guess content type from file extension
function guessContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'txt':
      return 'text/plain';
    case 'md':
    case 'markdown':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    case 'js':
    case 'jsx':
      return 'text/javascript';
    case 'ts':
    case 'tsx':
      return 'text/typescript';
    case 'rs':
      return 'text/x-rust';
    case 'py':
      return 'text/x-python';
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'xml':
      return 'application/xml';
    case 'yaml':
    case 'yml':
      return 'application/yaml';
    case 'toml':
      return 'application/toml';
    default:
      return 'text/plain';
  }
}