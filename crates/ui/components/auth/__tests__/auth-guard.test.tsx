import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock the auth hook BEFORE importing the component under test
jest.mock('@/hooks/use-auth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

const useAuthModule = jest.requireMock('@/hooks/use-auth') as { useAuth: jest.Mock };
const { AuthGuard } = require('../auth-guard');

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when user is authenticated', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'testuser', provider: 'AWS' },
      error: null,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('renders loading state when authenticating', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: true,
      hasError: false,
      user: null,
      error: null,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders auth panel when user is not authenticated', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: false,
      user: null,
      error: null,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders error state when authentication fails', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: true,
      user: null,
      error: 'Authentication failed',
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders custom fallback when provided and not authenticated', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: false,
      hasError: false,
      user: null,
      error: null,
    });

    const CustomFallback = () => <div>Custom login required</div>;

    render(
      <AuthGuard fallback={<CustomFallback />}>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Custom login required')).toBeInTheDocument();
    expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders custom loading component when provided and authenticating', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAuthenticating: true,
      hasError: false,
      user: null,
      error: null,
    });

    const CustomLoading = () => <div>Custom loading...</div>;

    render(
      <AuthGuard loadingComponent={<CustomLoading />}>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
    expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('handles multiple children correctly', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'testuser', provider: 'AWS' },
      error: null,
    });

    render(
      <AuthGuard>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </AuthGuard>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  test('handles function children correctly', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'testuser', provider: 'AWS' },
      error: null,
    });

    render(
      <AuthGuard>
        {({ user }) => <div>Welcome, {user?.username}!</div>}
      </AuthGuard>
    );

    expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
  });

  test('passes user data to function children', () => {
    const mockUser = { username: 'johndoe', provider: 'AWS' as const };
    
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: mockUser,
      error: null,
    });

    render(
      <AuthGuard>
        {({ user, isAuthenticated }) => (
          <div>
            User: {user?.username}, Authenticated: {isAuthenticated.toString()}
          </div>
        )}
      </AuthGuard>
    );

    expect(screen.getByText('User: johndoe, Authenticated: true')).toBeInTheDocument();
  });

  test('does not render children when function returns null', () => {
    useAuthModule.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'testuser', provider: 'AWS' },
      error: null,
    });

    render(
      <AuthGuard>
        {() => null}
      </AuthGuard>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});