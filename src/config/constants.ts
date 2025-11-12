/**
 * Game Constants
 *
 * Central location for all game configuration constants.
 * These values are code-level constants and don't change per environment.
 */

// Game World Configuration
export const GAME_CONFIG = {
  TILE_SIZE: 32,
  PLAYER_SPEED: 4,
  MAX_PARTY_SIZE: 6,

  // Progression
  LEVEL_UP_BASE_XP: 100,
  LEVEL_UP_MULTIPLIER: 1.5,
  XP_PER_LEVEL: 1000, // Each level requires 1000 XP (from SERVER.md)

  // Colors
  COLORS: {
    PRIMARY: 0x4A90E2,
    SECONDARY: 0x50E3C2,
    SUCCESS: 0x7ED321,
    WARNING: 0xF5A623,
    DANGER: 0xD0021B,
    TEXT: 0xFFFFFF,
    TEXT_DARK: 0x000000,
    BACKGROUND: 0x1a1a2e,
  },

  // Fonts (Pixel Art)
  FONTS: {
    PIXEL: '"Press Start 2P", monospace',
    SYSTEM: 'system-ui, -apple-system, sans-serif',
  },
} as const;

// Scene Names (for SceneManager)
export const SCENE_NAMES = {
  MENU: 'menu',
  OVERWORLD: 'overworld',
  BATTLE: 'battle',
  QUIZ: 'quiz',
  COLLECTION: 'collection',
} as const;

// Input Keybinds
export const KEYBINDS = {
  // Movement
  UP: ['ArrowUp', 'KeyW'],
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],

  // Actions
  INTERACT: ['KeyE', 'Enter', 'Space'],
  MENU: ['KeyM', 'Escape'],
  QUIZ: ['KeyQ'],
  BATTLE: ['KeyB'],
  COLLECTION: ['KeyC'],

  // UI
  CONFIRM: ['Enter', 'Space'],
  CANCEL: ['Escape'],
} as const;

// Quiz Configuration
export const QUIZ_CONFIG = {
  PASS_THRESHOLD: 60, // 60% to pass
  EXCELLENCE_THRESHOLD: 80, // 80% for bonus rewards
  PERFECT_THRESHOLD: 100, // 100% for maximum rewards

  REWARDS_MULTIPLIER: {
    PASS: 1.0,
    EXCELLENCE: 1.5,
    PERFECT: 2.0,
  },
} as const;

// Battle Configuration
export const BATTLE_CONFIG = {
  CRITICAL_HIT_CHANCE: 0.1, // 10% chance
  CRITICAL_HIT_MULTIPLIER: 1.5,

  // Type effectiveness multipliers
  TYPE_EFFECTIVENESS: {
    SUPER_EFFECTIVE: 2.0,
    NORMAL: 1.0,
    NOT_VERY_EFFECTIVE: 0.5,
    NO_EFFECT: 0.0,
  },

  // Battle Types
  BATTLE_TYPES: {
    PVE: 'pve',
    PVP: 'pvp',
    TRAINING: 'training',
  } as const,
} as const;

// Elemental Types
export const ELEMENT_TYPES = {
  FIRE: 'Fire',
  WATER: 'Water',
  GRASS: 'Grass',
  ELECTRIC: 'Electric',
  ROCK: 'Rock',
  WIND: 'Wind',
  NORMAL: 'Normal',
} as const;

// Type Effectiveness Chart (simplified)
// TODO: Move to config/typeChart.ts for full implementation
export const TYPE_CHART: Record<string, Record<string, number>> = {
  Fire: {
    Grass: 2.0,
    Water: 0.5,
    Fire: 0.5,
  },
  Water: {
    Fire: 2.0,
    Grass: 0.5,
    Water: 0.5,
  },
  Grass: {
    Water: 2.0,
    Fire: 0.5,
    Grass: 0.5,
  },
  Electric: {
    Water: 2.0,
    Grass: 0.5,
    Electric: 0.5,
  },
  // ... Add more as needed
};

// Asset Paths
export const ASSET_PATHS = {
  SPRITES: '/assets/',
  PLAYER: '/assets/player/',
  GRASS: '/assets/grass/',
  SIBLONS: '/assets/siblons/',
  UI: '/assets/ui/',
  AUDIO: '/assets/audio/',
} as const;

// Storage Keys (localStorage)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'siblo_auth_token',
  PLAYER_DATA: 'siblo_player_data',
  SETTINGS: 'siblo_settings',
} as const;
