/**
 * NotificationToast component for displaying notifications
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/stores/notification-store';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  className?: string;
}

export function NotificationToast({
  notification,
  onDismiss,
  onMarkAsRead,
  className
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animation states
  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.isDismissed) {
      setIsExiting(true);
    }
  }, [notification.isDismissed]);

  // Mark as read when notification becomes visible
  useEffect(() => {
    if (isVisible && !notification.isRead) {
      const timer = setTimeout(() => {
        onMarkAsRead(notification.id);
      }, 1000); // Mark as read after 1 second of being visible
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, notification.isRead, notification.id, onMarkAsRead]);

  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  const handleActionClick = (action: () => void) => {
    action();
    handleDismiss();
  };

  // Get icon and colors based on notification type
  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          titleColor: 'text-green-800 dark:text-green-200'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          titleColor: 'text-red-800 dark:text-red-200'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          titleColor: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
          titleColor: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  const styles = getNotificationStyles();
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        'notification-toast',
        'relative w-full max-w-sm mx-auto',
        'transform transition-all duration-300 ease-in-out',
        'border rounded-lg shadow-lg',
        styles.bgColor,
        styles.borderColor,
        {
          'translate-x-full opacity-0': !isVisible,
          'translate-x-0 opacity-100': isVisible && !isExiting,
          'translate-x-full opacity-0': isExiting
        },
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={cn('h-5 w-5', styles.iconColor)} />
          </div>
          
          {/* Content */}
          <div className="ml-3 flex-1">
            <h4 className={cn('text-sm font-medium', styles.titleColor)}>
              {notification.title}
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
            
            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action.action)}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md',
                      'transition-colors duration-200',
                      {
                        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700':
                          action.variant === 'secondary' || !action.variant,
                        'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600':
                          action.variant === 'primary',
                        'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600':
                          action.variant === 'destructive'
                      }
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </p>
          </div>
          
          {/* Dismiss button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="通知を閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for timed notifications */}
      {notification.duration && notification.duration > 0 && (
        <NotificationProgressBar
          duration={notification.duration}
          isActive={isVisible && !isExiting}
          type={notification.type}
        />
      )}
    </div>
  );
}

// Progress bar component for timed notifications
interface NotificationProgressBarProps {
  duration: number;
  isActive: boolean;
  type: Notification['type'];
}

function NotificationProgressBar({ duration, isActive, type }: NotificationProgressBarProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isActive) return;

    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isActive]);

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
      <div
        className={cn(
          'h-full transition-all duration-75 ease-linear',
          getProgressColor()
        )}
        style={{ width: `${progress}%` }}
      />
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