import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/components/layout/header'

describe('Header', () => {
  test('renders logout button when onLogoutClick is provided and calls handler', () => {
    const handleLogout = jest.fn()
    render(<Header title="Test" onLogoutClick={handleLogout} />)

    const btn = screen.getByTestId('header-logout-button')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(handleLogout).toHaveBeenCalledTimes(1)
  })

  test('does not render logout button when onLogoutClick is not provided', () => {
    render(<Header title="Test" />)
    expect(screen.queryByTestId('header-logout-button')).toBeNull()
  })
})


