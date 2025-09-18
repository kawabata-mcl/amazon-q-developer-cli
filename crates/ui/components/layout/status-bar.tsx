'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { 
  Wifi, 
  WifiOff, 
  Circle, 
  CheckCircle, 
  AlertCircle, 
  XCircle
} from "lucide-react"

export interface StatusBarProps {
  connectionStatus?: 'connected' | 'disconnected' | 'connecting'
  className?: string
}

const StatusBar: React.FC<StatusBarProps> = ({
  connectionStatus = 'connected',
  className
}) => {
  const { status, isAuthenticating, user } = useAuth()

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'connecting':
        return <Circle className="h-4 w-4 animate-pulse text-yellow-600 dark:text-yellow-400" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />
    }
  }

  const getAuthIcon = () => {
    if (isAuthenticating || !status) {
      return <AlertCircle className="h-4 w-4 animate-pulse text-yellow-600 dark:text-yellow-400" />
    }

    switch (status.type) {
      case 'Authenticated':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'Error':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'NotAuthenticated':
      default:
        return <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'connecting':
        return 'Connecting...'
      default:
        return 'Unknown'
    }
  }

  const getAuthText = () => {
    if (isAuthenticating || !status) {
      return 'Authenticating...'
    }

    switch (status.type) {
      case 'Authenticated':
        return user ? `${user.username}` : 'Authenticated'
      case 'Error':
        return 'Auth Error'
      case 'NotAuthenticated':
      default:
        return 'Not authenticated'
    }
  }


  return (
    <div
      className={cn(
        "flex h-6 items-center justify-between border-t bg-gray-50 px-4 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400",
        className
      )}
    >
      {/* Left section - Connection and Auth status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title={getConnectionText()}>
          {getConnectionIcon()}
          <span className="hidden sm:inline">{getConnectionText()}</span>
        </div>
        
        <div className="flex items-center gap-1.5" title={getAuthText()}>
          {getAuthIcon()}
          <span className="hidden sm:inline">{getAuthText()}</span>
        </div>

      </div>
    </div>
  )
}

export { StatusBar }