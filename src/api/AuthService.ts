/**
 * Authentication Service
 *
 * Handles all authentication-related API calls:
 * - User registration
 * - Login
 * - Logout
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from './types';

export class AuthService {
  /**
   * Register a new student account
   * @param data - Registration data (name, username, email, password, trainer_name)
   * @returns Promise with user data and authentication token
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.auth.register,
      data
    );

    // Store token in API client
    apiClient.setToken(response.token);

    return response;
  }

  /**
   * Login with email and password
   * @param credentials - Login credentials (email, password)
   * @returns Promise with user data and authentication token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    // Store token in API client
    apiClient.setToken(response.token);

    return response;
  }

  /**
   * Logout and revoke current authentication token
   * @returns Promise with logout confirmation
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>(
      API_ENDPOINTS.auth.logout
    );

    // Clear token from API client
    apiClient.clearToken();

    return response;
  }

  /**
   * Check if user is currently authenticated
   * @returns True if authentication token exists
   */
  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  }
}

// Export singleton instance
export const authService = new AuthService();
