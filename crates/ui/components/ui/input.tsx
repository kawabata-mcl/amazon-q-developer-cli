'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          // Default border and focus styles
          "border-gray-300 focus-visible:ring-blue-500 dark:border-gray-600 dark:focus-visible:ring-blue-400",
          // Error styles
          error && "border-red-500 focus-visible:ring-red-500 dark:border-red-400 dark:focus-visible:ring-red-400",
          // Dark mode text
          "dark:text-gray-100 dark:placeholder:text-gray-400",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }