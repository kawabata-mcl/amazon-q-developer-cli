import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { classifyError, ErrorType, createAppError, getUserFriendlyMessage, handleError } from '@/lib/error-handler'
import { invoke } from '@tauri-apps/api/tauri'

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
    expect(getUserFriendlyMessage(appError)).toMatch('設定の読み込みに失敗しました')
  })

  it('emits and logs errors via handleError', () => {
    // act
    handleError('Network connection timeout')

    // assert that log_error was invoked
    expect(invoke).toHaveBeenCalled()
    const calls = (invoke as unknown as jest.Mock).mock.calls
    const hasLog = calls.some(([cmd]) => cmd === 'log_error')
    expect(hasLog).toBe(true)
  })
})


