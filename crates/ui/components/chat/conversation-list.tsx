'use client'

import * as React from "react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { 
  MessageSquare, 
  Search, 
  MoreHorizontal,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  X
} from "lucide-react"
import type { ChatConversation } from "@/types/chat"

export interface ConversationListProps {
  conversations: ChatConversation[]
  currentConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onConversationDelete: (conversationId: string) => void
  onConversationRename?: (conversationId: string, newTitle: string) => void
  className?: string
}

type SortOption = 'recent' | 'oldest' | 'alphabetical'
type FilterOption = 'all' | 'today' | 'week' | 'month'

export function ConversationList({
  conversations,
  currentConversationId,
  onConversationSelect,
  onConversationDelete,
  onConversationRename,
  className
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(query))
      )
    }

    // Apply date filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (filterBy) {
      case 'today':
        filtered = filtered.filter(conv => conv.updatedAt >= today)
        break
      case 'week':
        filtered = filtered.filter(conv => conv.updatedAt >= weekAgo)
        break
      case 'month':
        filtered = filtered.filter(conv => conv.updatedAt >= monthAgo)
        break
      default:
        // 'all' - no additional filtering
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return filtered
  }, [conversations, searchQuery, sortBy, filterBy])

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays}d ago`
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
      return date.toLocaleDateString()
    }
  }

  const handleEditStart = (conversation: ChatConversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const handleEditSave = () => {
    if (editingId && editTitle.trim() && onConversationRename) {
      onConversationRename(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const getConversationPreview = (conversation: ChatConversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return 'No messages'
    
    const preview = lastMessage.content.replace(/\n/g, ' ').slice(0, 60)
    return preview.length < lastMessage.content.length ? `${preview}...` : preview
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Search and Filter Header */}
      <div className="border-b p-4 space-y-3 dark:border-gray-800">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
              aria-label="clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredAndSortedConversations.length} conversations
          </span>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-2 rounded-lg border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Time period
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-gray-500 dark:text-gray-400">
            {searchQuery || filterBy !== 'all' ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAndSortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
                  currentConversationId === conversation.id && 
                  "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                )}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId((prev) => (prev === conversation.id ? null : prev))}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    
                    <div className="flex-1 overflow-hidden">
                      {editingId === conversation.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave()
                              if (e.key === 'Escape') handleEditCancel()
                            }}
                            className="w-full rounded border bg-white px-2 py-1 text-sm font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={handleEditSave}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "font-medium text-gray-900 dark:text-gray-100",
                            currentConversationId === conversation.id && "border-blue-500"
                          )}>
                            {conversation.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {getConversationPreview(conversation)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatTimestamp(conversation.updatedAt)}
                            <span>•</span>
                            <span>{conversation.messages.length} messages</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                {editingId !== conversation.id && hoveredId === conversation.id && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {onConversationRename && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditStart(conversation)
                          }}
                          title="Rename conversation"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            onConversationDelete(conversation.id)
                          }
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}