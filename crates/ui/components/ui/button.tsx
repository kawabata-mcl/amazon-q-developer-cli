'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          // Variant styles
          {
            'bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800': variant === 'default',
            'bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800': variant === 'destructive',
            'border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700': variant === 'outline',
            'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600': variant === 'secondary',
            'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700': variant === 'ghost',
            'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400': variant === 'link',
          },
          // Size styles
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }