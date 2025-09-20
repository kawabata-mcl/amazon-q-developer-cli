import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import AuthPage from '@/app/auth/page';

describe('AuthPage', () => {
  it('renders AuthPanel and no Back to Chat button', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(<AuthPage />);
    expect(screen.getByTestId('auth-panel')).toBeInTheDocument();
    expect(screen.queryByText('Back to Chat')).toBeNull();
  });
});
