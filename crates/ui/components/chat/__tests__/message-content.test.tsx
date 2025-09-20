import { render, screen } from '@testing-library/react'
import { MessageContent } from '../message-content'

// Mock the markdown renderer
jest.mock('../../ui/markdown-renderer', () => ({
  MarkdownRenderer: ({ content, className }: { content: string; className?: string }) => (
    <div data-testid="markdown-renderer" className={className}>
      {content}
    </div>
  )
}))

// Mock the code block component
jest.mock('../../ui/code-block', () => ({
  CodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <div data-testid="code-block" data-language={language}>
      {code}
    </div>
  )
}))

// Mock the inline code component
jest.mock('../../ui/inline-code', () => ({
  InlineCode: ({ children, showBackticks }: { children: React.ReactNode; showBackticks?: boolean }) => (
    <code data-testid="inline-code" data-show-backticks={showBackticks}>
      {children}
    </code>
  )
}))

// Mock the markdown utils
jest.mock('../../../lib/markdown-utils', () => ({
  shouldRenderAsMarkdown: jest.fn(),
  processMarkdownContent: jest.fn()
}))

// Mock the code utils
jest.mock('../../../lib/code-utils', () => ({
  extractCodeBlocks: jest.fn(() => []),
  extractInlineCode: jest.fn(() => []),
  formatCode: jest.fn((code) => code),
  detectLanguage: jest.fn(() => undefined)
}))

import { shouldRenderAsMarkdown, processMarkdownContent } from '../../../lib/markdown-utils'

const mockShouldRenderAsMarkdown = shouldRenderAsMarkdown as jest.MockedFunction<typeof shouldRenderAsMarkdown>
const mockProcessMarkdownContent = processMarkdownContent as jest.MockedFunction<typeof processMarkdownContent>

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

