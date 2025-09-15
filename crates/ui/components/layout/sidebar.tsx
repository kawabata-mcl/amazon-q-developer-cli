'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { 
  MessageSquare, 
  Plus, 
  History, 
  Settings, 
  FileText,
  MoreHorizontal
} from "lucide-react"

export interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onNewChat?: () => void
  onSettingsClick?: () => void
  className?: string
}

interface ConversationItem {
  id: string
  title: string
  timestamp: Date
  isActive?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  onNewChat,
  onSettingsClick,
  className
}) => {
  // Mock conversation data - this would come from props or state in real implementation
  const conversations: ConversationItem[] = [
    {
      id: '1',
      title: 'React component help',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isActive: true
    },
    {
      id: '2', 
      title: 'TypeScript error debugging',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '3',
      title: 'API integration questions',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    }
  ]

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 transform border-r bg-white shadow-lg transition-transform duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-950 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversations
          </h2>
          {onNewChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              aria-label="New conversation"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-3.5rem)] flex-col">
          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                    conversation.isActive && "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(conversation.timestamp)}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 dark:border-gray-800">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={onSettingsClick}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }