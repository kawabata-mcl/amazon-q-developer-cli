'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { Menu, Settings, User, MessageSquare } from "lucide-react"
import { NotificationBell } from "@/components/ui/notification-container"
import { NotificationPanel } from "@/components/ui/notification-panel"

export interface HeaderProps {
  title?: string
  onMenuToggle?: () => void
  onSettingsClick?: () => void
  className?: string
}

const Header: React.FC<HeaderProps> = ({
  title = "Amazon Q",
  onMenuToggle,
  onSettingsClick,
  className
}) => {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false);

  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(true);
  };

  const handleNotificationPanelClose = () => {
    setIsNotificationPanelOpen(false);
  };

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
        <NotificationBell 
          onClick={handleNotificationClick}
          className="p-2"
        />
        
        {onSettingsClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          aria-label="User profile"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={handleNotificationPanelClose}
      />
    </header>
  )
}

export { Header }