/**
 * NotificationContainer component for managing and displaying all notifications
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationToast } from './notification-toast';
import { cn } from '@/lib/utils';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export function NotificationContainer({
  position = 'top-right',
  className
}: NotificationContainerProps) {
  const {
    notifications,
    dismissNotification,
    markAsRead,
    getActiveNotifications
  } = useNotificationStore();

  const activeNotifications = getActiveNotifications();

  // Don't render if no notifications
  if (activeNotifications.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const containerContent = (
    <div
      className={cn(
        'notification-container',
        'fixed z-50 pointer-events-none',
        'max-w-sm w-full',
        getPositionClasses(),
        className
      )}
      role="region"
      aria-label="Notifications"
    >
      <div className="space-y-3">
        {activeNotifications.map((notification) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
          >
            <NotificationToast
              notification={notification}
              onDismiss={dismissNotification}
              onMarkAsRead={markAsRead}
            />
          </div>
        ))}
      </div>
    </div>
  );

  // Use portal to render notifications at the document body level
  if (typeof document !== 'undefined') {
    return createPortal(containerContent, document.body);
  }

  return null;
}

// Hook for managing notification container
export function useNotificationContainer() {
  const {
    notifications,
    getUnreadCount,
    getActiveNotifications,
    dismissAll,
    markAllAsRead,
    clearAll
  } = useNotificationStore();

  return {
    notifications,
    activeNotifications: getActiveNotifications(),
    unreadCount: getUnreadCount(),
    hasActiveNotifications: getActiveNotifications().length > 0,
    dismissAll,
    markAllAsRead,
    clearAll
  };
}

// Notification badge component for showing unread count
interface NotificationBadgeProps {
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ className, showZero = false }: NotificationBadgeProps) {
  const unreadCount = useNotificationStore(state => state.getUnreadCount());

  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'notification-badge',
        'inline-flex items-center justify-center',
        'min-w-[1.25rem] h-5 px-1',
        'text-xs font-medium text-white',
        'bg-red-500 rounded-full',
        'ring-2 ring-white dark:ring-gray-900',
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

// Notification bell icon component
interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
}

export function NotificationBell({ onClick, className, showBadge = true }: NotificationBellProps) {
  const unreadCount = useNotificationStore(state => state.getUnreadCount());
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'notification-bell',
        'relative p-2 rounded-lg',
        'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      aria-label={`Notifications ${hasUnread ? `(${unreadCount} unread)` : ''}`}
    >
      <svg
        className={cn(
          'w-5 h-5',
          hasUnread && 'animate-pulse'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      
      {showBadge && hasUnread && (
        <NotificationBadge className="absolute -top-1 -right-1" />
      )}
    </button>
  );
}