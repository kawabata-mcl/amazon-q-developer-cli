'use client'

import { cn } from '@/lib/utils'

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
  showBackticks?: boolean
}

export function InlineCode({ children, className, showBackticks = false }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'relative rounded bg-gray-100 dark:bg-gray-800 px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium',
        'text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
        showBackticks && 'before:content-["`"] after:content-["`"]',
        showBackticks && 'before:text-gray-500 after:text-gray-500',
        className
      )}
    >
      {children}
    </code>
  )
}