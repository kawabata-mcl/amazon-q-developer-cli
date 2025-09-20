import '@testing-library/jest-dom'

// jsdom polyfills for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util'
;(global as unknown as { TextEncoder?: unknown }).TextEncoder = TextEncoder
;(global as unknown as { TextDecoder?: unknown }).TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Bring in default settings for Tauri mocks
import { DEFAULT_SETTINGS } from '@/types/settings'

// Mock Tauri API: provide sane defaults for commands used in tests
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn(async (cmd: string) => {
    switch (cmd) {
      case 'get_auth_status':
        return { type: 'NotAuthenticated' };
      case 'login':
        return { type: 'Authenticated', username: 'test', provider: 'AWS' };
      case 'logout':
        return undefined;
      case 'start_new_conversation':
        return 'conv-test-1';
      case 'send_message_stream':
        return undefined;
      case 'get_conversation_history':
        return [];
      case 'get_all_conversations':
        return [];
      // Settings related commands
      case 'get_app_settings':
        return DEFAULT_SETTINGS;
      case 'update_app_settings':
        // pretend persist succeeded
        return undefined;
      case 'reset_app_settings':
        return undefined;
      default:
        return undefined;
    }
  }),
}))

// Mock Tauri events API used by chat store
jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(async () => {
    // Return unlisten function
    return () => {};
  }),
}))

// Mock Tauri window API used by use-window-state
jest.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    setSize: jest.fn(async () => undefined),
    setPosition: jest.fn(async () => undefined),
    maximize: jest.fn(async () => undefined),
    unmaximize: jest.fn(async () => undefined),
    setAlwaysOnTop: jest.fn(async () => undefined),
    onResized: jest.fn(async () => () => {}),
    onMoved: jest.fn(async () => () => {}),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Polyfill ResizeObserver for jsdom
const g = globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }
if (!g.ResizeObserver) {
  class ResizeObserverMock {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element) {
      // Immediately invoke with a minimal entry to satisfy components
      const entry = {
        target,
        contentRect: target.getBoundingClientRect(),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as unknown as ResizeObserverEntry
      this.callback([entry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
  g.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

// Mock react-markdown and remark-gfm to avoid ESM transform issues in Jest
import React from 'react'

type KeySeed = string

type ReactNodes = Array<React.ReactNode>

function parseInline(text: string, keySeed: KeySeed): ReactNodes {
  const parts: ReactNodes = []
  let lastIndex = 0
  const inlineCode = /`([^`]+)`/g
  let match: RegExpExecArray | null
  let i = 0
  while ((match = inlineCode.exec(text)) !== null) {
    if (lastIndex < match.index) {
      parts.push(React.createElement('span', { key: `${keySeed}-t-${i++}` }, text.slice(lastIndex, match.index)))
    }
    parts.push(React.createElement('code', { key: `${keySeed}-c-${i++}`, 'data-testid': 'inline-code' }, match[1]))
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(React.createElement('span', { key: `${keySeed}-t-${i++}` }, text.slice(lastIndex)))
  }
  return parts
}

function parseLinks(text: string, keySeed: KeySeed): ReactNodes {
  const parts: ReactNodes = []
  let lastIndex = 0
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  let i = 0
  while ((match = linkRe.exec(text)) !== null) {
    if (lastIndex < match.index) {
      parts.push(...parseInline(text.slice(lastIndex, match.index), `${keySeed}-l-${i}-pre`))
    }
    const href = match[2]
    const isExternal = href.startsWith('http') || href.startsWith('https')
    parts.push(
      React.createElement(
        'a',
        {
          key: `${keySeed}-a-${i++}`,
          href,
          target: isExternal ? '_blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
        },
        match[1]
      )
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(...parseInline(text.slice(lastIndex), `${keySeed}-l-${i}-post`))
  }
  return parts
}

function parseMarkdown(md: string): ReactNodes {
  const elements: ReactNodes = []
  let lastIndex = 0
  let i = 0
  const fence = /```(\w+)?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = fence.exec(md)) !== null) {
    if (lastIndex < match.index) {
      const preText = md.slice(lastIndex, match.index)
      elements.push(...parseLinks(preText, `seg-${i}-pre`))
    }
    const lang = match[1] || undefined
    const code = match[2]
    elements.push(
      React.createElement(
        'pre',
        { key: `cb-${i++}`, 'data-testid': 'code-block', 'data-language': lang },
        code
      )
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < md.length) {
    elements.push(...parseLinks(md.slice(lastIndex), `seg-${i}-last`))
  }
  return elements
}

jest.mock('react-markdown', () => {
  function MockReactMarkdown({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) {
    const content = Array.isArray(children) ? (children as Array<string | number>).join('') : children
    const nodes = typeof content === 'string' ? parseMarkdown(content) : children
    return React.createElement('div', { 'data-testid': 'react-markdown', ...rest }, nodes as React.ReactNode)
  }

  return {
    __esModule: true,
    default: MockReactMarkdown,
  }
})

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => (tree: unknown) => tree,
}))