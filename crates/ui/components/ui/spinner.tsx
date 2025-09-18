'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'default' | 'sm' | 'md' | 'lg' | 'xl'
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'default', ...props }, ref) => {
    const sizeClass =
      size === 'sm' ? 'h-3 w-3' :
      size === 'md' ? 'h-5 w-5' :
      size === 'lg' ? 'h-6 w-6' :
      size === 'xl' ? 'h-8 w-8' : 'h-4 w-4'

    return (
      <svg
        ref={ref}
        className={cn('animate-spin text-gray-600', sizeClass, className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        data-testid="spinner"
        role="status"
        aria-label={props['aria-label'] || 'Loading'}
        {...props}
      >
        <title>{(props['aria-label'] as string) || 'Loading'}</title>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" opacity="0.75" />
      </svg>
    )
  }
)
Spinner.displayName = "Spinner"

// Loading component with text
export interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Loading: React.FC<LoadingProps> = ({ 
  text = "Loading", 
  size = 'md',
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