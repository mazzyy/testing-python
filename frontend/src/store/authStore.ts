import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../api/auth';
import { setToken, getToken } from '../api/client';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;  // Track if initial auth check has completed
  isNewUser: boolean;  // Track if user just registered (for onboarding)
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  clearNewUser: () => void;  // Clear new user flag after onboarding
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      isNewUser: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          // Store token immediately in localStorage and memory
          setToken(response.access_token);
          // Clear any cached data from previous user session
          queryClient.clear();
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const detail = error.response?.data?.detail;
          let message = 'Login failed. Please try again.';
          if (typeof detail === 'string') {
            message = detail;
          } else if (Array.isArray(detail) && detail.length > 0) {
            message = detail.map((e: any) => e.msg || e.message).join(', ');
          }
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          // Auto-login after registration
          await get().login({ email: data.email, password: data.password });
          // Mark as new user for onboarding
          set({ isNewUser: true });
        } catch (error: any) {
          const detail = error.response?.data?.detail;
          let message = 'Registration failed. Please try again.';
          if (typeof detail === 'string') {
            message = detail;
          } else if (Array.isArray(detail) && detail.length > 0) {
            message = detail.map((e: any) => e.msg || e.message).join(', ');
          }
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        setToken(null);
        // Clear all cached data to prevent data leakage between users
        queryClient.clear();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = getToken();
        if (!token) {
          set({ isAuthenticated: false, isInitialized: true });
          return;
        }

        try {
          const user = await authApi.getMe();
          set({ user, token, isAuthenticated: true, isInitialized: true });
        } catch {
          setToken(null);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },

      clearError: () => set({ error: null }),
      clearNewUser: () => set({ isNewUser: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isNewUser: state.isNewUser }),
    }
  )
);
