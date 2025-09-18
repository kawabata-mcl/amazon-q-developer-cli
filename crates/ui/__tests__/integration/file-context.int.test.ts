import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { useFileContextStore } from '@/stores/file-context-store';
import { invoke } from '@tauri-apps/api/tauri';

const mockInvoke = invoke as unknown as jest.MockedFunction<typeof invoke>;

describe('Integration: File context operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFileContextStore.setState({ contextFiles: [], isLoading: false, error: null });
  });

  test('load, add, remove, clear context files', async () => {
    // get_context_files -> []
    mockInvoke.mockResolvedValueOnce([] as any);
    await useFileContextStore.getState().loadContextFiles();
    expect(useFileContextStore.getState().contextFiles).toHaveLength(0);

    // add_file_context -> undefined
    mockInvoke.mockResolvedValueOnce(undefined as any);
    await useFileContextStore.getState().addFileToContext('hello.txt', 'hello');
    expect(useFileContextStore.getState().contextFiles.map(f => f.path)).toContain('hello.txt');

    // add_file_to_context_by_path -> undefined, and next load -> one file entry
    mockInvoke.mockResolvedValueOnce(undefined as any);
    mockInvoke.mockResolvedValueOnce([["/abs/path/readme.md", "# Title"]] as any);
    await useFileContextStore.getState().addFileByPath('/abs/path/readme.md');
    expect(useFileContextStore.getState().contextFiles.find(f => f.path === '/abs/path/readme.md')).toBeTruthy();

    // remove_file_from_context -> undefined
    mockInvoke.mockResolvedValueOnce(undefined as any);
    await useFileContextStore.getState().removeFileFromContext('hello.txt');
    expect(useFileContextStore.getState().contextFiles.find(f => f.path === 'hello.txt')).toBeFalsy();

    // clear_context -> undefined
    mockInvoke.mockResolvedValueOnce(undefined as any);
    await useFileContextStore.getState().clearAllContext();
    expect(useFileContextStore.getState().contextFiles).toHaveLength(0);
  });
});


