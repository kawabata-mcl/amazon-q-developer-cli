import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, act } from '@testing-library/react'
import { NotificationToast } from '@/components/ui/notification-toast'
import { useNotificationStore } from '@/stores/notification-store'

describe('NotificationToast', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] })
    jest.useFakeTimers()
  })

  it('renders title and message and marks as read after visible', async () => {
    const id = useNotificationStore.getState().addNotification({
      type: 'info',
      title: 'Title',
      message: 'Message',
      duration: 0,
    })
    const n = useNotificationStore.getState().getNotificationById(id)!

    const { rerender } = render(
      <NotificationToast
        notification={n}
        onDismiss={() => {}}
        onMarkAsRead={(nid) => useNotificationStore.getState().markAsRead(nid)}
      />
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Message')).toBeInTheDocument()

    // entrance animation timer (10ms)
    act(() => {
      jest.advanceTimersByTime(20)
    })

    // mark-as-read after 1000ms
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // rerender with latest store state
    const updated = useNotificationStore.getState().getNotificationById(id)!
    rerender(
      <NotificationToast
        notification={updated}
        onDismiss={() => {}}
        onMarkAsRead={(nid) => useNotificationStore.getState().markAsRead(nid)}
      />
    )

    expect(updated.isRead).toBe(true)
  })
})


