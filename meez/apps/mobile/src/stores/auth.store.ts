import { create } from 'zustand';
import { apiClient } from '../services/api';

interface AuthState {
  user: any; token: string | null; refreshToken: string | null; isAuthenticated: boolean; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { user, token, refreshToken } = data.data;
      set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
    } catch (err) { set({ isLoading: false }); throw err; }
  },
  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/register', { email, password });
      const { user, token, refreshToken } = data.data;
      set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
    } catch (err) { set({ isLoading: false }); throw err; }
  },
  logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
}));