describe('MessageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Markdown rendering', () => {
    it('renders content as markdown when markdown syntax is detected', () => {
      const content = '# Hello World\nThis is **bold** text.'
      
      mockShouldRenderAsMarkdown.mockReturnValue(true)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: content,
        hasUnsafeContent: false,
        urls: []
      })

      render(<MessageContent content={content} />)

      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument()
      expect(normalize(screen.getByTestId('markdown-renderer').textContent || '')).toBe(normalize(content))
      expect(screen.getByTestId('markdown-renderer')).toHaveClass('markdown-content')
    })

    it('shows warning when unsafe content is detected', () => {
      const content = '# Header\n<script>alert("xss")</script>'
      
      mockShouldRenderAsMarkdown.mockReturnValue(true)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: '# Header\n',
        hasUnsafeContent: true,
        urls: []
      })

      render(<MessageContent content={content} />)

      expect(screen.getByText(/Some potentially unsafe content was removed/)).toBeInTheDocument()
      expect(screen.getByTestId('markdown-renderer')).toHaveTextContent('# Header')
    })

    it('applies custom className to markdown content', () => {
      const content = '# Test'
      
      mockShouldRenderAsMarkdown.mockReturnValue(true)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: content,
        hasUnsafeContent: false,
        urls: []
      })

      render(<MessageContent content={content} className="custom-class" />)

      const container = screen.getByTestId('markdown-renderer').parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Legacy content rendering', () => {
    beforeEach(() => {
      mockShouldRenderAsMarkdown.mockReturnValue(false)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: '',
        hasUnsafeContent: false,
        urls: []
      })
    })

    it('renders plain text when no markdown syntax is detected', () => {
      const content = 'Just plain text without any markdown.'
      
      render(<MessageContent content={content} />)

      expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument()
      expect(screen.getByText(content)).toBeInTheDocument()
    })

    it('renders code blocks in legacy mode', () => {
      const content = 'Some text with code'
      
      // Mock code extraction to return a code block
      const { extractCodeBlocks } = require('../../../lib/code-utils')
      extractCodeBlocks.mockReturnValue([{
        code: 'console.log("hello")',
        language: 'javascript',
        startIndex: 15,
        endIndex: 40
      }])

      render(<MessageContent content={content} />)

      expect(screen.getByTestId('code-block')).toBeInTheDocument()
      expect(screen.getByTestId('code-block')).toHaveAttribute('data-language', 'javascript')
    })

    it('renders inline code in legacy mode', () => {
      const content = 'Use console.log() to debug'
      
      // Mock inline code extraction
      const { extractInlineCode } = require('../../../lib/code-utils')
      extractInlineCode.mockReturnValue([{ 
        code: 'console.log()',
        startIndex: 4,
        endIndex: 17
      }])

      render(<MessageContent content={content} />)

      const inlineCodes = screen.getAllByTestId('inline-code')
      expect(inlineCodes.length).toBeGreaterThanOrEqual(1)
      // The dedicated InlineCode with backticks should exist
      const withBackticks = inlineCodes.find(el => el.getAttribute('data-show-backticks') === 'true')
      expect(withBackticks).toBeTruthy()
    })

    it('handles mixed text and code content in legacy mode', () => {
      const content = 'Text before code and text after'
      
      const { extractCodeBlocks, extractInlineCode } = require('../../../lib/code-utils')
      extractCodeBlocks.mockReturnValue([])
      extractInlineCode.mockReturnValue([{ 
        code: 'code',
        startIndex: 12,
        endIndex: 16
      }])

      render(<MessageContent content={content} />)

      expect(screen.getByText(/Text before/)).toBeInTheDocument()
      expect(screen.getByText(/text after/)).toBeInTheDocument()
      expect(screen.getByTestId('inline-code')).toHaveTextContent('code')
    })

    it('applies custom className in legacy mode', () => {
      const content = 'Plain text'
      
      const { container } = render(<MessageContent content={content} className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Content processing', () => {
    it('calls markdown detection functions with correct content', () => {
      const content = '# Test content'
      
      mockShouldRenderAsMarkdown.mockReturnValue(false)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: content,
        hasUnsafeContent: false,
        urls: []
      })

      render(<MessageContent content={content} />)

      expect(mockShouldRenderAsMarkdown).toHaveBeenCalledWith(content)
      expect(mockProcessMarkdownContent).toHaveBeenCalledWith(content)
    })

    it('handles empty content gracefully', () => {
      mockShouldRenderAsMarkdown.mockReturnValue(false)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: '',
        hasUnsafeContent: false,
        urls: []
      })

      render(<MessageContent content="" />)

      // Should not crash and should render something
      expect(document.body).toBeInTheDocument()
    })

    it('memoizes content processing', () => {
      const content = '# Test'
      
      mockShouldRenderAsMarkdown.mockReturnValue(true)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: content,
        hasUnsafeContent: false,
        urls: []
      })

      const { rerender } = render(<MessageContent content={content} />)
      
      // Clear mock calls
      mockShouldRenderAsMarkdown.mockClear()
      mockProcessMarkdownContent.mockClear()
      
      // Rerender with same content
      rerender(<MessageContent content={content} />)
      
      // Should not call processing functions again due to memoization
      expect(mockShouldRenderAsMarkdown).not.toHaveBeenCalled()
      expect(mockProcessMarkdownContent).not.toHaveBeenCalled()
    })

    it('reprocesses content when content changes', () => {
      const content1 = '# Test 1'
      const content2 = '# Test 2'
      
      mockShouldRenderAsMarkdown.mockReturnValue(true)
      mockProcessMarkdownContent.mockReturnValue({
        sanitized: content1,
        hasUnsafeContent: false,
        urls: []
      })

      const { rerender } = render(<MessageContent content={content1} />)
      
      // Clear mock calls
      mockShouldRenderAsMarkdown.mockClear()
      mockProcessMarkdownContent.mockClear()
      
      // Rerender with different content
      rerender(<MessageContent content={content2} />)
      
      // Should call processing functions again
      expect(mockShouldRenderAsMarkdown).toHaveBeenCalledWith(content2)
      expect(mockProcessMarkdownContent).toHaveBeenCalledWith(content2)
    })
  })
})