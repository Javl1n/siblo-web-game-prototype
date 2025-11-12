/**
 * Player Service
 *
 * Handles all player-related API calls:
 * - Player profile
 * - Siblon collection
 * - Daily activity
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { PlayerProfile, SiblonsResponse, DailyActivity } from './types';

export class PlayerService {
  /**
   * Get current player's profile and stats
   * @returns Promise with player profile data
   */
  async getProfile(): Promise<PlayerProfile> {
    return apiClient.get<PlayerProfile>(API_ENDPOINTS.player.profile);
  }

  /**
   * Get player's Siblon collection with full species data
   * @returns Promise with party and collection Siblons
   */
  async getSiblons(): Promise<SiblonsResponse> {
    return apiClient.get<SiblonsResponse>(API_ENDPOINTS.player.siblons);
  }

  /**
   * Get today's activity summary
   * @returns Promise with daily activity data
   */
  async getDailyActivity(): Promise<DailyActivity> {
    return apiClient.get<DailyActivity>(API_ENDPOINTS.player.dailyActivity);
  }
}

// Export singleton instance
export const playerService = new PlayerService();
