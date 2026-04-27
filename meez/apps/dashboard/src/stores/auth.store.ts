import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  orgId: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/login', { email, password });
          const { user, token, refreshToken } = data.data;
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      register: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/register', { email, password });
          const { user, token, refreshToken } = data.data;
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      fetchMe: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'meetai-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
    },
  ),
);
