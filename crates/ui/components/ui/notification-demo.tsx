/**
 * Demo component for testing the notification system
 * This component can be used for development and testing purposes
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotificationActions } from '@/stores/notification-store';
import { handleError, ErrorType } from '@/lib/error-handler';

export function NotificationDemo() {
  const {
    success,
    error,
    warning,
    info,
    clearAll
  } = useNotificationActions();

  const handleSuccessNotification = () => {
    success(
      'Success!',
      'Your operation completed successfully.',
      {
        duration: 3000,
        actions: [
          {
            label: 'View Details',
            action: () => console.log('View details clicked'),
            variant: 'primary'
          }
        ]
      }
    );
  };

  const handleErrorNotification = () => {
    error(
      'Error Occurred',
      'Something went wrong while processing your request.',
      {
        actions: [
          {
            label: 'Retry',
            action: () => console.log('Retry clicked'),
            variant: 'primary'
          },
          {
            label: 'Report Issue',
            action: () => console.log('Report issue clicked'),
            variant: 'secondary'
          }
        ]
      }
    );
  };

  const handleWarningNotification = () => {
    warning(
      'Warning',
      'This action may have unintended consequences.',
      {
        duration: 8000,
        actions: [
          {
            label: 'Continue',
            action: () => console.log('Continue clicked'),
            variant: 'destructive'
          },
          {
            label: 'Cancel',
            action: () => console.log('Cancel clicked'),
            variant: 'secondary'
          }
        ]
      }
    );
  };

  const handleInfoNotification = () => {
    info(
      'Information',
      'Here is some useful information for you.',
      {
        duration: 5000
      }
    );
  };

  const handleMultipleNotifications = () => {
    success('First notification', 'This is the first notification');
    setTimeout(() => {
      warning('Second notification', 'This is the second notification');
    }, 500);
    setTimeout(() => {
      info('Third notification', 'This is the third notification');
    }, 1000);
  };

  const handleErrorHandlerTest = () => {
    try {
      // Simulate an error
      throw new Error('This is a test error from the error handler');
    } catch (err) {
      handleError(err, { component: 'notification-demo', action: 'test-error' });
    }
  };

  const handleNetworkErrorTest = () => {
    const networkError = new Error('Network connection failed');
    handleError(networkError, { 
      component: 'notification-demo', 
      action: 'network-test',
      errorType: ErrorType.NETWORK_ERROR 
    });
  };

  const handleAuthErrorTest = () => {
    const authError = new Error('Authentication failed - invalid credentials');
    handleError(authError, { 
      component: 'notification-demo', 
      action: 'auth-test',
      errorType: ErrorType.AUTH_FAILED 
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Notification System Demo
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Basic Notifications
          </h3>
          
          <Button
            onClick={handleSuccessNotification}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Show Success
          </Button>
          
          <Button
            onClick={handleErrorNotification}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Show Error
          </Button>
          
          <Button
            onClick={handleWarningNotification}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Show Warning
          </Button>
          
          <Button
            onClick={handleInfoNotification}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Show Info
          </Button>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Advanced Tests
          </h3>
          
          <Button
            onClick={handleMultipleNotifications}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Multiple Notifications
          </Button>
          
          <Button
            onClick={handleErrorHandlerTest}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            Test Error Handler
          </Button>
          
          <Button
            onClick={handleNetworkErrorTest}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            Network Error Test
          </Button>
          
          <Button
            onClick={handleAuthErrorTest}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Auth Error Test
          </Button>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={clearAll}
          variant="outline"
          className="w-full text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Clear All Notifications
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click the buttons above to test different notification types</li>
          <li>Success notifications auto-dismiss after 3 seconds</li>
          <li>Error notifications are persistent (must be manually dismissed)</li>
          <li>Warning notifications auto-dismiss after 8 seconds</li>
          <li>Info notifications auto-dismiss after 5 seconds</li>
          <li>Click the bell icon in the header to view all notifications</li>
          <li>Use the notification panel to manage notifications</li>
        </ul>
      </div>
    </div>
  );
}