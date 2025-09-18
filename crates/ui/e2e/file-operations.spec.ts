import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('File Operations', () => {
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
              case 'add_file_context':
                return {
                  id: 'file-' + Date.now(),
                  name: args.fileName,
                  content: args.content,
                  size: args.content.length
                }
              case 'remove_file_context':
                return true
              case 'get_file_contexts':
                return []
              default:
                return null
            }
          }
        }
      }
    })
  })

  test('should display file drop zone', async ({ page }) => {
    await page.goto('/chat')
    
    // Should show file drop zone
    await expect(page.getByTestId('file-drop-zone')).toBeVisible()
    await expect(page.getByText('ファイルをドラッグ&ドロップしてください')).toBeVisible()
  })

  test('should handle file drag and drop', async ({ page }) => {
    await page.goto('/chat')
    
    const dropZone = page.getByTestId('file-drop-zone')
    
    // Create a test file
    const fileContent = 'console.log("Hello, World!");'
    const fileName = 'test.js'
    
    // Simulate file drop
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
    }, { fileName, fileContent })
    
    // Should show file in context
    await expect(page.getByTestId('file-context-item')).toBeVisible()
    await expect(page.getByText(fileName)).toBeVisible()
  })

  test('should display file context manager', async ({ page }) => {
    // Mock existing file contexts
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'get_file_contexts') {
          return [
            {
              id: 'file-1',
              name: 'example.js',
              content: 'console.log("test");',
              size: 20
            },
            {
              id: 'file-2',
              name: 'README.md',
              content: '# Test Project',
              size: 15
            }
          ]
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    // Should show file context manager
    await expect(page.getByTestId('file-context-manager')).toBeVisible()
    
    // Should show file items
    await expect(page.getByTestId('file-context-item').filter({ hasText: 'example.js' })).toBeVisible()
    await expect(page.getByTestId('file-context-item').filter({ hasText: 'README.md' })).toBeVisible()
  })

  test('should handle file removal', async ({ page }) => {
    // Mock existing file contexts
    await page.addInitScript(() => {
      let files = [
        {
          id: 'file-1',
          name: 'example.js',
          content: 'console.log("test");',
          size: 20
        }
      ]
      
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string, args?: any) => {
        if (command === 'get_file_contexts') {
          return files
        }
        if (command === 'remove_file_context') {
          files = files.filter(f => f.id !== args.fileId)
          return true
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    // Should show file item
    await expect(page.getByTestId('file-context-item').filter({ hasText: 'example.js' })).toBeVisible()
    
    // Click remove button
    await page.getByTestId('remove-file-button').first().click()
    
    // File should be removed
    await expect(page.getByTestId('file-context-item').filter({ hasText: 'example.js' })).not.toBeVisible()
  })

  test('should handle file viewing', async ({ page }) => {
    // Mock existing file contexts
    await page.addInitScript(() => {
      // @ts-ignore
      window.__TAURI__.tauri.invoke = async (command: string) => {
        if (command === 'get_file_contexts') {
          return [
            {
              id: 'file-1',
              name: 'example.js',
              content: 'console.log("Hello, World!");',
              size: 30
            }
          ]
        }
        return null
      }
    })
    
    await page.goto('/chat')
    
    // Click on file to view
    await page.getByTestId('file-context-item').filter({ hasText: 'example.js' }).click()
    
    // Should open file viewer
    await expect(page.getByTestId('file-viewer')).toBeVisible()
    await expect(page.getByText('console.log("Hello, World!");')).toBeVisible()
  })

  test('should handle multiple file types', async ({ page }) => {
    await page.goto('/chat')
    
    const dropZone = page.getByTestId('file-drop-zone')
    
    // Test different file types
    const files = [
      { name: 'script.js', content: 'console.log("test");', type: 'text/javascript' },
      { name: 'style.css', content: 'body { margin: 0; }', type: 'text/css' },
      { name: 'README.md', content: '# Project', type: 'text/markdown' },
      { name: 'data.json', content: '{"key": "value"}', type: 'application/json' }
    ]
    
    for (const file of files) {
      await page.evaluate(({ fileName, fileContent, fileType }) => {
        const dropZone = document.querySelector('[data-testid="file-drop-zone"]') as HTMLElement
        const file = new File([fileContent], fileName, { type: fileType })
        
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
        
        dropZone.dispatchEvent(dropEvent)
      }, { fileName: file.name, fileContent: file.content, fileType: file.type })
      
      // Should show file in context
      await expect(page.getByText(file.name)).toBeVisible()
    }
  })

  test('should handle file size limits', async ({ page }) => {
    await page.goto('/chat')
    
    const dropZone = page.getByTestId('file-drop-zone')
    
    // Create a large file (simulate)
    const largeContent = 'x'.repeat(10 * 1024 * 1024) // 10MB
    const fileName = 'large-file.txt'
    
    await page.evaluate(({ fileName, fileContent }) => {
      const dropZone = document.querySelector('[data-testid="file-drop-zone"]') as HTMLElement
      const file = new File([fileContent], fileName, { type: 'text/plain' })
      
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      })
      
      dropZone.dispatchEvent(dropEvent)
    }, { fileName, fileContent: largeContent })
    
    // Should show error for large file
    await expect(page.getByTestId('error-notification')).toBeVisible()
    await expect(page.getByText('ファイルサイズが大きすぎます')).toBeVisible()
  })
})