import '@testing-library/jest-dom'
import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CodeBlock } from '@/components/ui/code-block'

// Mock Prism core used by dynamic import in CodeBlock
jest.mock('prismjs', () => ({
  __esModule: true,
  default: {
    languages: { javascript: {} },
    highlight: (code: string) => `<mark>${code}</mark>`,
  },
}))

// Mock all Prism component dynamic imports as no-ops
jest.mock('prismjs/components/prism-javascript', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-typescript', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-jsx', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-tsx', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-python', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-rust', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-java', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-cpp', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-c', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-csharp', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-go', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-php', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-ruby', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-swift', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-kotlin', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-scala', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-bash', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-shell-session', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-json', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-yaml', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-toml', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-sql', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-css', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-scss', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-html', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-xml', () => ({}), { virtual: true })
jest.mock('prismjs/components/prism-markdown', () => ({}), { virtual: true })

beforeEach(() => {
  // Mock clipboard API per test
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  })
})

describe('CodeBlock', () => {
  test('コード要素が言語クラス付きで描画され、内容が表示される', async () => {
    render(<CodeBlock code={'const x = 1;'} language="javascript" />)

    await waitFor(() => screen.getByText('Copy'))
    const codeNode = document.querySelector('code.language-javascript') as HTMLElement
    expect(codeNode).toBeTruthy()
    await waitFor(() => expect(codeNode.innerHTML).toContain('const x = 1;'))
  })

  test('コピー操作でラベルがCopiedに変わる', async () => {
    render(<CodeBlock code={'console.log(1)'} language="javascript" />)

    const copyBtn = await screen.findByTitle('Copy code')
    fireEvent.click(copyBtn)

    expect((navigator.clipboard as any).writeText).toHaveBeenCalledWith('console.log(1)')
    await waitFor(() => expect(screen.getByText('Copied')).toBeInTheDocument())
  })

  test('行番号が表示される', async () => {
    const code = 'a\nb\nc'
    render(<CodeBlock code={code} language="javascript" showLineNumbers />)

    // wait for render
    await screen.findByText('Copy')

    const lineNumbersContainer = document.querySelector('div.absolute.left-0.top-12') as HTMLElement
    expect(lineNumbersContainer).toBeTruthy()
    const lines = Array.from(lineNumbersContainer.querySelectorAll('div'))
    expect(lines.length).toBe(3)
    expect(lines[0].textContent).toBe('1')
    expect(lines[1].textContent).toBe('2')
    expect(lines[2].textContent).toBe('3')
  })
})


