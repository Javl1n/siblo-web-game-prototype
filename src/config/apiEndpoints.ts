/**
 * API Endpoints Configuration
 *
 * Centralized API endpoint definitions based on SERVER.md specifications.
 * All endpoints are relative paths that will be combined with ENV.API_URL.
 */

import { ENV } from './env';

export const API_ENDPOINTS = {
  // Base URL from environment
  base: ENV.API_URL,

  // Authentication Endpoints
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
  },

  // Player Profile Endpoints
  player: {
    profile: '/api/player/profile',
    siblons: '/api/player/siblons',
    dailyActivity: '/api/player/daily-activity',
  },

  // Quiz Endpoints
  quizzes: {
    list: '/api/quizzes',
    detail: (id: number) => `/api/quizzes/${id}`,
    start: (id: number) => `/api/quizzes/${id}/start`,
    submit: (attemptId: number) => `/api/quiz-attempts/${attemptId}/submit`,
  },

  // Battle Endpoints
  battles: {
    start: '/api/battles/start',
    state: (id: string) => `/api/battles/${id}`,
    forfeit: (id: string) => `/api/battles/${id}/forfeit`,
  },

  // WebSocket Endpoints
  websocket: {
    auth: '/broadcasting/auth',
    battle: (battleId: string) => `battle.${battleId}`,
  },
} as const;

/**
 * Builds a full URL from a relative endpoint path
 * @param endpoint - Relative endpoint path
 * @returns Full URL
 */
export function buildUrl(endpoint: string): string {
  return `${ENV.API_URL}${endpoint}`;
}
