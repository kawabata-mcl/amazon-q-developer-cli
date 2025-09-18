/**
 * NotificationPanel component for viewing and managing all notifications
 */

'use client';

import React, { useState } from 'react';
import { X, Check, Trash2, Bell, BellOff } from 'lucide-react';
import { useNotificationStore, type Notification } from '@/stores/notification-store';

import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationPanel({ isOpen, onClose, className }: NotificationPanelProps) {
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    clearAll
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const unreadCount = getUnreadCount();
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead && !n.isDismissed)
    : notifications.filter(n => !n.isDismissed);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDismissAll = () => {
    dismissAll();
  };

  const handleClearAll = () => {
    clearAll();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className={cn(
          'notification-panel',
          'fixed right-0 top-0 h-full w-96 max-w-full',
          'bg-white dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-700',
          'shadow-xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              通知
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="パネルを閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            すべて ({notifications.filter(n => !n.isDismissed).length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            未読 ({unreadCount})
          </button>
        </div>

        {/* Actions */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <Check className="h-3 w-3 mr-1" />
                  すべて既読
                </button>
              )}
              
              <button
                onClick={handleDismissAll}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                <BellOff className="h-3 w-3 mr-1" />
                すべて非表示
              </button>
            </div>
            
            <button
              onClick={handleClearAll}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              すべて削除
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">
                {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotifications.map((notification) => (
                <NotificationPanelItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Individual notification item in the panel
interface NotificationPanelItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationPanelItem({
  notification,
  onMarkAsRead,
  onDismiss
}: NotificationPanelItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'notification-panel-item',
        'relative p-3 border-l-4 rounded-r-lg cursor-pointer',
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
        'border border-gray-200 dark:border-gray-600',
        'transition-colors duration-200',
        getTypeColor(),
        {
          'bg-blue-50 dark:bg-blue-950': !notification.isRead,
          'opacity-75': notification.isRead
        }
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={cn(
              'text-sm font-medium truncate',
              notification.isRead 
                ? 'text-gray-700 dark:text-gray-300' 
                : 'text-gray-900 dark:text-gray-100'
            )}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {formatTimestamp(notification.timestamp)}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="通知を削除"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Actions */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="mt-3 flex space-x-2">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.action();
                onDismiss(notification.id);
              }}
              className={cn(
                'inline-flex items-center px-2 py-1 text-xs font-medium rounded',
                'transition-colors duration-200',
                {
                  'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600':
                    action.variant === 'secondary' || !action.variant,
                  'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800':
                    action.variant === 'primary',
                  'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800':
                    action.variant === 'destructive'
                }
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to format timestamp
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  if (diff < 60000) { // Less than 1 minute
    return 'たった今';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分前`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}時間前`;
  } else {
    return timestamp.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}