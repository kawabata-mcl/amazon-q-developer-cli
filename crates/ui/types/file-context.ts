export interface FileContextItem {
  path: string;
  content: string;
  name: string;
  size: number;
  mimeType: string;
  addedAt: Date;
  isModified: boolean;
}

export interface FileContextError {
  type: 'load_failed' | 'add_failed' | 'remove_failed' | 'update_failed' | 'clear_failed' | 'validation_error';
  message: string;
  retryable: boolean;
  details?: string;
}

export interface FileEditState {
  isEditing: boolean;
  originalContent: string;
  hasUnsavedChanges: boolean;
}

export interface FileViewerProps {
  file: FileContextItem;
  onEdit?: (content: string) => void;
  onRemove?: () => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export interface FileContextManagerProps {
  className?: string;
  maxHeight?: string;
  showAddButton?: boolean;
  allowEditing?: boolean;
}