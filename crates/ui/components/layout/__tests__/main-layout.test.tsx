import { render, screen, fireEvent } from '@testing-library/react'
import { MainLayout } from '@/components/layout'

describe('MainLayout', () => {
  test('wires onLogoutClick to Header logout button', () => {
    const handleLogout = jest.fn()

    render(
      <MainLayout title="Test" onLogoutClick={handleLogout}>
        <div>content</div>
      </MainLayout>
    )

    const btn = screen.getByTestId('header-logout-button')
    fireEvent.click(btn)
    expect(handleLogout).toHaveBeenCalledTimes(1)
  })
})


