'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMacOSIntegration } from '@/hooks/use-macos-integration'
import { 
  FolderOpen, 
  ExternalLink, 
  Copy
} from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  items: ContextMenuItem[]
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick()
      onClose()
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
      style={{
        left: x,
        top: y,
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.separator ? (
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
          ) : (
            <button
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors
                ${item.disabled 
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
            >
              {item.icon && (
                <span className="w-4 h-4 flex-shrink-0">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>,
    document.body
  )
}

// Hook for file context menu
export function useFileContextMenu() {
  const { revealInFinder, openWithDefaultApp } = useMacOSIntegration()
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    filePath: string
  } | null>(null)

  const showContextMenu = (event: React.MouseEvent, filePath: string) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      filePath,
    })
  }

  const hideContextMenu = () => {
    setContextMenu(null)
  }

  const getFileContextMenuItems = (filePath: string): ContextMenuItem[] => [
    {
      id: 'open',
      label: 'Open',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => openWithDefaultApp(filePath),
    },
    {
      id: 'reveal',
      label: 'Reveal in Finder',
      icon: <FolderOpen className="w-4 h-4" />,
      onClick: () => revealInFinder(filePath),
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
      onClick: () => {},
    },
    {
      id: 'copy-path',
      label: 'Copy Path',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => {
        navigator.clipboard.writeText(filePath)
      },
    },
  ]

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    getFileContextMenuItems,
  }
}

// Hook for text context menu
export function useTextContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    selectedText: string
  } | null>(null)

  const showContextMenu = (event: React.MouseEvent, selectedText: string = '') => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      selectedText,
    })
  }

  const hideContextMenu = () => {
    setContextMenu(null)
  }

  const getTextContextMenuItems = (selectedText: string): ContextMenuItem[] => {
    const hasSelection = selectedText.length > 0

    return [
      {
        id: 'copy',
        label: 'Copy',
        icon: <Copy className="w-4 h-4" />,
        onClick: () => {
          if (hasSelection) {
            navigator.clipboard.writeText(selectedText)
          } else {
            document.execCommand('copy')
          }
        },
        disabled: !hasSelection && !document.queryCommandSupported('copy'),
      },
      {
        id: 'select-all',
        label: 'Select All',
        onClick: () => {
          document.execCommand('selectAll')
        },
      },
    ]
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    getTextContextMenuItems,
  }
}