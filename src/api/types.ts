/**
 * API Type Definitions
 *
 * TypeScript interfaces for all API requests and responses.
 * Based on SERVER.md specifications.
 */

// ===========================================
// Authentication Types
// ===========================================

export interface RegisterRequest {
  name: string; // Full name
  username: string; // Unique username (max 50 chars)
  email: string; // Valid email
  password: string; // Min 8 characters
  password_confirmation: string; // Must match password
  trainer_name: string; // Display name in game (REQUIRED)
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  user_type: 'student';
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export type RegisterResponse = AuthResponse;
export type LoginResponse = AuthResponse;

export interface LogoutResponse {
  message: string;
}

// ===========================================
// Player Profile Types
// ===========================================

export interface PlayerProfile {
  id: number; // Player profile ID
  user_id: number; // User account ID
  username: string; // Account username
  name: string; // Full name
  trainer_name: string; // Display name in game
  level: number; // Player level (increases every 1000 XP)
  experience_points: number; // Total XP earned
  coins: number; // In-game currency
  current_region_id: number | null; // Current region (null for prototype)
}

export interface SpeciesData {
  dex_number: number; // Pokédex-style number
  type_primary: string; // Primary type (e.g., "Fire", "Water")
  type_secondary: string | null; // Secondary type (null if single-type)
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  sprite_url: string; // URL to sprite image
  description: string; // Species description/lore
}

export interface PlayerSiblon {
  id: number; // Unique instance ID
  species_id: number; // Species ID
  species_name: string; // Species name (e.g., "Flamey", "Aquos")
  nickname: string | null; // Custom nickname (null if not set)
  level: number; // Siblon level
  experience_points: number; // XP earned by this Siblon
  current_hp: number; // Current HP (for battles)
  max_hp: number; // Maximum HP
  attack_stat: number; // Attack stat
  defense_stat: number; // Defense stat
  speed_stat: number; // Speed stat (determines turn order)
  is_in_party: boolean; // True if in active party (max 6)
  caught_at: string; // ISO 8601 timestamp when caught
  species_data: SpeciesData; // Complete species information
}

export interface SiblonsResponse {
  party: PlayerSiblon[]; // Active party members
  collection: PlayerSiblon[]; // All owned Siblons
  total_count: number; // Total number of Siblons owned
}

export interface DailyActivity {
  activity_date: string;
  quizzes_completed: number;
  experience_gained: number;
  battles_won: number;
  battles_lost: number;
  login_streak: number;
}

// ===========================================
// Quiz Types
// ===========================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'multiple_correct';

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  topic: string;
  difficulty_level: DifficultyLevel;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  pass_threshold: number;
  question_count: number;
  is_featured: boolean;
}

export interface GetQuizzesResponse {
  quizzes: Quiz[];
}

export interface QuestionChoice {
  id: number;
  choice_text: string;
  order_index: number;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  media_url: string | null;
  choices: QuestionChoice[];
}

export interface QuizDetail {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  topic: string;
  difficulty_level: DifficultyLevel;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  pass_threshold: number;
  questions: QuizQuestion[];
}

export interface StartQuizResponse {
  attempt_id: number;
  quiz_id: number;
  started_at: string; // ISO 8601 timestamp
  expires_at: string | null;
}

export interface Answer {
  question_id: number;
  selected_choice_ids: number[];
}

export interface SubmitQuizRequest {
  answers: Answer[];
}

export interface QuizAnswerResult {
  question_id: number;
  is_correct: boolean;
  correct_answer: number[]; // Array of correct choice IDs
  points_earned: number;
  explanation: string | null;
}

export interface QuizRewards {
  experience_points: number;
  coins: number;
  items: any[];
}

export interface SubmitQuizResponse {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken: number; // Time in seconds
  rewards: QuizRewards;
  answers: QuizAnswerResult[];
}

// ===========================================
// Battle Types
// ===========================================

export type BattleType = 'pve' | 'pvp' | 'training';
export type BattleStatus = 'active' | 'completed' | 'forfeited';

export interface StartBattleRequest {
  player_siblon_id: number;
  battle_type: BattleType;
  opponent_id?: number; // Required for PvP
}

export interface BattlePlayer {
  user_id: number | null;
  username: string;
  siblon_id: number | null;
  siblon_name: string;
  hp: number;
  max_hp: number;
  level: number;
}

export interface StartBattleResponse {
  battle_id: string; // UUID
  player1: BattlePlayer;
  player2: BattlePlayer;
  current_turn: number;
  turn_player_id: number;
  status: BattleStatus;
}

export interface BattleLogEntry {
  action: string;
  player_id: number | null;
  message: string;
  timestamp?: string;
}

export interface BattleState {
  battle_id: string;
  status: BattleStatus;
  player1: BattlePlayer;
  player2: BattlePlayer;
  current_turn: number;
  turn_player_id: number;
  winner_id: number | null;
  started_at: string; // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 timestamp
  battle_log: BattleLogEntry[];
}

export interface ForfeitBattleResponse {
  message: string;
  battle_id: string;
  winner_id: number | null;
  status: BattleStatus;
}

// ===========================================
// Error Types
// ===========================================

export interface ValidationErrors {
  [field: string]: string[];
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationErrors;
}

export class ApiError extends Error {
  public statusCode: number;
  public errors?: ValidationErrors;

  constructor(
    message: string,
    statusCode: number,
    errors?: ValidationErrors
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
