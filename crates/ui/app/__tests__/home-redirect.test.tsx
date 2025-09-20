import React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, afterEach } from '@jest/globals';

// Use the singleton router mock defined in jest.setup.ts
const router = (globalThis as unknown as { __routerMock: { push: jest.Mock } }).__routerMock;

const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

afterEach(() => {
  router.push.mockReset();
  mockUseAuth.mockReset();
});

describe('Home redirect', () => {
  it('redirects to /chat when authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isAuthenticating: false });
    const { default: Home } = await import('../page');
    const { unmount } = render(<Home />);
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/chat');
    });
    unmount();
  });

  it('redirects to /auth when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isAuthenticating: false });
    const { default: Home } = await import('../page');
    const { unmount } = render(<Home />);
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/auth');
    });
    unmount();
  });
});
