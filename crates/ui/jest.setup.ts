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
  invoke: jest.fn(async (cmd: string, _args?: unknown) => {
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