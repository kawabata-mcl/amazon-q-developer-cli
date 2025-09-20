import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { loginCommand, logoutCommand, getAuthStatusCommand, refreshAuthTokenCommand, type LoginOptions } from '@/lib/tauri';
import type { AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
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
      login: async (options?: LoginOptions) => {
        set({ isLoading: true, error: null });
        
        try {
          const status = await loginCommand(options);
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

      refreshToken: async () => {
        console.log('=== Starting token refresh ===');
        set({ isLoading: true, error: null });
        
        try {
          console.log('Calling refreshAuthTokenCommand...');
          const status = await refreshAuthTokenCommand();
          console.log('Token refresh result:', status);
          
          set({ 
            status,
            isLoading: false,
            error: null 
          });
          
          console.log('=== Token refresh completed successfully ===');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
          console.error('Token refresh failed:', errorMessage);
          
          set({ 
            status: { type: 'Error', message: errorMessage },
            isLoading: false,
            error: errorMessage
          });
          
          console.log('=== Token refresh completed with error ===');
        }
      },

      initializeAuth: async () => {
        console.log('=== Initializing authentication state ===');
        set({ isLoading: true, error: null });
        
        try {
          // First, try to get current auth status (includes persistent state restoration)
          console.log('Checking initial auth status...');
          const status = await getAuthStatusCommand();
          console.log('Initial auth status:', status);
          
          // Validate status object
          if (!status || typeof status !== 'object' || !status.type) {
            console.warn('Invalid auth status received, defaulting to NotAuthenticated');
            set({ 
              status: { type: 'NotAuthenticated' },
              isLoading: false,
              error: null 
            });
            return;
          }
          
          set({ 
            status,
            isLoading: false,
            error: null 
          });
          
          // If authenticated, periodically refresh token
          if (status.type === 'Authenticated') {
            console.log('User is authenticated, setting up token refresh timer');
            // Set up periodic token refresh (every 30 minutes)
            setInterval(async () => {
              try {
                console.log('Performing periodic token refresh...');
                await refreshAuthTokenCommand();
              } catch (error) {
                console.warn('Periodic token refresh failed:', error);
              }
            }, 30 * 60 * 1000); // 30 minutes
          }
          
          console.log('=== Authentication initialization completed successfully ===');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize auth';
          console.error('Auth initialization failed:', errorMessage);
          
          set({ 
            status: { type: 'NotAuthenticated' },
            isLoading: false,
            error: errorMessage
          });
          
          console.log('=== Authentication initialization completed with error ===');
        }
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