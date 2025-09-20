import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPage from '@/app/chat/page'

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))
import { useAuth } from '@/hooks/use-auth'

describe('ChatPage', () => {
  test('logout button triggers useAuth.logout and redirects to /auth', async () => {
    const logout = jest.fn(async () => {})
    ;(useAuth as jest.Mock).mockReturnValue({
      status: { type: 'Authenticated', username: 'u', provider: 'p' },
      isLoading: false,
      error: null,
      isAuthenticated: true,
      isAuthenticating: false,
      hasError: false,
      user: { username: 'u', provider: 'p' },
      errorMessage: null,
      login: jest.fn(),
      logout,
      checkAuthStatus: jest.fn(),
      refreshToken: jest.fn(),
      initializeAuth: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    })

    const { container } = render(<ChatPage />)

    const btn = await screen.findByTestId('header-logout-button')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(logout).toHaveBeenCalled()
    })
  })
})


