export interface AuthStatus {
  isAuthenticated: boolean;
  user?: UserInfo;
  error?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  profileType?: string;
}

export interface LoginRequest {
  provider?: string;
  options?: Record<string, unknown>;
}

export interface LoginResponse {
  success: boolean;
  user?: UserInfo;
  error?: string;
}