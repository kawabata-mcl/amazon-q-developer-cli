/**
 * Notification store using Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // 0 means persistent
  actions?: NotificationAction[];
  timestamp: Date;
  isRead?: boolean;
  isDismissed?: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
  defaultDuration: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  clearAll: () => void;
  
  // Getters
  getUnreadCount: () => number;
  getActiveNotifications: () => Notification[];
  getNotificationById: (id: string) => Notification | undefined;
}

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    maxNotifications: 10,
    defaultDuration: 5000,
    
    addNotification: (notification) => {
      const id = generateNotificationId();
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        isRead: false,
        isDismissed: false,
        duration: notification.duration ?? get().defaultDuration
      };
      
      set((state) => {
        const updatedNotifications = [newNotification, ...state.notifications];
        
        // Limit the number of notifications
        if (updatedNotifications.length > state.maxNotifications) {
          updatedNotifications.splice(state.maxNotifications);
        }
        
        return { notifications: updatedNotifications };
      });
      
      // Auto-dismiss notification if duration is set
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          get().dismissNotification(id);
        }, newNotification.duration);
      }
      
      return id;
    },
    
    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },
    
    markAsRead: (id) => {
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
      }));
    },
    
    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }));
    },
    
    dismissNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isDismissed: true } : n
        )
      }));
      
      // Remove dismissed notification after animation
      setTimeout(() => {
        get().removeNotification(id);
      }, 300);
    },
    
    dismissAll: () => {
      const activeNotifications = get().getActiveNotifications();
      activeNotifications.forEach(notification => {
        get().dismissNotification(notification.id);
      });
    },
    
    clearAll: () => {
      set({ notifications: [] });
    },
    
    getUnreadCount: () => {
      return get().notifications.filter(n => !n.isRead && !n.isDismissed).length;
    },
    
    getActiveNotifications: () => {
      return get().notifications.filter(n => !n.isDismissed);
    },
    
    getNotificationById: (id) => {
      return get().notifications.find(n => n.id === id);
    }
  }))
);

// Helper function to generate unique notification IDs
function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convenience functions for common notification types
export const notificationHelpers = {
  success: (title: string, message: string, options?: Partial<Notification>) => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  },
  
  error: (title: string, message: string, options?: Partial<Notification>) => {
    return useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Errors are persistent by default
      ...options
    });
  },
  
  warning: (title: string, message: string, options?: Partial<Notification>) => {
    return useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // Warnings last longer
      ...options
    });
  },
  
  info: (title: string, message: string, options?: Partial<Notification>) => {
    return useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }
};

// Hook for notification actions
export function useNotificationActions() {
  const store = useNotificationStore();
  
  return {
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    dismissNotification: store.dismissNotification,
    dismissAll: store.dismissAll,
    clearAll: store.clearAll,
    success: notificationHelpers.success,
    error: notificationHelpers.error,
    warning: notificationHelpers.warning,
    info: notificationHelpers.info
  };
}