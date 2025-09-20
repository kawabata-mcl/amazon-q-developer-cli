import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useNotificationStore } from '@/stores/notification-store'

describe('useErrorHandler', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] })
  })

  it('adds a notification when handling an error', () => {
    const { result } = renderHook(() => useErrorHandler({ showNotifications: true }))

    act(() => {
      result.current.handleError(new Error('network timeout'))
    })

    const active = useNotificationStore.getState().getActiveNotifications()
    expect(active.length).toBeGreaterThan(0)
  })
})


