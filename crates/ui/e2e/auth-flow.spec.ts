import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Tauri API calls
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__ = {
        tauri: {
          invoke: async (command: string, args?: any) => {
            switch (command) {
              case 'get_auth_status':
                return { isAuthenticated: false, user: null }
              case 'login':
                return { isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } }
              case 'logout':
                return { isAuthenticated: false, user: null }
              default:
                throw new Error(`Unknown command: ${command}`)
            }
          }
        }
      }
    })
  })

  test('should display login screen when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to auth page or show auth panel
    await expect(page.getByTestId('auth-panel')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()
    await expect(page.getByText('Amazon Q Developer にログイン')).toBeVisible()
  })

  test('should handle login flow successfully', async ({ page }) => {
    await page.goto('/')
    
    // Click login button
    await page.getByTestId('login-button').click()
    
    // Should show loading state
    await expect(page.getByTestId('auth-loading')).toBeVisible()
    
    // Wait for authentication to complete
    await page.waitForTimeout(1000)
    
    // Should redirect to chat page after successful login
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeVisible()
  })

  test('should handle logout flow', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        switch (command) {
          case 'get_auth_status':
            return { isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } }
          case 'logout':
            return { isAuthenticated: false, user: null }
          default:
            throw new Error(`Unknown command: ${command}`)
        }
      }
    })
    
    await page.goto('/chat')
    
    // Should show authenticated UI
    await expect(page.getByTestId('chat-window')).toBeVisible()
    
    // Open settings or user menu
    await page.getByTestId('user-menu-button').click()
    
    // Click logout
    await page.getByTestId('logout-button').click()
    
    // Should redirect to auth page
    await expect(page.getByTestId('auth-panel')).toBeVisible()
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'login') {
          throw new Error('Authentication failed')
        }
        return { isAuthenticated: false, user: null }
      }
    })
    
    await page.goto('/')
    
    // Click login button
    await page.getByTestId('login-button').click()
    
    // Should show error message
    await expect(page.getByTestId('auth-error')).toBeVisible()
    await expect(page.getByText('認証に失敗しました')).toBeVisible()
  })
})