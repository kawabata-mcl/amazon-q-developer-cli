import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { waitFor } from '@testing-library/react'
jest.mock('@/lib/tauri-env', () => {
  const actual = jest.requireActual('@/lib/tauri-env');
  return {
    __esModule: true,
    ...actual,
    isTauriRuntime: jest.fn(() => true),
    safeInvoke: jest.fn().mockResolvedValue(undefined),
  };
});
import { classifyError, ErrorType, createAppError, getUserFriendlyMessage, logError, GlobalErrorHandler, handleError } from '@/lib/error-handler'

describe('error-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('classifies authentication errors correctly', () => {
    expect(classifyError('authentication invalid')).toBe(ErrorType.AUTH_INVALID)
    expect(classifyError('login failed')).toBe(ErrorType.AUTH_FAILED)
    expect(classifyError('auth expired')).toBe(ErrorType.AUTH_EXPIRED)
  })

  it('classifies network errors correctly', () => {
    expect(classifyError('network timeout')).toBe(ErrorType.NETWORK_TIMEOUT)
    expect(classifyError('network offline')).toBe(ErrorType.NETWORK_OFFLINE)
    expect(classifyError('network error')).toBe(ErrorType.NETWORK_ERROR)
  })

  it('creates AppError with friendly message', () => {
    const appError = createAppError(new Error('settings load failed'))
    expect(appError.id).toBeTruthy()
    expect(appError.timestamp).toBeInstanceOf(Date)
    expect(getUserFriendlyMessage(appError)).toMatch('Failed to load settings')
  })

  it('emits and logs errors via logError', async () => {
    const appError = createAppError('Network connection timeout')
    const { safeInvoke, isTauriRuntime } = jest.requireMock('@/lib/tauri-env') as { safeInvoke: jest.Mock, isTauriRuntime: jest.Mock }
    isTauriRuntime.mockReturnValue(true)
    safeInvoke.mockResolvedValue(undefined)

    // jsdom 環境でも isTauriRuntime() が true になるようにガード
    try {
      (window as any).__TAURI__ = (window as any).__TAURI__ || {}
    } catch (_) {
      // ignore if window is not available for some reason
    }

    await logError(appError)

    const core = jest.requireMock('@tauri-apps/api/core') as { invoke: jest.Mock }
    await waitFor(() => {
      const safeCalls = (safeInvoke.mock?.calls as any[]) || []
      const coreCalls = (core.invoke.mock?.calls as any[]) || []
      expect(safeCalls.length + coreCalls.length).toBeGreaterThan(0)
    })
    const safeCalls = (safeInvoke.mock?.calls as any[]) || []
    const coreCalls = (core.invoke.mock?.calls as any[]) || []
    const hasLog = [...safeCalls, ...coreCalls].some(([cmd]) => cmd === 'log_error')
    expect(hasLog).toBe(true)
  })
})


