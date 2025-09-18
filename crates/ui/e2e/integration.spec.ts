import { test, expect } from '@playwright/test'
import { mockTauriAPI, sendChatMessage, dropFile, waitForNotification } from './helpers/test-utils'

test.describe('Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriAPI(page)
  })

  test('should handle complete user workflow from login to chat', async ({ page }) => {
    // Start with unauthenticated state
    await mockTauriAPI(page, {
      get_auth_status: () => ({ isAuthenticated: false, user: null })
    })
    
    await page.goto('/')
    
    // Should show auth panel
    await expect(page.getByTestId('auth-panel')).toBeVisible()
    
    // Login
    await page.getByTestId('login-button').click()
    
    // Should redirect to chat after login
    await expect(page.getByTestId('chat-window')).toBeVisible()
    
    // Send a message
    await sendChatMessage(page, 'Hello, Q!')
    
    // Should receive response
    await expect(page.getByText('You said: Hello, Q!')).toBeVisible()
  })

  test('should integrate file operations with chat', async ({ page }) => {
    await page.goto('/chat')
    
    // Drop a file
    await dropFile(page, 'example.js', 'console.log("Hello, World!");', 'text/javascript')
    
    // Should show file in context
    await expect(page.getByTestId('file-context-item')).toBeVisible()
    await expect(page.getByText('example.js')).toBeVisible()
    
    // Send a message about the file
    await sendChatMessage(page, 'Can you explain this code?')
    
    // Should receive response
    await expect(page.getByText('You said: Can you explain this code?')).toBeVisible()
  })

  test('should persist settings across navigation', async ({ page }) => {
    await page.goto('/settings')
    
    // Change theme
    await page.getByTestId('settings-tab-appearance').click()
    await page.getByTestId('theme-select').selectOption('dark')
    await page.getByTestId('save-settings-button').click()
    
    // Navigate to chat
    await page.goto('/chat')
    
    // Navigate back to settings
    await page.goto('/settings')
    await page.getByTestId('settings-tab-appearance').click()
    
    // Theme should still be dark
    await expect(page.getByTestId('theme-select')).toHaveValue('dark')
  })

  test('should handle error recovery gracefully', async ({ page }) => {
    await page.goto('/chat')
    
    // Mock network error
    await page.addInitScript(() => {
      let failCount = 0
      // @ts-ignore
      const originalInvoke = window.__TAURI__.tauri.invoke
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string, args?: any) => {
        if (command === 'send_message' && failCount < 2) {
          failCount++
          throw new Error('Network error')
        }
        return originalInvoke(command, args)
      }
    })
    
    // Try to send message (should fail)
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    await messageInput.fill('Test message')
    await sendButton.click()
    
    // Should show error
    await waitForNotification(page, 'error')
    
    // Try again (should succeed)
    await messageInput.fill('Test message retry')
    await sendButton.click()
    
    // Should succeed
    await expect(page.getByText('You said: Test message retry')).toBeVisible()
  })

  test('should handle concurrent operations', async ({ page }) => {
    await page.goto('/chat')
    
    // Start multiple operations concurrently
    const operations = [
      // Send multiple messages
      sendChatMessage(page, 'Message 1'),
      sendChatMessage(page, 'Message 2'),
      sendChatMessage(page, 'Message 3'),
      
      // Drop files
      dropFile(page, 'file1.js', 'console.log("File 1");'),
      dropFile(page, 'file2.js', 'console.log("File 2");')
    ]
    
    // Wait for all operations to complete
    await Promise.all(operations)
    
    // All messages should be visible
    await expect(page.getByText('You said: Message 1')).toBeVisible()
    await expect(page.getByText('You said: Message 2')).toBeVisible()
    await expect(page.getByText('You said: Message 3')).toBeVisible()
    
    // All files should be in context
    await expect(page.getByText('file1.js')).toBeVisible()
    await expect(page.getByText('file2.js')).toBeVisible()
  })

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/chat')
    
    // Send a message
    await sendChatMessage(page, 'Test message')
    
    // Add a file
    await dropFile(page, 'test.js', 'console.log("test");')
    
    // Navigate to settings
    await page.goto('/settings')
    await expect(page.getByTestId('settings-panel')).toBeVisible()
    
    // Navigate back to chat
    await page.goto('/chat')
    
    // Message should still be there
    await expect(page.getByText('Test message')).toBeVisible()
    await expect(page.getByText('You said: Test message')).toBeVisible()
    
    // File should still be in context
    await expect(page.getByText('test.js')).toBeVisible()
  })

  test('should handle authentication state changes', async ({ page }) => {
    await page.goto('/chat')
    
    // Should be authenticated and show chat
    await expect(page.getByTestId('chat-window')).toBeVisible()
    
    // Simulate logout
    await mockTauriAPI(page, {
      get_auth_status: () => ({ isAuthenticated: false, user: null })
    })
    
    // Refresh page
    await page.reload()
    
    // Should redirect to auth
    await expect(page.getByTestId('auth-panel')).toBeVisible()
  })

  test('should handle keyboard shortcuts across the app', async ({ page }) => {
    await page.goto('/chat')
    
    // Test message sending with Enter
    const messageInput = page.getByTestId('message-input')
    await messageInput.fill('Keyboard test')
    await messageInput.press('Enter')
    
    await expect(page.getByText('Keyboard test')).toBeVisible()
    
    // Test navigation shortcuts (if implemented)
    await page.keyboard.press('Control+,') // Settings shortcut
    // Should navigate to settings (if shortcut is implemented)
  })

  test('should handle large data sets efficiently', async ({ page }) => {
    // Mock large conversation history
    await mockTauriAPI(page, {
      get_conversation_history: () => {
        const messages = []
        for (let i = 0; i < 500; i++) {
          messages.push({
            id: `msg-${i}`,
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            timestamp: new Date(Date.now() - (500 - i) * 60000).toISOString()
          })
        }
        return messages
      }
    })
    
    await page.goto('/chat')
    
    // Should load efficiently with virtual scrolling
    await expect(page.getByTestId('virtual-message-list')).toBeVisible()
    
    // Should show some messages but not all (virtual scrolling)
    const visibleMessages = await page.getByTestId('message-item').count()
    expect(visibleMessages).toBeLessThan(100) // Much less than 500
    
    // Should be able to scroll and load more
    const messageList = page.getByTestId('message-list')
    await messageList.evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    
    // Should still be responsive
    await expect(page.getByTestId('message-input')).toBeEnabled()
  })

  test('should handle theme changes across components', async ({ page }) => {
    await page.goto('/settings')
    
    // Change to dark theme
    await page.getByTestId('settings-tab-appearance').click()
    await page.getByTestId('theme-select').selectOption('dark')
    await page.getByTestId('save-settings-button').click()
    
    // Navigate to chat
    await page.goto('/chat')
    
    // Check that dark theme is applied
    const body = page.locator('body')
    const hasClass = await body.evaluate(el => el.classList.contains('dark'))
    expect(hasClass).toBeTruthy()
    
    // All components should respect the theme
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeVisible()
  })
})