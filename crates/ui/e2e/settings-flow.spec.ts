import { test, expect } from '@playwright/test'

test.describe('Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state and Tauri API calls
    await page.addInitScript(() => {
      let settings = {
        appearance: {
          theme: 'system',
          fontSize: 14,
          fontFamily: 'system'
        },
        window: {
          width: 1200,
          height: 800,
          rememberPosition: true
        },
        keyboard: {
          shortcuts: {
            sendMessage: 'Enter',
            newConversation: 'Cmd+N',
            toggleSidebar: 'Cmd+B'
          }
        },
        general: {
          autoSave: true,
          notifications: true,
          language: 'ja'
        }
      }
      
      // @ts-ignore
      window.__TAURI__ = {
        tauri: {
          invoke: async (command: string, args?: any) => {
            switch (command) {
              case 'get_auth_status':
                return { isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } }
              case 'get_settings':
                return settings
              case 'save_settings':
                settings = { ...settings, ...args.settings }
                return true
              case 'reset_settings':
                settings = {
                  appearance: { theme: 'system', fontSize: 14, fontFamily: 'system' },
                  window: { width: 1200, height: 800, rememberPosition: true },
                  keyboard: { shortcuts: { sendMessage: 'Enter', newConversation: 'Cmd+N', toggleSidebar: 'Cmd+B' } },
                  general: { autoSave: true, notifications: true, language: 'ja' }
                }
                return true
              default:
                return null
            }
          }
        }
      }
    })
  })

  test('should display settings page', async ({ page }) => {
    await page.goto('/settings')
    
    // Should show settings panel
    await expect(page.getByTestId('settings-panel')).toBeVisible()
    await expect(page.getByText('設定')).toBeVisible()
    
    // Should show tab navigation
    await expect(page.getByTestId('settings-tab-general')).toBeVisible()
    await expect(page.getByTestId('settings-tab-appearance')).toBeVisible()
    await expect(page.getByTestId('settings-tab-window')).toBeVisible()
    await expect(page.getByTestId('settings-tab-keyboard')).toBeVisible()
  })

  test('should navigate between settings tabs', async ({ page }) => {
    await page.goto('/settings')
    
    // Click appearance tab
    await page.getByTestId('settings-tab-appearance').click()
    await expect(page.getByTestId('appearance-settings')).toBeVisible()
    await expect(page.getByText('テーマ')).toBeVisible()
    
    // Click window tab
    await page.getByTestId('settings-tab-window').click()
    await expect(page.getByTestId('window-settings')).toBeVisible()
    await expect(page.getByText('ウィンドウサイズ')).toBeVisible()
    
    // Click keyboard tab
    await page.getByTestId('settings-tab-keyboard').click()
    await expect(page.getByTestId('keyboard-settings')).toBeVisible()
    await expect(page.getByText('キーボードショートカット')).toBeVisible()
  })

  test('should change appearance settings', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to appearance tab
    await page.getByTestId('settings-tab-appearance').click()
    
    // Change theme
    await page.getByTestId('theme-select').selectOption('dark')
    
    // Change font size
    await page.getByTestId('font-size-input').fill('16')
    
    // Save settings
    await page.getByTestId('save-settings-button').click()
    
    // Should show success notification
    await expect(page.getByTestId('success-notification')).toBeVisible()
    await expect(page.getByText('設定を保存しました')).toBeVisible()
  })

  test('should change window settings', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to window tab
    await page.getByTestId('settings-tab-window').click()
    
    // Change window size
    await page.getByTestId('window-width-input').fill('1400')
    await page.getByTestId('window-height-input').fill('900')
    
    // Toggle remember position
    await page.getByTestId('remember-position-checkbox').click()
    
    // Save settings
    await page.getByTestId('save-settings-button').click()
    
    // Should show success notification
    await expect(page.getByTestId('success-notification')).toBeVisible()
  })

  test('should customize keyboard shortcuts', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to keyboard tab
    await page.getByTestId('settings-tab-keyboard').click()
    
    // Change send message shortcut
    await page.getByTestId('shortcut-send-message').click()
    await page.keyboard.press('Control+Enter')
    
    // Should update the shortcut display
    await expect(page.getByTestId('shortcut-send-message')).toHaveText('Ctrl+Enter')
    
    // Save settings
    await page.getByTestId('save-settings-button').click()
    
    // Should show success notification
    await expect(page.getByTestId('success-notification')).toBeVisible()
  })

  test('should reset settings to defaults', async ({ page }) => {
    await page.goto('/settings')
    
    // Make some changes first
    await page.getByTestId('settings-tab-appearance').click()
    await page.getByTestId('theme-select').selectOption('dark')
    await page.getByTestId('save-settings-button').click()
    
    // Reset settings
    await page.getByTestId('reset-settings-button').click()
    
    // Confirm reset
    await page.getByTestId('confirm-reset-button').click()
    
    // Should show success notification
    await expect(page.getByTestId('success-notification')).toBeVisible()
    await expect(page.getByText('設定をリセットしました')).toBeVisible()
    
    // Theme should be back to system
    await expect(page.getByTestId('theme-select')).toHaveValue('system')
  })

  test('should handle settings save errors', async ({ page }) => {
    // Mock error response
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'save_settings') {
          throw new Error('Failed to save settings')
        }
        return null
      }
    })
    
    await page.goto('/settings')
    
    // Try to save settings
    await page.getByTestId('save-settings-button').click()
    
    // Should show error notification
    await expect(page.getByTestId('error-notification')).toBeVisible()
    await expect(page.getByText('設定の保存に失敗しました')).toBeVisible()
  })

  test('should validate input values', async ({ page }) => {
    await page.goto('/settings')
    
    // Go to window tab
    await page.getByTestId('settings-tab-window').click()
    
    // Enter invalid window size
    await page.getByTestId('window-width-input').fill('0')
    await page.getByTestId('window-height-input').fill('-100')
    
    // Try to save
    await page.getByTestId('save-settings-button').click()
    
    // Should show validation errors
    await expect(page.getByTestId('validation-error')).toBeVisible()
    await expect(page.getByText('無効な値です')).toBeVisible()
  })

  test('should show current settings values', async ({ page }) => {
    await page.goto('/settings')
    
    // Should show current theme
    await page.getByTestId('settings-tab-appearance').click()
    await expect(page.getByTestId('theme-select')).toHaveValue('system')
    
    // Should show current window size
    await page.getByTestId('settings-tab-window').click()
    await expect(page.getByTestId('window-width-input')).toHaveValue('1200')
    await expect(page.getByTestId('window-height-input')).toHaveValue('800')
    
    // Should show current shortcuts
    await page.getByTestId('settings-tab-keyboard').click()
    await expect(page.getByTestId('shortcut-send-message')).toHaveText('Enter')
  })
})