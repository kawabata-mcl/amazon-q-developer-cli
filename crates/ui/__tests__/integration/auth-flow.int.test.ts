import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { useAuthStore } from '@/stores/auth-store';
import { 
  loginCommand,
  logoutCommand,
  getAuthStatusCommand,
} from '@/lib/tauri';

const mockLogin = loginCommand as unknown as jest.MockedFunction<typeof loginCommand>;
const mockLogout = logoutCommand as unknown as jest.MockedFunction<typeof logoutCommand>;
const mockGetStatus = getAuthStatusCommand as unknown as jest.MockedFunction<typeof getAuthStatusCommand>;

describe('Integration: Auth flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({ status: { type: 'NotAuthenticated' }, isLoading: false, error: null });
  });

  test('checks auth status, logs in, and logs out', async () => {
    mockGetStatus.mockResolvedValueOnce({ type: 'NotAuthenticated' });

    await useAuthStore.getState().checkAuthStatus();
    expect(useAuthStore.getState().status).toEqual({ type: 'NotAuthenticated' });

    mockLogin.mockResolvedValueOnce({ type: 'Authenticated', username: 'alice', provider: 'AWS' });
    await useAuthStore.getState().login();
    expect(useAuthStore.getState().status).toEqual({ type: 'Authenticated', username: 'alice', provider: 'AWS' });
    expect(useAuthStore.getState().error).toBeNull();

    mockLogout.mockResolvedValueOnce(undefined);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toEqual({ type: 'NotAuthenticated' });
    expect(useAuthStore.getState().error).toBeNull();
  });
});


