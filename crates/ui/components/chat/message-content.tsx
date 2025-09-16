'use client'

import { useMemo } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { InlineCode } from '@/components/ui/inline-code'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { extractCodeBlocks, extractInlineCode, formatCode, detectLanguage } from '@/lib/code-utils'
import { shouldRenderAsMarkdown, processMarkdownContent } from '@/lib/markdown-utils'
import { cn } from '@/lib/utils'

interface MessageContentProps {
  content: string
  className?: string
}

interface ContentPart {
  type: 'text' | 'code-block' | 'inline-code'
  content: string
  language?: string
  index: number
}

export function MessageContent({ content, className }: MessageContentProps) {
  // Determine rendering strategy
  const renderingStrategy = useMemo(() => {
    const isMarkdown = shouldRenderAsMarkdown(content)
    const processedContent = processMarkdownContent(content)
    
    return {
      isMarkdown,
      processedContent,
      shouldWarnUnsafe: processedContent.hasUnsafeContent
    }
  }, [content])

  const contentParts = useMemo(() => {
    // If content should be rendered as markdown, skip the legacy parsing
    if (renderingStrategy.isMarkdown) {
      return []
    }

    const parts: ContentPart[] = []
    const codeBlocks = extractCodeBlocks(content)
    const inlineCodeBlocks = extractInlineCode(content)
    
    // Combine all code elements and sort by position
    const allCodeElements = [
      ...codeBlocks.map(block => ({
        type: 'code-block' as const,
        startIndex: block.startIndex,
        endIndex: block.endIndex,
        content: block.code,
        language: block.language
      })),
      ...inlineCodeBlocks.map(block => ({
        type: 'inline-code' as const,
        startIndex: block.startIndex,
        endIndex: block.endIndex,
        content: block.code,
        language: undefined
      }))
    ].sort((a, b) => a.startIndex - b.startIndex)
    
    let currentIndex = 0
    let partIndex = 0
    
    for (const element of allCodeElements) {
      // Add text before this code element
      if (currentIndex < element.startIndex) {
        const textContent = content.slice(currentIndex, element.startIndex).trimEnd()
        if (textContent !== '') {
          parts.push({
            type: 'text',
            content: textContent,
            index: partIndex++
          })
        }
      }
      
      // Add the code element
      parts.push({
        type: element.type,
        content: element.content,
        language: element.language || (element.type === 'code-block' ? detectLanguage(element.content) : undefined),
        index: partIndex++
      })
      
      currentIndex = element.endIndex
    }
    
    // Add remaining text
    if (currentIndex < content.length) {
      const textContent = content.slice(currentIndex).trimStart()
      if (textContent !== '') {
        parts.push({
          type: 'text',
          content: textContent,
          index: partIndex++
        })
      }
    }
    
    // If no code blocks found, return the entire content as text
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: content,
        index: 0
      })
    }
    
    return parts
  }, [content, renderingStrategy.isMarkdown])

  const renderTextContent = (text: string) => {
    // Legacy text rendering: do not attempt to re-detect inline code here to avoid duplicates
    return <span className="whitespace-pre-wrap">{text}</span>
  }

  // Render markdown content
  if (renderingStrategy.isMarkdown) {
    return (
      <div className={cn('space-y-4', className)}>
        {renderingStrategy.shouldWarnUnsafe && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Some potentially unsafe content was removed from this message.
              </span>
            </div>
          </div>
        )}
        <MarkdownRenderer 
          content={renderingStrategy.processedContent.sanitized} 
          className="markdown-content"
        />
      </div>
    )
  }

  // Render legacy content parsing for non-markdown content
  return (
    <div className={cn('space-y-4', className)}>
      {contentParts.map((part) => {
        switch (part.type) {
          case 'code-block':
            return (
              <CodeBlock
                key={part.index}
                code={formatCode(part.content)}
                language={part.language}
                showLineNumbers={part.content.split('\n').length > 10}
              />
            )
          
          case 'inline-code':
            return (
              <InlineCode key={part.index} showBackticks>
                {part.content}
              </InlineCode>
            )
          
          case 'text':
          default:
            return (
              <div key={part.index} className="text-sm leading-relaxed">
                {renderTextContent(part.content)}
              </div>
            )
        }
      })}
    </div>
  )
}