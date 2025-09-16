'use client'

import { cn } from '@/lib/utils'

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        'before:content-["`"] after:content-["`"]',
        'before:text-muted-foreground after:text-muted-foreground',
        className
      )}
    >
      {children}
    </code>
  )
}