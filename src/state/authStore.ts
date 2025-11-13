/**
 * Authentication State Store (Zustand)
 *
 * Manages authentication state:
 * - Login/Register/Logout actions
 * - User data
 * - Token persistence
 * - Loading and error states
 */

import { create } from 'zustand';
import { authService } from '../api/AuthService';
import type { User, LoginRequest, RegisterRequest } from '../api/types';

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  loadTokenFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial State
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login Action
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const credentials: LoginRequest = { email, password };
      const response = await authService.login(credentials);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error; // Re-throw for UI handling
    }
  },

  // Register Action
  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Registration failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error; // Re-throw for UI handling
    }
  },

  // Logout Action
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Clear Error
  clearError: () => {
    set({ error: null });
  },

  // Load Token from Storage (call on app init)
  loadTokenFromStorage: () => {
    const isAuth = authService.isAuthenticated();
    if (isAuth) {
      set({ isAuthenticated: true });
      // Note: We don't have user data yet, will fetch on scene load
    }
  },
}));
