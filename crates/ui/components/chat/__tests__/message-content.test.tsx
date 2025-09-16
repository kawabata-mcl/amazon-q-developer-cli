import '@testing-library/jest-dom'
import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { MessageContent } from '@/components/chat/message-content'

// Mock Prism core used by dynamic import in CodeBlock
jest.mock('prismjs', () => ({
  __esModule: true,
  default: {
    languages: { javascript: {}, typescript: {} },
    highlight: (code: string) => `<mark>${code}</mark>`,
  },
}))

beforeEach(() => {
  // Mock clipboard API per test (used by CodeBlock copy button)
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  })
})

describe('MessageContent', () => {
  test('テキストのみをレンダリングする', () => {
    render(<MessageContent content={'こんにちは'} />)
    expect(screen.getByText('こんにちは')).toBeInTheDocument()
  })

  test('インラインコードをレンダリングする', () => {
    render(<MessageContent content={'コマンドは `npm i` を使用'} />)
    // InlineCode は <code> 要素で描画される
    const codeInline = screen.getByText('npm i')
    expect(codeInline.tagName.toLowerCase()).toBe('code')
  })

  test('コードブロックを言語付きでレンダリングする', async () => {
    const md = '```ts\nconst x: number = 1;\n```'
    render(<MessageContent content={md} />)

    // CodeBlock のレンダリング完了（コピーUIが現れる）を待つ
    await waitFor(() => screen.getByText('Copy'))

    // CodeBlock 内の <code> クラスで言語が正規化されていること
    const codeNode = document.querySelector('code.language-typescript') as HTMLElement
    expect(codeNode).toBeTruthy()
    await waitFor(() => expect(codeNode.innerHTML).toContain('const x: number = 1;'))
  })

  test('11行以上で行番号が表示される', async () => {
    const lines = Array.from({ length: 11 }, (_, i) => `l${i + 1}`).join('\n')
    const md = '```javascript\n' + lines + '\n```'
    render(<MessageContent content={md} />)

    await waitFor(() => screen.getByText('Copy'))
    const lineNumbersContainer = document.querySelector('div.absolute.left-0.top-12') as HTMLElement
    expect(lineNumbersContainer).toBeTruthy()
  })
})


