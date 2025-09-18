import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
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
              case 'get_conversation_history':
                // Generate large conversation history for performance testing
                const messages = []
                for (let i = 0; i < 1000; i++) {
                  messages.push({
                    id: `msg-${i}`,
                    role: i % 2 === 0 ? 'user' : 'assistant',
                    content: `This is message number ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                    timestamp: new Date(Date.now() - (1000 - i) * 60000).toISOString()
                  })
                }
                return messages
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

  test('should load chat page within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/chat')
    
    // Wait for main components to be visible
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle large conversation history efficiently', async ({ page }) => {
    await page.goto('/chat')
    
    // Wait for conversation history to load
    await expect(page.getByTestId('message-list')).toBeVisible()
    
    // Should show virtual scrolling for large lists
    await expect(page.getByTestId('virtual-message-list')).toBeVisible()
    
    // Check that not all messages are rendered at once (virtual scrolling)
    const renderedMessages = await page.getByTestId('message-item').count()
    expect(renderedMessages).toBeLessThan(100) // Should be much less than 1000
  })

  test('should scroll smoothly through large message list', async ({ page }) => {
    await page.goto('/chat')
    
    const messageList = page.getByTestId('message-list')
    await expect(messageList).toBeVisible()
    
    // Measure scroll performance
    const startTime = Date.now()
    
    // Scroll to bottom
    await messageList.evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    
    // Wait for scroll to complete
    await page.waitForTimeout(100)
    
    // Scroll to top
    await messageList.evaluate(el => {
      el.scrollTop = 0
    })
    
    const scrollTime = Date.now() - startTime
    
    // Should scroll smoothly within reasonable time
    expect(scrollTime).toBeLessThan(1000)
  })

  test('should handle rapid message sending without performance degradation', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    const sendButton = page.getByTestId('send-button')
    
    const startTime = Date.now()
    
    // Send multiple messages rapidly
    for (let i = 0; i < 10; i++) {
      await messageInput.fill(`Message ${i}`)
      await sendButton.click()
      await page.waitForTimeout(50) // Small delay to simulate rapid typing
    }
    
    // Wait for all messages to be processed
    await expect(page.getByTestId('message-item').filter({ hasText: 'Message 9' })).toBeVisible()
    
    const totalTime = Date.now() - startTime
    
    // Should handle rapid messages efficiently
    expect(totalTime).toBeLessThan(5000)
  })

  test('should maintain responsive UI during file operations', async ({ page }) => {
    await page.goto('/chat')
    
    const dropZone = page.getByTestId('file-drop-zone')
    
    // Simulate dropping multiple files
    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `file-${i}.js`,
      content: `console.log("File ${i}"); `.repeat(1000) // Large file content
    }))
    
    const startTime = Date.now()
    
    for (const file of files) {
      await page.evaluate(({ fileName, fileContent }) => {
        const dropZone = document.querySelector('[data-testid="file-drop-zone"]') as HTMLElement
        const file = new File([fileContent], fileName, { type: 'text/javascript' })
        
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
        
        dropZone.dispatchEvent(dropEvent)
      }, { fileName: file.name, fileContent: file.content })
    }
    
    // UI should remain responsive
    await expect(page.getByTestId('message-input')).toBeEnabled()
    
    const processingTime = Date.now() - startTime
    expect(processingTime).toBeLessThan(3000)
  })

  test('should handle memory efficiently with long-running session', async ({ page }) => {
    await page.goto('/chat')
    
    // Simulate long-running session with many interactions
    for (let i = 0; i < 50; i++) {
      const messageInput = page.getByTestId('message-input')
      const sendButton = page.getByTestId('send-button')
      
      await messageInput.fill(`Test message ${i}`)
      await sendButton.click()
      
      // Wait for response
      await expect(page.getByTestId('message-item').filter({ hasText: `Test message ${i}` })).toBeVisible()
      
      // Check that UI remains responsive
      await expect(messageInput).toBeEnabled()
      await expect(sendButton).toBeEnabled()
    }
    
    // Should still be responsive after many interactions
    await expect(page.getByTestId('chat-window')).toBeVisible()
    await expect(page.getByTestId('message-input')).toBeEnabled()
  })

  test('should optimize re-renders during typing', async ({ page }) => {
    await page.goto('/chat')
    
    const messageInput = page.getByTestId('message-input')
    
    // Type a long message character by character
    const longMessage = 'This is a very long message that should test the performance of the input component during typing. '.repeat(10)
    
    const startTime = Date.now()
    
    for (const char of longMessage) {
      await messageInput.type(char, { delay: 10 })
    }
    
    const typingTime = Date.now() - startTime
    
    // Should handle typing efficiently
    expect(typingTime).toBeLessThan(longMessage.length * 50) // Allow 50ms per character max
  })

  test('should handle theme switching without performance impact', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to appearance tab
    await page.getByTestId('settings-tab-appearance').click()
    
    const startTime = Date.now()
    
    // Switch themes multiple times
    const themes = ['light', 'dark', 'system']
    for (const theme of themes) {
      await page.getByTestId('theme-select').selectOption(theme)
      await page.waitForTimeout(100) // Wait for theme to apply
    }
    
    const switchingTime = Date.now() - startTime
    
    // Should switch themes quickly
    expect(switchingTime).toBeLessThan(1000)
  })

  test('should maintain performance with multiple file contexts', async ({ page }) => {
    // Mock many file contexts
    await page.addInitScript(() => {
      const files = Array.from({ length: 50 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.js`,
        content: `console.log("File ${i}"); `.repeat(100),
        size: 2000
      }))
      
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'get_file_contexts') {
          return files
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    // Should load file contexts efficiently
    await expect(page.getByTestId('file-context-manager')).toBeVisible()
    
    // Should show file items without performance issues
    const fileItems = await page.getByTestId('file-context-item').count()
    expect(fileItems).toBeGreaterThan(0)
    
    // UI should remain responsive
    await expect(page.getByTestId('message-input')).toBeEnabled()
  })
})