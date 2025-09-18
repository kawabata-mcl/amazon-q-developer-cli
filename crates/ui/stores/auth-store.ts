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
      // Initial state - start with loading to prevent premature redirects
      status: null,
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
        console.log('=== Starting auth status check ===');
        set({ isLoading: true, error: null });
        
        try {
          console.log('Calling getAuthStatusCommand...');
          const status = await getAuthStatusCommand();
          console.log('Auth status received:', status);
          
          set({ 
            status,
            isLoading: false,
            error: null 
          });
          
          console.log('=== Auth status check completed successfully ===');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to check auth status';
          console.error('Auth status check failed:', errorMessage);
          
          set({ 
            status: { type: 'NotAuthenticated' },
            isLoading: false,
            error: errorMessage
          });
          
          console.log('=== Auth status check completed with error ===');
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