'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { HTMLAttributes, ReactNode } from 'react'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './code-block'
import { InlineCode } from './inline-code'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Sanitize and process markdown content
  const processedContent = useMemo(() => {
    // Basic sanitization - remove potentially dangerous HTML
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
  }, [content])

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ inline, className, children, ...props }: HTMLAttributes<HTMLElement> & { inline?: boolean; children?: ReactNode }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : undefined
            
            if (inline) {
              return (
                <InlineCode {...props}>
                  {String(children).replace(/\n$/, '')}
                </InlineCode>
              )
            }
            
            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={language}
                showLineNumbers={String(children).split('\n').length > 10}
              />
            )
          },
          
          // Links - open external links in new tab
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http') || href?.startsWith('https')
            
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                {...props}
              >
                {children}
              </a>
            )
          },
          
          // Images - handle with proper loading and error states
          img({ src, alt, ...props }) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || 'Image'}
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  // Show alt text or placeholder
                  const placeholder = document.createElement('div')
                  placeholder.className = 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400'
                  placeholder.textContent = alt || 'Failed to load image'
                  target.parentNode?.insertBefore(placeholder, target)
                }}
                {...props}
              />
            )
          },
          
          // Tables
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props}>
                  {children}
                </table>
              </div>
            )
          },
          
          thead({ children, ...props }) {
            return (
              <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
                {children}
              </thead>
            )
          },
          
          th({ children, ...props }) {
            return (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props}>
                {children}
              </th>
            )
          },
          
          td({ children, ...props }) {
            return (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700" {...props}>
                {children}
              </td>
            )
          },
          
          // Blockquotes
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r-lg" {...props}>
                {children}
              </blockquote>
            )
          },
          
          // Lists
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 ml-4" {...props}>
                {children}
              </ul>
            )
          },
          
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 ml-4" {...props}>
                {children}
              </ol>
            )
          },
          
          li({ children, ...props }) {
            return (
              <li className="text-sm leading-relaxed" {...props}>
                {children}
              </li>
            )
          },
          
          // Headings
          h1({ children, ...props }) {
            return (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6 first:mt-0" {...props}>
                {children}
              </h1>
            )
          },
          
          h2({ children, ...props }) {
            return (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5 first:mt-0" {...props}>
                {children}
              </h2>
            )
          },
          
          h3({ children, ...props }) {
            return (
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4 first:mt-0" {...props}>
                {children}
              </h3>
            )
          },
          
          h4({ children, ...props }) {
            return (
              <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 mt-3 first:mt-0" {...props}>
                {children}
              </h4>
            )
          },
          
          h5({ children, ...props }) {
            return (
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 mt-2 first:mt-0" {...props}>
                {children}
              </h5>
            )
          },
          
          h6({ children, ...props }) {
            return (
              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2 first:mt-0" {...props}>
                {children}
              </h6>
            )
          },
          
          // Paragraphs
          p({ children, ...props }) {
            return (
              <p className="text-sm leading-relaxed mb-4 last:mb-0" {...props}>
                {children}
              </p>
            )
          },
          
          // Horizontal rules
          hr({ ...props }) {
            return (
              <hr className="border-gray-200 dark:border-gray-700 my-6" {...props} />
            )
          },
          
          // Task lists (GitHub Flavored Markdown)
          input({ type, checked, ...props }) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 rounded border-gray-300 dark:border-gray-600"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}