'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { Menu, Settings, User, MessageSquare, LogOut } from "lucide-react"

export interface HeaderProps {
  title?: string
  onMenuToggle?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
  className?: string
}

const Header: React.FC<HeaderProps> = ({
  title = "Amazon Q",
  onMenuToggle,
  onSettingsClick,
  onLogoutClick,
  className
}) => {

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-950",
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        
        {onSettingsClick && (
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Settings
            </span>
          </div>
        )}
        
        {onLogoutClick && (
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogoutClick}
              aria-label="Logout"
              data-testid="header-logout-button"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Sign out
            </span>
          </div>
        )}
        
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            aria-label="User profile"
            title="User profile"
          >
            <User className="h-5 w-5" />
          </Button>
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            User profile
          </span>
        </div>
      </div>
    </header>
  )
}

export { Header }