'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400",
          {
            'h-4 w-4': size === 'sm',
            'h-6 w-6': size === 'default',
            'h-8 w-8': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

// Loading component with text
export interface LoadingProps {
  text?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const Loading: React.FC<LoadingProps> = ({ 
  text = "Loading...", 
  size = 'default',
  className 
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Spinner size={size} />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  )
}

export { Spinner, Loading }