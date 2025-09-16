'use client'

import { useMemo } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { InlineCode } from '@/components/ui/inline-code'
import { extractCodeBlocks, extractInlineCode, formatCode, detectLanguage } from '@/lib/code-utils'
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
  const contentParts = useMemo(() => {
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
        const textContent = content.slice(currentIndex, element.startIndex)
        if (textContent.trim()) {
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
      const textContent = content.slice(currentIndex)
      if (textContent.trim()) {
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
  }, [content])

  const renderTextContent = (text: string) => {
    // Handle inline code within text
    const inlineCodeMatches = extractInlineCode(text)
    
    if (inlineCodeMatches.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>
    }
    
    const textParts: React.ReactNode[] = []
    let currentIndex = 0
    
    inlineCodeMatches.forEach((match, index) => {
      // Add text before inline code
      if (currentIndex < match.startIndex) {
        const beforeText = text.slice(currentIndex, match.startIndex)
        textParts.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {beforeText}
          </span>
        )
      }
      
      // Add inline code
      textParts.push(
        <InlineCode key={`code-${index}`}>
          {match.code}
        </InlineCode>
      )
      
      currentIndex = match.endIndex
    })
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      textParts.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {remainingText}
        </span>
      )
    }
    
    return <>{textParts}</>
  }

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
              <InlineCode key={part.index}>
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