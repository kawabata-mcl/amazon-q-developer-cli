import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// Mock the auth store BEFORE importing the hook under test
jest.mock('@/stores/auth-store', () => ({
  __esModule: true,
  useAuthStore: jest.fn(),
}));
const authStore = jest.requireMock('@/stores/auth-store') as { useAuthStore: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useAuth } = require('../use-auth');

describe('useAuth', () => {
  const mockCheckAuthStatus = jest.fn();
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockClearError = jest.fn();
  const mockSetLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    authStore.useAuthStore.mockImplementation(() => ({
      status: { type: 'NotAuthenticated' },
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    }));
  });

  test('should return correct authentication state for authenticated user', () => {
    authStore.useAuthStore.mockImplementation(() => ({
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
    }));

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
    authStore.useAuthStore.mockImplementation(() => ({
      status: { type: 'Authenticating' },
      isLoading: true,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      checkAuthStatus: mockCheckAuthStatus,
      clearError: mockClearError,
      setLoading: mockSetLoading,
    }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(true);
    expect(result.current.hasError).toBe(false);
  });
});