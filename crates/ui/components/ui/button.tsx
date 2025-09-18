'use client'

import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, onClick, asChild, children, ...props }, ref) => {
    const commonClassName = cn(
      // Base styles
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      // Variant styles
      {
        'bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800': variant === 'default' || variant === 'primary',
        'bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800': variant === 'destructive',
        'border border-gray-300 bg-transparent text-gray-900 shadow-sm hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-700': variant === 'outline',
        'bg-gray-200 text-gray-900': variant === 'secondary',
        'bg-transparent hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700': variant === 'ghost',
        'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400': variant === 'link',
      },
      // Size styles
      {
        'h-10 px-4': size === 'default',
        'h-8 rounded-md px-3 text-sm': size === 'sm',
        'h-12 rounded-md px-6 text-lg': size === 'lg',
        'h-10 w-10': size === 'icon',
      },
      loading && 'opacity-50 pointer-events-none',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
      if (loading || disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        // Synthesize click for keyboard interactions
        onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; onClick?: React.MouseEventHandler; children?: React.ReactNode }>;
      return React.cloneElement(child, {
        className: cn(child.props.className, commonClassName),
        onClick: (e: React.MouseEvent) => {
          if (loading || disabled) return;
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        },
        children: (
          <>
            {loading && <Spinner className="mr-2" size="sm" />}
            {child.props.children}
          </>
        ),
      });
    }

    return (
      <button
        className={cn(
          commonClassName
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={(e) => {
          if (loading || disabled) return;
          onClick?.(e);
        }}
        onKeyDown={onKeyDown}
        {...props}
      >
        {loading && <Spinner className="mr-2" size="sm" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }