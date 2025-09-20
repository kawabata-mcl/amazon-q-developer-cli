'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { StatusBar } from "./status-bar"

export interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  connectionStatus?: 'connected' | 'disconnected' | 'connecting'
  onNewChat?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
  className?: string
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  connectionStatus,
  onNewChat,
  onSettingsClick,
  onLogoutClick,
  className
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className={cn("flex h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        onNewChat={onNewChat}
        onSettingsClick={onSettingsClick}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={title}
          onMenuToggle={handleMenuToggle}
          onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Status bar */}
        <StatusBar
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  )
}

export { MainLayout }