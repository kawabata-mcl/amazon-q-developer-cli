'use client';

import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';

interface AuthStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function AuthStatusIndicator({ 
  className = '', 
  showDetails = false 
}: AuthStatusIndicatorProps) {
  const { status, isAuthenticating, user, errorMessage } = useAuth();

  const getStatusIcon = () => {
    if (isAuthenticating || !status) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    switch (status.type) {
      case 'Authenticated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'NotAuthenticated':
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isAuthenticating || !status) {
      return 'Authenticating...';
    }

    switch (status.type) {
      case 'Authenticated':
        return showDetails && user ? `${user.username} (${user.provider})` : 'Authenticated';
      case 'Error':
        return showDetails && errorMessage ? errorMessage : 'Authentication Error';
      case 'NotAuthenticated':
      default:
        return 'Not Authenticated';
    }
  };

  const getStatusColor = () => {
    if (isAuthenticating || !status) {
      return 'text-blue-600 dark:text-blue-400';
    }

    switch (status.type) {
      case 'Authenticated':
        return 'text-green-600 dark:text-green-400';
      case 'Error':
        return 'text-red-600 dark:text-red-400';
      case 'NotAuthenticated':
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}