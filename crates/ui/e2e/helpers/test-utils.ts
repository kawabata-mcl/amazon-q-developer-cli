import { Page, expect } from '@playwright/test'

/**
 * Common test utilities for E2E tests
 */

/**
 * Mock Tauri API with common responses
 */
export async function mockTauriAPI(page: Page, overrides: Record<string, any> = {}) {
  await page.addInitScript((overridesInit: any) => {
    const defaultMocks: Record<string, any> = {
      // Auth
      get_auth_status: () => ({ type: 'NotAuthenticated' }),
      login: () => ({ type: 'Authenticated', username: 'Test User', provider: 'test' }),
      logout: () => ({ type: 'NotAuthenticated' }),
      // Chat
      send_message: (args: any) => ({
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `You said: ${args.message}`,
        timestamp: new Date().toISOString()
      }),
      get_conversation_history: () => [],
      start_new_conversation: () => 'conv-' + Date.now(),
      get_all_conversations: () => [],
      // Settings
      get_app_settings: () => ({
        appearance: { theme: 'system', fontSize: 14, fontFamily: 'system-ui', accentColor: '#3b82f6' },
        window: { width: 1200, height: 800, rememberPosition: true, maximized: false, alwaysOnTop: false },
        keyboard: { shortcuts: { 'new-conversation': 'Cmd+N' }, enableGlobalShortcuts: false, enableAccessibilityShortcuts: true },
        general: { autoSave: true, autoSaveInterval: 30, maxConversationHistory: 100, enableNotifications: true, language: 'ja' },
      }),
      update_app_settings: () => true,
      reset_app_settings: () => true,
      // File context
      get_context_files: () => [],
      add_file_context: (args: any) => ({
        id: 'file-' + Date.now(),
        name: args.file_name ?? args.fileName,
        content: args.content,
        size: args.content?.length ?? 0
      }),
      add_file_to_context_by_path: () => true,
      remove_file_from_context: () => true,
      clear_context: () => true,
      read_file_content: (args: any) => ({ path: args.file_path, content: 'test', size: 4, mime_type: 'text/plain' }),
      save_file_content: () => true,
    }

    const mocks: Record<string, any> = { ...defaultMocks, ...(overridesInit || {}) }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__TAURI__ = {
      tauri: {
        invoke: async (command: string, args?: any): Promise<unknown> => {
          const mock = mocks[command]
          if (typeof mock === 'function') {
            return mock(args)
          }
          if (mock !== undefined) {
            return mock
          }
          throw new Error(`Unknown command: ${command}`)
        }
      }
    }
  }, overrides)
}

/**
 * Wait for a notification to appear and optionally check its content
 */
export async function waitForNotification(page: Page, type: 'success' | 'error' | 'info' = 'success', content?: string) {
  const notification = page.getByTestId(`${type}-notification`)
  await expect(notification).toBeVisible()
  
  if (content) {
    await expect(notification).toContainText(content)
  }
  
  return notification
}

/**
 * Send a message in the chat interface
 */
export async function sendChatMessage(page: Page, message: string) {
  const messageInput = page.getByTestId('message-input')
  const sendButton = page.getByTestId('send-button')
  
  await messageInput.fill(message)
  await sendButton.click()
  
  // Wait for message to appear
  await expect(page.getByTestId('message-item').filter({ hasText: message })).toBeVisible()
}

/**
 * Navigate to a settings tab
 */
export async function navigateToSettingsTab(page: Page, tab: 'general' | 'appearance' | 'window' | 'keyboard') {
  await page.goto('/settings')
  await page.getByTestId(`settings-tab-${tab}`).click()
  await expect(page.getByTestId(`${tab}-settings`)).toBeVisible()
}

/**
 * Simulate file drop on the drop zone
 */
export async function dropFile(page: Page, fileName: string, content: string, mimeType: string = 'text/plain') {
  await page.evaluate(({ fileName, content, mimeType }) => {
    const dropZone = document.querySelector('[data-testid="file-drop-zone"]') as HTMLElement
    const file = new File([content], fileName, { type: mimeType })
    
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer
    })
    
    dropZone.dispatchEvent(dropEvent)
  }, { fileName, content, mimeType })
}

/**
 * Check if an element is accessible (has proper ARIA attributes)
 */
export async function checkAccessibility(page: Page, selector: string) {
  const element = page.locator(selector)
  await expect(element).toBeVisible()
  
  // Check for basic accessibility attributes
  const hasAriaLabel = await element.getAttribute('aria-label')
  const hasRole = await element.getAttribute('role')
  const hasTabIndex = await element.getAttribute('tabindex')
  
  // At least one accessibility attribute should be present
  expect(hasAriaLabel || hasRole || hasTabIndex !== null).toBeTruthy()
}

/**
 * Test keyboard navigation between elements
 */
export async function testKeyboardNavigation(page: Page, elements: string[]) {
  for (let i = 0; i < elements.length; i++) {
    if (i === 0) {
      // Focus first element
      await page.locator(elements[i]).focus()
    } else {
      // Tab to next element
      await page.keyboard.press('Tab')
    }
    
    await expect(page.locator(elements[i])).toBeFocused()
  }
}

/**
 * Measure performance of an operation
 */
export async function measurePerformance<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now()
  const result = await operation()
  const duration = Date.now() - startTime
  
  return { result, duration }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading spinners to disappear
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible()
  await expect(page.getByTestId('message-loading')).not.toBeVisible()
}

/**
 * Check that error handling works correctly
 */
export async function testErrorHandling(page: Page, command: string, expectedErrorMessage: string) {
  await page.addInitScript((command) => {
    // @ts-ignore
    const originalInvoke = window.__TAURI__.tauri.invoke
    // @ts-ignore
    window.__TAURI__.tauri.invoke = async (cmd: string, args?: any) => {
      if (cmd === command) {
        throw new Error('Test error')
      }
      return originalInvoke(cmd, args)
    }
  }, command)
  
  // Trigger the error and check for proper handling
  await waitForNotification(page, 'error', expectedErrorMessage)
}

/**
 * Create a large conversation history for performance testing
 */
export function createLargeConversationHistory(messageCount: number = 1000) {
  const messages = []
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `This is message number ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      timestamp: new Date(Date.now() - (messageCount - i) * 60000).toISOString()
    })
  }
  return messages
}

/**
 * Create multiple file contexts for testing
 */
export function createMultipleFileContexts(fileCount: number = 10) {
  const files = []
  for (let i = 0; i < fileCount; i++) {
    files.push({
      id: `file-${i}`,
      name: `file-${i}.js`,
      content: `console.log("File ${i}"); `.repeat(50),
      size: 1000
    })
  }
  return files
}