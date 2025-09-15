import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../auth-guard';
import { useAuth } from '@/hooks/use-auth';

// Mock the hooks
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
  });

  test('should show loading when authenticating', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: true,
      hasError: false,
      errorMessage: null,
      login: jest.fn(),
      clearError: jest.fn(),
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Checking authentication status...')).toBeInTheDocument();
  });

  test('should show children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      errorMessage: null,
      login: jest.fn(),
      clearError: jest.fn(),
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('should redirect to auth page when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: false,
      errorMessage: null,
      login: jest.fn(),
      clearError: jest.fn(),
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth');
    });
  });

  test('should show error state with retry option', () => {
    const mockLogin = jest.fn();
    const mockClearError = jest.fn();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: true,
      errorMessage: 'Authentication failed',
      login: mockLogin,
      clearError: mockClearError,
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    expect(screen.getByText('Try Login Again')).toBeInTheDocument();
  });

  test('should show custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: false,
      errorMessage: null,
      login: jest.fn(),
      clearError: jest.fn(),
    } as any);

    render(
      <AuthGuard fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });
});