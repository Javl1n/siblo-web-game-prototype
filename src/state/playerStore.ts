/**
 * Player State Store (Zustand)
 *
 * Manages player profile and Siblon collection:
 * - Player profile (level, XP, coins)
 * - Siblon party and collection
 * - XP/Coin rewards
 * - Profile fetching
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playerService } from '../api/PlayerService';
import { STORAGE_KEYS, GAME_CONFIG } from '../config/constants';
import type { PlayerProfile, PlayerSiblon } from '../api/types';

interface PlayerState {
  // State
  profile: PlayerProfile | null;
  party: PlayerSiblon[];
  collection: PlayerSiblon[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchSiblons: () => Promise<void>;
  setProfile: (profile: PlayerProfile) => void;
  addExperience: (xp: number) => void;
  addCoins: (coins: number) => void;
  clearPlayerData: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      party: [],
      collection: [],
      isLoading: false,
      error: null,

      // Fetch Player Profile from API
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const profile = await playerService.getProfile();
          set({ profile, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch profile',
            isLoading: false,
          });
          throw error;
        }
      },

      // Fetch Siblons from API
      fetchSiblons: async () => {
        set({ isLoading: true, error: null });
        try {
          const siblons = await playerService.getSiblons();
          set({
            party: siblons.party,
            collection: siblons.collection,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch Siblons',
            isLoading: false,
          });
          throw error;
        }
      },

      // Set Profile (used after login)
      setProfile: (profile: PlayerProfile) => {
        set({ profile });
      },

      // Add Experience Points and handle level up
      addExperience: (xp: number) => {
        const { profile } = get();
        if (!profile) return;

        const newXP = profile.experience_points + xp;
        const newLevel = Math.floor(newXP / GAME_CONFIG.XP_PER_LEVEL) + 1;

        set({
          profile: {
            ...profile,
            experience_points: newXP,
            level: Math.max(profile.level, newLevel), // Never decrease level
          },
        });
      },

      // Add Coins
      addCoins: (coins: number) => {
        const { profile } = get();
        if (!profile) return;

        set({
          profile: {
            ...profile,
            coins: profile.coins + coins,
          },
        });
      },

      // Clear All Player Data (on logout)
      clearPlayerData: () => {
        set({
          profile: null,
          party: [],
          collection: [],
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEYS.PLAYER_DATA,
      partialize: (state) => ({
        profile: state.profile, // Persist only profile for offline access
      }),
    }
  )
);
