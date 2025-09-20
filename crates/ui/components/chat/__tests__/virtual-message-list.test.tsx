import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VirtualMessageList } from '@/components/chat/virtual-message-list'
import type { ChatMessage } from '@/types/chat'

function makeMessages(count: number, content = 'hello'): ChatMessage[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `m-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `${content}-${i}`,
    timestamp: new Date(),
  }))
}

describe('VirtualMessageList', () => {
  test('Shows empty state when empty', () => {
    render(<VirtualMessageList messages={[]} isLoading={false} />)
    expect(screen.getByTestId('virtual-message-list')).toBeInTheDocument()
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
  })

  test('Only a portion is rendered even with many messages', () => {
    const messages = makeMessages(1000)
    render(
      <div style={{ height: 600 }}>
        <VirtualMessageList messages={messages} isLoading={false} itemHeight={100} enableDynamicHeight={false} />
      </div>
    )

    // Due to virtualization, DOM element count should be less than total
    const container = screen.getByTestId('virtual-message-list')
    const renderedItems = container.querySelectorAll('[data-message-id]')
    expect(renderedItems.length).toBeLessThan(1000)
    expect(renderedItems.length).toBeGreaterThan(0)
  })

  test('Visible range updates when scrolling', () => {
    const messages = makeMessages(200)
    render(
      <div style={{ height: 600 }}>
        <VirtualMessageList messages={messages} isLoading={false} itemHeight={100} enableDynamicHeight={false} />
      </div>
    )
    const container = screen.getByTestId('virtual-message-list')

    // Initial first element exists
    expect(container.querySelector('[data-message-id="m-0"]')).toBeTruthy()

    // Scroll down to verify visible range changes
    Object.defineProperty(container, 'scrollTop', { value: 1200, writable: true })
    fireEvent.scroll(container)

    // First element should no longer be visible
    expect(container.querySelector('[data-message-id="m-0"]')).toBeFalsy()
  })
})


