'use client'

import * as React from "react"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { ConversationList } from "@/components/chat/conversation-list"
import { useChat } from "@/hooks/use-chat"
import { 
  Plus
} from "lucide-react"

export interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onNewChat?: () => void
  onSettingsClick?: () => void
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  onNewChat,
  className
}) => {
  
  const {
    conversations,
    currentConversation,
    loadConversation,
    deleteConversation,
    renameConversation,
    refreshHistory,
    startNewConversation,
    isLoading,
  } = useChat();

  // Load conversation history on mount
  useEffect(() => {
    refreshHistory().catch(console.error);
  }, [refreshHistory]);

  const handleNewChat = async () => {
    try {
      await startNewConversation();
      onNewChat?.();
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      await loadConversation(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleConversationDelete = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleConversationRename = async (conversationId: string, newTitle: string) => {
    try {
      await renameConversation(conversationId, newTitle);
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

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
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-3.5rem)] flex-col">
          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2"
              variant="outline"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversation?.id}
              onConversationSelect={handleConversationSelect}
              onConversationDelete={handleConversationDelete}
              onConversationRename={handleConversationRename}
            />
          </div>

        </div>
      </aside>

    </>
  )
}

export { Sidebar }