'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  showLineNumbers?: boolean
}

export function CodeBlock({ 
  code, 
  language = 'text', 
  className,
  showLineNumbers = false 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>('')

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const loadPrism = async () => {
      try {
        const Prism = (await import('prismjs')).default
        
        // Load common language components
        await import('prismjs/components/prism-javascript')
        await import('prismjs/components/prism-typescript')
        await import('prismjs/components/prism-jsx')
        await import('prismjs/components/prism-tsx')
        await import('prismjs/components/prism-python')
        await import('prismjs/components/prism-rust')
        await import('prismjs/components/prism-java')
        await import('prismjs/components/prism-cpp')
        await import('prismjs/components/prism-c')
        await import('prismjs/components/prism-csharp')
        await import('prismjs/components/prism-go')
        await import('prismjs/components/prism-php')
        await import('prismjs/components/prism-ruby')
        await import('prismjs/components/prism-swift')
        await import('prismjs/components/prism-kotlin')
        await import('prismjs/components/prism-scala')
        await import('prismjs/components/prism-bash')
        await import('prismjs/components/prism-shell-session')
        await import('prismjs/components/prism-json')
        await import('prismjs/components/prism-yaml')
        await import('prismjs/components/prism-toml')
        await import('prismjs/components/prism-sql')
        await import('prismjs/components/prism-css')
        await import('prismjs/components/prism-scss')
        await import('prismjs/components/prism-markup')
        await import('prismjs/components/prism-markup-templating')
        await import('prismjs/components/prism-markdown')

        // Normalize language name
        const normalizedLang = normalizeLanguage(language)
        
        if (Prism.languages[normalizedLang]) {
          const highlighted = Prism.highlight(
            code,
            Prism.languages[normalizedLang],
            normalizedLang
          )
          setHighlightedCode(highlighted)
        } else {
          // Fallback to plain text
          setHighlightedCode(escapeHtml(code))
        }
      } catch (error) {
        console.error('Failed to load Prism.js:', error)
        setHighlightedCode(escapeHtml(code))
      }
    }

    loadPrism()
  }, [code, language])

  const normalizeLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'htm': 'html',
      'xml': 'markup',
      'md': 'markdown',
      'cs': 'csharp',
      'cpp': 'cpp',
      'c++': 'cpp',
      'kt': 'kotlin',
    }
    
    return langMap[lang.toLowerCase()] || lang.toLowerCase()
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const lines = code.split('\n')

  return (
    <div className={cn(
      'relative group rounded-lg border bg-muted/50 overflow-hidden',
      className
    )}>
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted/50 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm">
          <code 
            className={`language-${normalizeLanguage(language)} block`}
            dangerouslySetInnerHTML={{ 
              __html: highlightedCode || escapeHtml(code) 
            }}
          />
        </pre>
      </div>

      {/* Line numbers (optional) */}
      {showLineNumbers && (
        <div className="absolute left-0 top-12 bottom-0 w-12 bg-muted/20 border-r flex flex-col text-xs text-muted-foreground">
          {lines.map((_, index) => (
            <div
              key={index}
              className="px-2 py-0 text-right leading-5 select-none"
            >
              {index + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}