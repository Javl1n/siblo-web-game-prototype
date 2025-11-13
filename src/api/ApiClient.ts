/**
 * API Client
 *
 * Central HTTP client for communicating with the Laravel backend.
 * Handles authentication, timeouts, retries, and error handling.
 */

import { ENV } from '../config/env';
import { STORAGE_KEYS } from '../config/constants';
import { ApiError } from './types';

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;

  constructor() {
    this.baseURL = ENV.API_URL;
    this.timeout = ENV.API_TIMEOUT;
    this.loadToken();
  }

  /**
   * Set authentication token and persist to localStorage
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (ENV.DEBUG) {
      console.log('[API] Token set');
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear authentication token from memory and localStorage
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    if (ENV.DEBUG) {
      console.log('[API] Token cleared');
    }
  }

  /**
   * Load token from localStorage on initialization
   */
  private loadToken(): void {
    this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (this.token && ENV.DEBUG) {
      console.log('[API] Token loaded from storage');
    }
  }

  /**
   * Make an HTTP request to the API
   * @param endpoint - Relative endpoint path (e.g., '/api/auth/login')
   * @param options - Fetch options
   * @returns Promise with typed response data
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if token exists
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const url = `${this.baseURL}${endpoint}`;

      if (ENV.DEBUG) {
        console.log(`[API] ${options.method || 'GET'} ${url}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        if (ENV.DEBUG) {
          console.error(`[API] Error ${response.status}:`, data);
        }

        // Special handling for 401 (Unauthorized) - clear token
        if (response.status === 401) {
          this.clearToken();
        }

        throw new ApiError(
          data.message || 'API request failed',
          response.status,
          data.errors
        );
      }

      if (ENV.DEBUG) {
        console.log(`[API] Response:`, data);
      }

      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }

      // Network or other errors
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Network error: ${message}`);
    }
  }

  /**
   * Convenience method for GET requests
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
