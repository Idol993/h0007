import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';
import { authAPI } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login({ username, password });
      localStorage.setItem('token', response.token);
      const user = await authAPI.getMe();
      set({ user, token: response.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, password: string, phone?: string) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.register({ username, password, phone });
      localStorage.setItem('token', response.token);
      const user = await authAPI.getMe();
      set({ user, token: response.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    
    set({ isLoading: true });
    try {
      const user = await authAPI.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
}));

interface UIState {
  showToast: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  
  showToastMessage: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showToast: false,
  toastMessage: '',
  toastType: 'info',

  showToastMessage: (message, type = 'info') => {
    set({ showToast: true, toastMessage: message, toastType: type });
    setTimeout(() => {
      set({ showToast: false });
    }, 3000);
  },

  hideToast: () => {
    set({ showToast: false });
  },
}));
