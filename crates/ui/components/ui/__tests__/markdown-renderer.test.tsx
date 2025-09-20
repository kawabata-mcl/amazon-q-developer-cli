import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '../markdown-renderer'

jest.mock('../code-block', () => ({
  CodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <pre data-testid="code-block" data-language={language}>{code}</pre>
  )
}))

jest.mock('../inline-code', () => ({
  InlineCode: ({ children }: { children: React.ReactNode }) => (
    <code data-testid="inline-code">{children}</code>
  )
}))

describe('MarkdownRenderer', () => {
  it('sanitizes script tags', () => {
    const content = '# Title\n<script>alert("xss")</script>after'
    render(<MarkdownRenderer content={content} />)

    // the script tag content should be removed
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument()
    // the rest should remain
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Title')
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('after')
  })

  it('renders links with target and rel when external', () => {
    const md = '[Google](https://google.com)'
    render(<MarkdownRenderer content={md} />)
    const link = screen.getByRole('link', { name: 'Google' }) as HTMLAnchorElement
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })

  it('renders inline and block code appropriately', () => {
    const md = 'Use `echo`\n\n```js\nconsole.log(1)\n```'
    render(<MarkdownRenderer content={md} />)

    expect(screen.getByTestId('inline-code')).toHaveTextContent('echo')
    expect(screen.getByTestId('code-block')).toHaveTextContent('console.log(1)')
    expect(screen.getByTestId('code-block')).toHaveAttribute('data-language', 'js')
  })
})
