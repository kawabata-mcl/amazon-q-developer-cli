import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock BEFORE requiring the component under test
jest.mock('@/hooks/use-auth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));
const useAuthModule = jest.requireMock('@/hooks/use-auth') as { useAuth: jest.Mock };

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AuthGuard } = require('../auth-guard');

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when authenticated', () => {
    useAuthModule.useAuth.mockImplementation(() => ({
      // state
      status: { type: 'Authenticated', username: 'test', provider: 'AWS' },
      isLoading: false,
      error: null,
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'test', provider: 'AWS' },
      errorMessage: null,
      // actions
      login: jest.fn(async () => {}),
      logout: jest.fn(async () => {}),
      checkAuthStatus: jest.fn(async () => {}),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

    render(<AuthGuard><div data-testid="child" /></AuthGuard>);
    expect(!!screen.getByTestId('child')).toBe(true);
  });

  test('shows loading when authenticating', () => {
    useAuthModule.useAuth.mockImplementation(() => ({
      // state
      status: { type: 'Authenticating' },
      isLoading: true,
      error: null,
      isAuthenticated: false,
      isAuthenticating: true,
      hasError: false,
      user: null,
      errorMessage: null,
      // actions
      login: jest.fn(async () => {}),
      logout: jest.fn(async () => {}),
      checkAuthStatus: jest.fn(async () => {}),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    }));

    render(<AuthGuard><div data-testid="child" /></AuthGuard>);
    
    expect(!!screen.getByText('Checking authentication status...')).toBe(true);
    expect(screen.queryByTestId('child') === null).toBe(true);
  });
});