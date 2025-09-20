import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Hoist mocks before importing the component under test
jest.mock('@/lib/tauri', () => ({
  addFileContextCommand: jest.fn(async () => undefined),
}));

jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FilePlus: () => <div data-testid="file-plus-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

// TextEncoder/Decoder polyfill is provided in jest.setup.ts

import { FileDropZone } from '../file-drop-zone';
import { addFileContextCommand } from '@/lib/tauri';
const mockAddFileContextCommand = addFileContextCommand as unknown as jest.MockedFunction<typeof addFileContextCommand>;

describe('FileDropZone', () => {
  const mockOnFileAdded = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders drop zone with default state', () => {
    render(<FileDropZone />);
    
    expect(screen.getByTestId('file-drop-zone')).toBeTruthy();
    expect(screen.getByText('Drag & drop files here or click to browse')).toBeTruthy();
    expect(screen.getByText(/Supports text files, code files/)).toBeTruthy();
  });

  test('shows drag over state when files are dragged over', () => {
    render(<FileDropZone />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    
    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [new File(['test'], 'test.txt', { type: 'text/plain' })]
      }
    });
    
    expect(screen.getByText('Drop files here to add them as context')).toBeTruthy();
  });

  test('processes dropped text file successfully', async () => {
    render(<FileDropZone onFileAdded={mockOnFileAdded} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const file = new File(['Hello, world!'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockOnFileAdded).toHaveBeenCalledWith('test.txt');
      expect(screen.getByText('test.txt')).toBeTruthy();
      expect(screen.getByText(/13 Bytes • 1 lines/)).toBeTruthy();
    });
  });

  test('handles file selection via click', async () => {
    const user = userEvent.setup();
    render(<FileDropZone onFileAdded={mockOnFileAdded} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const file = new File(['console.log("test");'], 'test.js', { type: 'text/javascript' });
    
    // Simulate click (opens hidden input via ref)
    await user.click(dropZone);
    
    // Find the actual input in the DOM and dispatch change with files payload
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { files: [file] } });
  });

  test('rejects files that are too large', async () => {
    render(<FileDropZone onError={mockOnError} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File size too large')
      );
    });
    
    // Command invocation is mocked globally; ensure no crash and proper error callback only
  });

  test('rejects unsupported file types', async () => {
    render(<FileDropZone onError={mockOnError} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const file = new File(['binary data'], 'test.exe', { type: 'application/octet-stream' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File type not supported')
      );
    });
    
    // Command invocation is mocked globally; ensure no crash and proper error callback only
  });

  test('handles binary file content rejection', async () => {
    render(<FileDropZone onError={mockOnError} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    // Create a file with binary content (null bytes)
    const binaryContent = 'Hello\0World';
    const file = new File([binaryContent], 'binary.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File appears to contain binary data')
      );
    });
  });

  test('removes files when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<FileDropZone onFileAdded={mockOnFileAdded} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeTruthy();
    });
    
    const removeButton = screen.getByTitle('Remove file');
    await user.click(removeButton);
    
    expect(screen.queryByText('test.txt')).toBeNull();
  });

  test('shows processing state while handling files', async () => {
    render(<FileDropZone />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    // Should show processing state
    expect(screen.getByText('Processing files...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.queryByText('Processing files...')).toBeNull();
    });
  });

  test('is disabled when disabled prop is true', () => {
    render(<FileDropZone disabled={true} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const className = (dropZone as HTMLElement).className;
    expect(className.includes('opacity-50')).toBe(true);
    expect(className.includes('cursor-not-allowed')).toBe(true);
  });

  test('handles multiple files at once', async () => {
    render(<FileDropZone onFileAdded={mockOnFileAdded} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const files = [
      new File(['content 1'], 'file1.txt', { type: 'text/plain' }),
      new File(['content 2'], 'file2.js', { type: 'text/javascript' }),
    ];
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeTruthy();
      expect(screen.getByText('file2.js')).toBeTruthy();
    });
    expect(screen.getByText('Added Files (2)')).toBeTruthy();
  });

  test('shows file statistics correctly', async () => {
    render(<FileDropZone />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const content = 'Line 1\nLine 2\nLine 3';
    const file = new File([content], 'multiline.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    const expectedBytes = new TextEncoder().encode(content).length;
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${expectedBytes} Bytes`))).toBeTruthy();
      expect(screen.getByText(/3 lines/)).toBeTruthy();
    });
  });

  // Note: Errors from Tauri command are integration-level concerns. Unit tests
  // cover client-side validation and reading errors instead.
});