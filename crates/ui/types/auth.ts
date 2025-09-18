// Authentication-related TypeScript type definitions

export interface AuthenticatedUser {
  username: string;
  provider: string;
}

export type AuthStatus = 
  | { type: 'NotAuthenticated' }
  | { type: 'Authenticating' }
  | { type: 'Authenticated'; username: string; provider: string }
  | { type: 'Error'; message: string };

export interface AuthState {
  status: AuthStatus | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  status: AuthStatus;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  error?: string;
}