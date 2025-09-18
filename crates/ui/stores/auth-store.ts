import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { loginCommand, logoutCommand, getAuthStatusCommand } from '@/lib/tauri';
import type { AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      // Initial state
      status: { type: 'NotAuthenticated' },
      isLoading: false,
      error: null,

      // Actions
      login: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const status = await loginCommand();
          set({ 
            status,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ 
            status: { type: 'NotAuthenticated' },
            isLoading: false,
            error: errorMessage
          });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await logoutCommand();
          set({ 
            status: { type: 'NotAuthenticated' },
            isLoading: false,
            error: null 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          set({ 
            isLoading: false,
            error: errorMessage
          });
        }
      },

      checkAuthStatus: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const status = await getAuthStatusCommand();
          set({ 
            status,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to check auth status';
          set({ 
            status: { type: 'NotAuthenticated' },
            isLoading: false,
            error: errorMessage
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);