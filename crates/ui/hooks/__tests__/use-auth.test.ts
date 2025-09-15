import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';
import { useAuthStore } from '@/stores/auth-store';

// Mock the auth store
jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('useAuth', () => {
  const mockCheckAuthStatus = jest.fn();
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockClearError = jest.fn();
  const mockSetLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      status: { type: 'NotAuthenticated' },
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    });
  });

  test('should check auth status on mount', () => {
    renderHook(() => useAuth());
    
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1);
  });

  test('should return correct authentication state for authenticated user', () => {
    mockUseAuthStore.mockReturnValue({
      status: { 
        type: 'Authenticated', 
        username: 'testuser', 
        provider: 'AWS' 
      },
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAuthenticating).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.user).toEqual({
      username: 'testuser',
      provider: 'AWS',
    });
  });

  test('should return correct authentication state for unauthenticated user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('should return correct authentication state during authentication', () => {
    mockUseAuthStore.mockReturnValue({
      status: { type: 'Authenticating' },
      isLoading: true,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  test('should return correct authentication state for error', () => {
    mockUseAuthStore.mockReturnValue({
      status: { type: 'Error', message: 'Login failed' },
      isLoading: false,
      error: 'Login failed',
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(result.current.errorMessage).toBe('Login failed');
  });

  test('should call login function', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login();
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  test('should call logout function', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});