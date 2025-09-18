import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

// Mock Tauri API
jest.mock('@/lib/tauri', () => ({
  loginCommand: jest.fn(),
  logoutCommand: jest.fn(),
  getAuthStatusCommand: jest.fn(),
}));

import { useAuthStore } from '@/stores/auth-store';
import { loginCommand, logoutCommand, getAuthStatusCommand } from '@/lib/tauri';

const mockLoginCommand = loginCommand as jest.MockedFunction<typeof loginCommand>;
const mockLogoutCommand = logoutCommand as jest.MockedFunction<typeof logoutCommand>;
const mockGetAuthStatusCommand = getAuthStatusCommand as jest.MockedFunction<typeof getAuthStatusCommand>;

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      status: { type: 'NotAuthenticated' },
      isLoading: false,
      error: null,
    });
  });

  test('should have correct initial state', () => {
    const state = useAuthStore.getState();
    
    expect(state.status).toEqual({ type: 'NotAuthenticated' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should handle successful login', async () => {
    const mockAuthStatus = {
      type: 'Authenticated' as const,
      username: 'testuser',
      provider: 'AWS' as const,
    };

    mockLoginCommand.mockResolvedValue(mockAuthStatus);

    await act(async () => {
      await useAuthStore.getState().login();
    });

    const state = useAuthStore.getState();
    expect(state.status).toEqual(mockAuthStatus);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockLoginCommand).toHaveBeenCalled();
  });

  test('should handle login failure', async () => {
    const errorMessage = 'Authentication failed';
    mockLoginCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useAuthStore.getState().login();
    });

    const state = useAuthStore.getState();
    expect(state.status).toEqual({ type: 'NotAuthenticated' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should handle successful logout', async () => {
    // Set initial authenticated state
    useAuthStore.setState({
      status: { type: 'Authenticated', username: 'testuser', provider: 'AWS' },
      isLoading: false,
      error: null,
    });

    mockLogoutCommand.mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.status).toEqual({ type: 'NotAuthenticated' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockLogoutCommand).toHaveBeenCalled();
  });

  test('should handle logout failure', async () => {
    // Set initial authenticated state
    useAuthStore.setState({
      status: { type: 'Authenticated', username: 'testuser', provider: 'AWS' },
      isLoading: false,
      error: null,
    });

    const errorMessage = 'Logout failed';
    mockLogoutCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    // Should remain authenticated on logout failure
    expect(state.status).toEqual({ type: 'Authenticated', username: 'testuser', provider: 'AWS' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should check auth status successfully', async () => {
    const mockAuthStatus = {
      type: 'Authenticated' as const,
      username: 'testuser',
      provider: 'AWS' as const,
    };

    mockGetAuthStatusCommand.mockResolvedValue(mockAuthStatus);

    await act(async () => {
      await useAuthStore.getState().checkAuthStatus();
    });

    const state = useAuthStore.getState();
    expect(state.status).toEqual(mockAuthStatus);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockGetAuthStatusCommand).toHaveBeenCalled();
  });

  test('should handle auth status check failure', async () => {
    const errorMessage = 'Failed to check auth status';
    mockGetAuthStatusCommand.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useAuthStore.getState().checkAuthStatus();
    });

    const state = useAuthStore.getState();
    expect(state.status).toEqual({ type: 'NotAuthenticated' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('should set loading state during operations', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLoginCommand.mockReturnValue(loginPromise);

    // Start login (don't await)
    const loginCall = useAuthStore.getState().login();

    // Check loading state
    expect(useAuthStore.getState().isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolveLogin({ type: 'Authenticated', username: 'test', provider: 'AWS' });
      await loginCall;
    });

    // Check final state
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('should clear error', () => {
    // Set error state
    useAuthStore.setState({
      status: { type: 'NotAuthenticated' },
      isLoading: false,
      error: 'Some error',
    });

    act(() => {
      useAuthStore.getState().clearError();
    });

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
  });

  test('should set loading state manually', () => {
    act(() => {
      useAuthStore.getState().setLoading(true);
    });

    expect(useAuthStore.getState().isLoading).toBe(true);

    act(() => {
      useAuthStore.getState().setLoading(false);
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});