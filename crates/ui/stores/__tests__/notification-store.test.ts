import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { act } from '@testing-library/react'
import { useNotificationStore, notificationHelpers } from '@/stores/notification-store'

describe('notification-store', () => {
  beforeEach(() => {
    // reset state
    useNotificationStore.setState({ notifications: [] })
  })

  it('adds a notification and auto-dismisses after duration', async () => {
    jest.useFakeTimers()
    const id = useNotificationStore.getState().addNotification({
      type: 'info',
      title: 'Hello',
      message: 'World',
      duration: 1000,
    })

    let n = useNotificationStore.getState().getNotificationById(id)
    expect(n).toBeTruthy()
    expect(n?.isDismissed).toBe(false)

    // advance timers to trigger dismiss
    act(() => {
      jest.advanceTimersByTime(1100)
    })

    // after dismiss animation removal (300ms)
    act(() => {
      jest.advanceTimersByTime(400)
    })

    n = useNotificationStore.getState().getNotificationById(id)
    expect(n).toBeUndefined()
    jest.useRealTimers()
  })

  it('helper error() creates persistent notification', () => {
    const id = notificationHelpers.error('Error', 'Failure')
    const n = useNotificationStore.getState().getNotificationById(id)
    expect(n?.duration).toBe(0)
  })

  it('markAsRead and dismissNotification update state', () => {
    const id = notificationHelpers.info('Info', 'Message')
    let n = useNotificationStore.getState().getNotificationById(id)
    expect(n?.isRead).toBe(false)

    useNotificationStore.getState().markAsRead(id)
    n = useNotificationStore.getState().getNotificationById(id)
    expect(n?.isRead).toBe(true)

    useNotificationStore.getState().dismissNotification(id)
    n = useNotificationStore.getState().getNotificationById(id)
    expect(n?.isDismissed).toBe(true)
  })
})


