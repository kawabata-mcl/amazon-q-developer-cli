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
  test('空の時に空状態を表示', () => {
    render(<VirtualMessageList messages={[]} isLoading={false} />)
    expect(screen.getByTestId('virtual-message-list')).toBeInTheDocument()
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
  })

  test('大量メッセージでも一部のみレンダリングされる', () => {
    const messages = makeMessages(1000)
    render(
      <div style={{ height: 600 }}>
        <VirtualMessageList messages={messages} isLoading={false} itemHeight={100} enableDynamicHeight={false} />
      </div>
    )

    // 仮想化により、DOM上の要素数は全体より少ないはず
    const container = screen.getByTestId('virtual-message-list')
    const renderedItems = container.querySelectorAll('[data-message-id]')
    expect(renderedItems.length).toBeLessThan(1000)
    expect(renderedItems.length).toBeGreaterThan(0)
  })

  test('スクロールで可視範囲が更新される', () => {
    const messages = makeMessages(200)
    render(
      <div style={{ height: 600 }}>
        <VirtualMessageList messages={messages} isLoading={false} itemHeight={100} enableDynamicHeight={false} />
      </div>
    )
    const container = screen.getByTestId('virtual-message-list')

    // 初期表示の最初の要素が存在
    expect(container.querySelector('[data-message-id="m-0"]')).toBeTruthy()

    // 下方向へスクロールして可視範囲が変わることを検証
    Object.defineProperty(container, 'scrollTop', { value: 1200, writable: true })
    fireEvent.scroll(container)

    // 先頭はもう見えない想定
    expect(container.querySelector('[data-message-id="m-0"]')).toBeFalsy()
  })
})


