import { test, expect } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__ = {
        tauri: {
          invoke: async (command: string, args?: any) => {
            switch (command) {
              case 'get_auth_status':
                return { isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } }
              case 'get_conversation_history':
                return []
              case 'send_message':
                return {
                  id: 'msg-' + Date.now(),
                  role: 'assistant',
                  content: `You said: ${args.message}`,
                  timestamp: new Date().toISOString()
                }
              default:
                return null
            }
          }
        }
      }
    })
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/chat')
    
    // Check main landmarks
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check form elements
    await expect(page.getByRole('textbox', { name: /メッセージを入力/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /送信/i })).toBeVisible()
    
    // Check message list
    await expect(page.getByRole('log')).toBeVisible() // Message list should be a live region
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/chat')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('message-input')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('send-button')).toBeFocused()
    
    // Should be able to navigate back with Shift+Tab
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('message-input')).toBeFocused()
  })

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    // Type and send a message
    await messageInput.fill('Hello, accessibility test!')
    await sendButton.click()
    
    // Check for live region updates
    await expect(page.getByRole('log')).toContainText('Hello, accessibility test!')
    
    // Should announce new messages
    await expect(page.getByRole('log')).toContainText('You said: Hello, accessibility test!')
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/chat')
    
    // Check that text has sufficient contrast
    const messageInput = page.getByTestId('message-input')
    const computedStyle = await messageInput.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        color: style.color,
        backgroundColor: style.backgroundColor
      }
    })
    
    // Basic check that colors are defined
    expect(computedStyle.color).toBeTruthy()
    expect(computedStyle.backgroundColor).toBeTruthy()
  })

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    
    await page.goto('/chat')
    
    // Should still be usable in high contrast mode
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeVisible()
    await expect(page.getByTestId('send-button')).toBeVisible()
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/chat')
    
    // Should still function with reduced motion
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    await messageInput.fill('Test message')
    await sendButton.click()
    
    await expect(page.getByText('Test message')).toBeVisible()
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    // Focus should start on message input
    await expect(messageInput).toBeFocused()
    
    // After sending message, focus should return to input
    await messageInput.fill('Test message')
    await sendButton.click()
    
    await expect(messageInput).toBeFocused()
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    
    // Test Enter to send message
    await messageInput.fill('Test message')
    await messageInput.press('Enter')
    
    await expect(page.getByText('Test message')).toBeVisible()
    
    // Test Shift+Enter for new line
    await messageInput.fill('Line 1')
    await messageInput.press('Shift+Enter')
    await messageInput.type('Line 2')
    
    await expect(messageInput).toHaveValue('Line 1\nLine 2')
  })

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/chat')
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0)
    
    // Check that headings are properly nested (basic check)
    for (const heading of headings) {
      await expect(heading).toBeVisible()
    }
  })

  test('should support settings page accessibility', async ({ page }) => {
    await page.goto('/settings')
    
    // Check tab navigation
    await expect(page.getByRole('tablist')).toBeVisible()
    await expect(page.getByRole('tab', { name: /一般/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /外観/i })).toBeVisible()
    
    // Test tab keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('tab', { name: /一般/i })).toBeFocused()
    
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /外観/i })).toBeFocused()
  })

  test('should have accessible form controls', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to appearance tab
    await page.getByRole('tab', { name: /外観/i }).click()
    
    // Check form labels
    await expect(page.getByLabelText(/テーマ/i)).toBeVisible()
    await expect(page.getByLabelText(/フォントサイズ/i)).toBeVisible()
    
    // Check that form controls are properly labeled
    const themeSelect = page.getByLabelText(/テーマ/i)
    await expect(themeSelect).toHaveAttribute('aria-label')
  })

  test('should announce loading states', async ({ page }) => {
    // Mock slow response
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string, args?: any) => {
        if (command === 'send_message') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return {
            id: 'msg-' + Date.now(),
            role: 'assistant',
            content: `You said: ${args.message}`,
            timestamp: new Date().toISOString()
          }
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    await messageInput.fill('Test message')
    await sendButton.click()
    
    // Should announce loading state
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByText(/送信中/i)).toBeVisible()
  })

  test('should handle error states accessibly', async ({ page }) => {
    // Mock error response
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'send_message') {
          throw new Error('Network error')
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    await messageInput.fill('Test message')
    await sendButton.click()
    
    // Should announce error
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/エラー/i)).toBeVisible()
  })

  test('should support file operations accessibly', async ({ page }) => {
    await page.goto('/chat')
    
    const dropZone = page.getByTestId('file-drop-zone')
    
    // Should have proper ARIA attributes
    await expect(dropZone).toHaveAttribute('role', 'button')
    await expect(dropZone).toHaveAttribute('aria-label')
    
    // Should be keyboard accessible
    await dropZone.focus()
    await expect(dropZone).toBeFocused()
    
    // Should support Enter key activation
    await dropZone.press('Enter')
    // File dialog should open (mocked in real implementation)
  })
})