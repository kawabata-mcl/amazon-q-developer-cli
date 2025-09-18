import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state and Tauri API calls
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__ = {
        tauri: {
          invoke: async (command: string, args?: any) => {
            switch (command) {
              case 'get_auth_status':
                return { isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } }
              case 'send_message':
                return {
                  id: 'msg-' + Date.now(),
                  role: 'assistant',
                  content: `You said: ${args.message}`,
                  timestamp: new Date().toISOString()
                }
              case 'get_conversation_history':
                return []
              case 'start_new_conversation':
                return 'conv-' + Date.now()
              default:
                return null
            }
          }
        }
      }
    })
  })

  test('should display chat interface when authenticated', async ({ page }) => {
    await page.goto('/chat')
    
    // Should show main chat components
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeVisible()
    await expect(page.getByTestId('send-button')).toBeVisible()
    await expect(page.getByTestId('message-list')).toBeVisible()
  })

  test('should send and receive messages', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    // Type a message
    await messageInput.fill('Hello, Q!')
    
    // Send the message
    await sendButton.click()
    
    // Should show user message
    await expect(page.getByTestId('message-item').filter({ hasText: 'Hello, Q!' })).toBeVisible()
    
    // Should show assistant response
    await expect(page.getByTestId('message-item').filter({ hasText: 'You said: Hello, Q!' })).toBeVisible()
    
    // Input should be cleared
    await expect(messageInput).toHaveValue('')
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    
    // Type a message
    await messageInput.fill('Test message')
    
    // Send with Enter key
    await messageInput.press('Enter')
    
    // Should send the message
    await expect(page.getByTestId('message-item').filter({ hasText: 'Test message' })).toBeVisible()
  })

  test('should handle multiline messages with Shift+Enter', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    
    // Type first line
    await messageInput.fill('Line 1')
    
    // Add new line with Shift+Enter
    await messageInput.press('Shift+Enter')
    await messageInput.type('Line 2')
    
    // Should contain both lines
    await expect(messageInput).toHaveValue('Line 1\nLine 2')
    
    // Send with Enter
    await messageInput.press('Enter')
    
    // Should send multiline message
    await expect(page.getByTestId('message-item').filter({ hasText: 'Line 1' })).toBeVisible()
    await expect(page.getByTestId('message-item').filter({ hasText: 'Line 2' })).toBeVisible()
  })

  test('should show loading state during message sending', async ({ page }) => {
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
    
    // Should show loading state
    await expect(page.getByTestId('message-loading')).toBeVisible()
    await expect(sendButton).toBeDisabled()
    
    // Wait for response
    await expect(page.getByTestId('message-item').filter({ hasText: 'You said: Test message' })).toBeVisible()
    
    // Loading should be gone
    await expect(page.getByTestId('message-loading')).not.toBeVisible()
    await expect(sendButton).toBeEnabled()
  })

  test('should handle message sending errors', async ({ page }) => {
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
    
    // Should show error notification
    await expect(page.getByTestId('error-notification')).toBeVisible()
    await expect(page.getByText('メッセージの送信に失敗しました')).toBeVisible()
  })

  test('should display conversation history', async ({ page }) => {
    // Mock conversation history
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'get_conversation_history') {
          return [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Previous message',
              timestamp: new Date(Date.now() - 60000).toISOString()
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Previous response',
              timestamp: new Date(Date.now() - 30000).toISOString()
            }
          ]
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    // Should show previous messages
    await expect(page.getByTestId('message-item').filter({ hasText: 'Previous message' })).toBeVisible()
    await expect(page.getByTestId('message-item').filter({ hasText: 'Previous response' })).toBeVisible()
  })
})