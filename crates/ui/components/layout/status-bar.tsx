'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  Wifi, 
  WifiOff, 
  Circle, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock
} from "lucide-react"

export interface StatusBarProps {
  connectionStatus?: 'connected' | 'disconnected' | 'connecting'
  authStatus?: 'authenticated' | 'unauthenticated' | 'pending'
  lastActivity?: Date
  className?: string
}

const StatusBar: React.FC<StatusBarProps> = ({
  connectionStatus = 'connected',
  authStatus = 'authenticated',
  lastActivity,
  className
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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
    switch (authStatus) {
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'unauthenticated':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 animate-pulse text-yellow-600 dark:text-yellow-400" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
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
    switch (authStatus) {
      case 'authenticated':
        return 'Authenticated'
      case 'unauthenticated':
        return 'Not authenticated'
      case 'pending':
        return 'Authenticating...'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
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

        {lastActivity && (
          <div className="flex items-center gap-1.5" title={`Last activity: ${lastActivity.toLocaleString()}`}>
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">
              Last activity: {formatLastActivity(lastActivity)}
            </span>
          </div>
        )}
      </div>

      {/* Right section - Current time */}
      <div className="flex items-center gap-1.5">
        <span>{formatTime(currentTime)}</span>
      </div>
    </div>
  )
}

export { StatusBar }