# SIBLO Game Client - Backend Integration Guide

**For:** PixiJS Game Development Team
**Backend:** Laravel 12 + Sanctum + Reverb
**Last Updated:** November 10, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [TypeScript Type Generation Setup](#typescript-type-generation-setup)
4. [API Authentication](#api-authentication)
5. [Available Endpoints](#available-endpoints)
6. [Real-time Communication](#real-time-communication-reverb)
7. [Type-Safe API Client Example](#type-safe-api-client-example)
8. [Error Handling](#error-handling)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### TL;DR - Get Started in 5 Minutes

```bash
# 1. Install dependencies
npm install --save-dev openapi-typescript
npm install laravel-echo pusher-js

# 2. Generate TypeScript types from backend
npx openapi-typescript http://localhost:8000/api-documentation/json -o src/types/siblo-api.ts

# 3. Use generated types
import type { paths } from './types/siblo-api';

type LoginRequest = paths['/api/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];

//4. Make API calls
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'player@example.com', password: 'password' })
});

const data: LoginResponse = await response.json();
```

---

## Prerequisites

### Backend Requirements
- Laravel backend running at `http://localhost:8000` (or your configured URL)
- OpenAPI/Swagger documentation generated at `/api-documentation/json`
- Sanctum API authentication enabled
- Reverb WebSocket server running (for real-time battles)

### Game Client Requirements
- **Node.js**: v18+
- **TypeScript**: v5.0+
- **Package Manager**: npm or yarn
- **Build Tool**: Vite, Webpack, or similar

---

## TypeScript Type Generation Setup

### Step 1: Install Type Generator

```bash
npm install --save-dev openapi-typescript
```

### Step 2: Add npm Scripts

**File: `package.json`**

```json
{
  "name": "siblo-game",
  "scripts": {
    "generate-api-types": "openapi-typescript http://localhost:8000/api-documentation/json -o src/types/siblo-api.ts",
    "dev": "npm run generate-api-types && vite",
    "build": "npm run generate-api-types && vite build"
  },
  "devDependencies": {
    "openapi-typescript": "^6.7.0",
    "typescript": "^5.3.0"
  }
}
```

### Step 3: Generate Types

```bash
npm run generate-api-types
```

This creates `src/types/siblo-api.ts` with all backend API types!

### Step 4: Using Generated Types

```typescript
import type { paths } from './types/siblo-api';

// Extract specific endpoint types
type LoginRequest = paths['/api/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];

type GetQuizzesResponse = paths['/api/quizzes']['get']['responses']['200']['content']['application/json'];
type Quiz = GetQuizzesResponse['quizzes'][0];

// Now use them in your code with full type safety!
async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  return response.json();
}
```

---

## API Authentication

### Laravel Sanctum Token-Based Authentication

The backend uses **Laravel Sanctum** for API authentication. You'll receive a token upon login/registration that must be included in subsequent requests.

### Authentication Flow

```typescript
// 1. Register/Login to get token
const loginData = {
  email: 'player@example.com',
  password: 'password123'
};

const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});

const { token, user } = await response.json();

// 2. Store token (localStorage, cookie, or state management)
localStorage.setItem('sanctum_token', token);

// 3. Use token in all subsequent requests
const quizzesResponse = await fetch('http://localhost:8000/api/quizzes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});
```

### Token Storage Best Practices

**Option 1: localStorage (Simple)**
```typescript
localStorage.setItem('sanctum_token', token);
const token = localStorage.getItem('sanctum_token');
```

**Option 2: Cookie (More Secure)**
```typescript
document.cookie = `token=${token}; path=/; secure; samesite=strict`;
```

**Option 3: State Management (Recommended for complex apps)**
```typescript
// Using Zustand, Redux, or similar
import { useAuthStore } from './stores/auth';

const { setToken, getToken } = useAuthStore();
setToken(token);
```

---

## Available Endpoints

### Base URL

```
Production: https://api.siblo.com
Development: http://localhost:8000
```

### Authentication

#### POST /api/auth/register

Register a new student account.

**Request:**
```typescript
type RegisterRequest = {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  user_type: 'student' | 'teacher';
  trainer_name?: string; // Required for students
};
```

**Example:**
```typescript
const registerData: RegisterRequest = {
  name: 'Juan Dela Cruz',
  username: 'juandc',
  email: 'juan@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  user_type: 'student',
  trainer_name: 'Trainer Juan'
};

const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData)
});

const { user, token } = await response.json();
```

**Response:**
```typescript
{
  user: {
    id: 1,
    username: 'juandc',
    user_type: 'student'
  },
  token: '1|abc123tokenhere'
}
```

#### POST /api/auth/login

Login and receive Sanctum token.

**Request:**
```typescript
type LoginRequest = {
  email: string;
  password: string;
};
```

**Response:**
```typescript
{
  user: {
    id: 1,
    username: 'juandc',
    user_type: 'student'
  },
  token: '2|xyz456tokenhere'
}
```

#### POST /api/auth/logout

Revoke current token (requires authentication).

**Request:**
```typescript
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});
```

---

### Player Profile

#### GET /api/player/profile

Get current player's profile and stats.

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Response:**
```typescript
type PlayerProfile = {
  id: number;
  user_id: number;
  trainer_name: string;
  level: number;
  experience_points: number;
  coins: number;
  current_region_id: number | null;
};
```

**Example:**
```typescript
const response = await fetch('/api/player/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});

const profile: PlayerProfile = await response.json();
console.log(`Level: ${profile.level}, XP: ${profile.experience_points}`);
```

#### GET /api/player/siblons

Get player's Siblon collection.

**Response:**
```typescript
type PlayerSiblon = {
  id: number;
  species_id: number;
  nickname: string | null;
  level: number;
  current_hp: number;
  max_hp: number;
  attack_stat: number;
  defense_stat: number;
  speed_stat: number;
  is_in_party: boolean;
};

type SiblonsResponse = {
  party: PlayerSiblon[];
  collection: PlayerSiblon[];
};
```

---

### Quizzes

#### GET /api/quizzes

Get all published quizzes available to students.

**Query Parameters:**
- `difficulty` (optional): `easy`, `medium`, `hard`
- `subject` (optional): `Math`, `Science`, `English`, etc.

**Example:**
```typescript
const params = new URLSearchParams({
  difficulty: 'medium',
  subject: 'Math'
});

const response = await fetch(`/api/quizzes?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});

const { quizzes } = await response.json();
```

**Response:**
```typescript
type Quiz = {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  time_limit_minutes: number | null;
  max_attempts: number | null;
  question_count: number;
  is_featured: boolean;
};

type GetQuizzesResponse = {
  quizzes: Quiz[];
};
```

#### GET /api/quizzes/{id}

Get quiz details with questions (when student starts quiz).

**Response:**
```typescript
type QuizQuestion = {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'multiple_correct';
  points: number;
  choices: Array<{
    id: number;
    choice_text: string;
    order_index: number;
  }>;
};

type QuizDetail = {
  id: number;
  title: string;
  time_limit_minutes: number | null;
  questions: QuizQuestion[];
};
```

#### POST /api/quizzes/{id}/start

Start a quiz attempt.

**Response:**
```typescript
type StartQuizResponse = {
  attempt_id: number;
  quiz_id: number;
  started_at: string; // ISO 8601 timestamp
  expires_at: string | null;
};
```

**Example:**
```typescript
const response = await fetch(`/api/quizzes/${quizId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const attempt: StartQuizResponse = await response.json();
// Now student can answer questions
```

#### POST /api/quiz-attempts/{id}/submit

Submit quiz answers and receive results.

**Request:**
```typescript
type SubmitQuizRequest = {
  answers: Array<{
    question_id: number;
    selected_choice_ids: number[];
  }>;
};
```

**Example:**
```typescript
const submission: SubmitQuizRequest = {
  answers: [
    { question_id: 101, selected_choice_ids: [1] },
    { question_id: 102, selected_choice_ids: [2, 3] } // Multiple correct
  ]
};

const response = await fetch(`/api/quiz-attempts/${attemptId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(submission)
});

const result = await response.json();
```

**Response:**
```typescript
type SubmitQuizResponse = {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  rewards: {
    experience_points: number;
    coins: number;
    items: any[];
  };
  answers: Array<{
    question_id: number;
    is_correct: boolean;
    points_earned: number;
    explanation: string;
  }>;
};
```

---

### Battles

#### POST /api/battles/start

Initiate a new battle.

**Request:**
```typescript
type StartBattleRequest = {
  player_siblon_id: number;
  battle_type: 'pvp' | 'pve' | 'training';
  opponent_id?: number; // Required for PvP
};
```

**Example:**
```typescript
const battleData: StartBattleRequest = {
  player_siblon_id: 42,
  battle_type: 'pve'
};

const response = await fetch('/api/battles/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(battleData)
});

const battle = await response.json();
```

**Response:**
```typescript
type BattlePlayer = {
  user_id: number;
  siblon_id: number;
  hp: number;
  max_hp: number;
};

type StartBattleResponse = {
  battle_id: string; // UUID
  player1: BattlePlayer;
  player2: BattlePlayer;
  current_turn: number;
  turn_player_id: number;
};
```

#### GET /api/battles/{id}

Get current battle state.

**Response:**
```typescript
type BattleState = {
  battle_id: string;
  status: 'active' | 'completed' | 'abandoned';
  player1: BattlePlayer;
  player2: BattlePlayer;
  current_turn: number;
  turn_player_id: number;
  winner_id: number | null;
};
```

#### POST /api/battles/{id}/forfeit

Forfeit an active battle.

---

### Daily Activities

#### GET /api/player/daily-activity

Get today's activity summary.

**Response:**
```typescript
type DailyActivity = {
  activity_date: string;
  quizzes_completed: number;
  experience_gained: number;
  battles_won: number;
  battles_lost: number;
  login_streak: number;
};
```

---

## Real-time Communication (Reverb)

### Laravel Reverb WebSocket Server

The backend uses **Laravel Reverb** for real-time features (battles, notifications, etc.). You'll use **Laravel Echo** client library to connect.

### Installation

```bash
npm install laravel-echo pusher-js
```

### Setup Echo Client

**File: `src/utils/echo.ts`**

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'http://localhost:8000/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${yourSanctumToken}`
    }
  }
});
```

**Environment Variables (.env):**
```
VITE_REVERB_APP_KEY=your-reverb-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

### Battle System Integration

The battle system uses a **server-authoritative** approach:
- Clients send move **intentions** (not results)
- Backend calculates damage and HP
- Backend broadcasts authoritative results
- Clients animate based on server's calculation

#### Subscribe to Battle Channel

```typescript
import { echo } from './utils/echo';

const battleId = '550e8400-e29b-41d4-a716-446655440000';

// Join private battle channel
echo.private(`battle.${battleId}`)
  .listen('BattleStarted', (event) => {
    console.log('Battle started:', event);
    initializeBattle(event);
  })
  .listen('BattleMoveExecuted', (event) => {
    console.log('Move executed:', event);
    updateBattleState(event);
    animateMove(event);
  })
  .listen('BattleEnded', (event) => {
    console.log('Battle ended:', event);
    showBattleResults(event);
  });
```

#### Send Move Intention via Whisper

```typescript
// Player selects a move
function selectMove(moveId: string, targetSiblonId: number) {
  echo.private(`battle.${battleId}`)
    .whisper('move-intent', {
      player_id: currentPlayerId,
      move_id: moveId,
      target_siblon_id: targetSiblonId
    });
}
```

#### Handle Battle Events

```typescript
type BattleMoveExecuted = {
  battle_id: string;
  attacker_id: number;
  defender_id: number;
  move: string;
  damage: number;
  defender_new_hp: number;
  is_knockout: boolean;
  current_turn: number;
};

function updateBattleState(event: BattleMoveExecuted) {
  // Update HP based on server's calculation
  updateSiblonHP(event.defender_id, event.defender_new_hp);

  // Play damage animation
  animateAttack(event.attacker_id, event.defender_id, event.move);
  displayDamage(event.damage);

  // Check for knockout
  if (event.is_knockout) {
    showKnockoutAnimation(event.defender_id);
  }

  // Update turn indicator
  updateTurnIndicator(event.current_turn);
}

type BattleEnded = {
  battle_id: string;
  winner_id: number;
  rewards: {
    xp: number;
    coins: number;
  };
};

function showBattleResults(event: BattleEnded) {
  const isWinner = event.winner_id === currentPlayerId;

  if (isWinner) {
    showVictoryScreen(event.rewards);
    updatePlayerStats(event.rewards);
  } else {
    showDefeatScreen();
  }
}
```

---

## Type-Safe API Client Example

Here's a complete, production-ready API client wrapper:

**File: `src/api/client.ts`**

```typescript
import type { paths } from '../types/siblo-api';

// Extract types
type LoginRequest = paths['/api/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];
type RegisterRequest = paths['/api/auth/register']['post']['requestBody']['content']['application/json'];
type RegisterResponse = paths['/api/auth/register']['post']['responses']['201']['content']['application/json'];
type GetQuizzesResponse = paths['/api/quizzes']['get']['responses']['200']['content']['application/json'];
type QuizDetail = paths['/api/quizzes/{id}']['get']['responses']['200']['content']['application/json'];
type SubmitQuizRequest = paths['/api/quiz-attempts/{id}/submit']['post']['requestBody']['content']['application/json'];
type SubmitQuizResponse = paths['/api/quiz-attempts/{id}/submit']['post']['responses']['200']['content']['application/json'];
type StartBattleRequest = paths['/api/battles/start']['post']['requestBody']['content']['application/json'];
type StartBattleResponse = paths['/api/battles/start']['post']['responses']['200']['content']['application/json'];
type PlayerProfile = paths['/api/player/profile']['get']['responses']['200']['content']['application/json'];

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class SibloAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('sanctum_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('sanctum_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('sanctum_token');
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.message || 'API request failed',
        response.status,
        data.errors
      );
    }

    return data;
  }

  // Authentication
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  // Player
  async getProfile(): Promise<PlayerProfile> {
    return this.request<PlayerProfile>('/api/player/profile');
  }

  async getSiblons() {
    return this.request('/api/player/siblons');
  }

  // Quizzes
  async getQuizzes(params?: {
    difficulty?: string;
    subject?: string;
  }): Promise<GetQuizzesResponse> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<GetQuizzesResponse>(`/api/quizzes${queryString}`);
  }

  async getQuizDetail(quizId: number): Promise<QuizDetail> {
    return this.request<QuizDetail>(`/api/quizzes/${quizId}`);
  }

  async startQuiz(quizId: number) {
    return this.request(`/api/quizzes/${quizId}/start`, { method: 'POST' });
  }

  async submitQuiz(
    attemptId: number,
    data: SubmitQuizRequest
  ): Promise<SubmitQuizResponse> {
    return this.request<SubmitQuizResponse>(
      `/api/quiz-attempts/${attemptId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Battles
  async startBattle(data: StartBattleRequest): Promise<StartBattleResponse> {
    return this.request<StartBattleResponse>('/api/battles/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBattleState(battleId: string) {
    return this.request(`/api/battles/${battleId}`);
  }

  async forfeitBattle(battleId: string) {
    return this.request(`/api/battles/${battleId}/forfeit`, { method: 'POST' });
  }

  // Daily Activity
  async getDailyActivity() {
    return this.request('/api/player/daily-activity');
  }
}

// Export singleton instance
export const api = new SibloAPIClient();

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PlayerProfile,
  SubmitQuizRequest,
  SubmitQuizResponse,
  StartBattleRequest,
  StartBattleResponse,
};

export { APIError };
```

### Usage Example

```typescript
import { api, APIError } from './api/client';

async function loginAndPlay() {
  try {
    // Login
    const { user, token } = await api.login({
      email: 'player@example.com',
      password: 'password123'
    });

    console.log(`Welcome, ${user.username}!`);

    // Get player profile
    const profile = await api.getProfile();
    console.log(`Level: ${profile.level}, XP: ${profile.experience_points}`);

    // Fetch available quizzes
    const { quizzes } = await api.getQuizzes({ difficulty: 'easy' });
    console.log(`${quizzes.length} quizzes available`);

    // Start a quiz
    const quiz = quizzes[0];
    const attempt = await api.startQuiz(quiz.id);
    console.log(`Quiz started, attempt ID: ${attempt.attempt_id}`);

  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error ${error.statusCode}: ${error.message}`);
      if (error.errors) {
        console.error('Validation errors:', error.errors);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

---

## Error Handling

### API Error Responses

All errors follow this format:

```typescript
type APIErrorResponse = {
  message: string;
  errors?: Record<string, string[]>; // Validation errors
};
```

### Common Status Codes

- `200` - Success
- `201` - Created (e.g., registration)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (valid token, but no permission)
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

### Example Error Handling

```typescript
try {
  const response = await api.submitQuiz(attemptId, answers);
} catch (error) {
  if (error instanceof APIError) {
    switch (error.statusCode) {
      case 401:
        // Token expired or invalid - redirect to login
        window.location.href = '/login';
        break;
      case 422:
        // Validation errors
        console.error('Validation failed:', error.errors);
        showValidationErrors(error.errors);
        break;
      case 500:
        // Server error
        showErrorNotification('Server error. Please try again later.');
        break;
      default:
        showErrorNotification(error.message);
    }
  }
}
```

---

## Development Workflow

### Daily Workflow

1. **Backend developer makes API changes**
2. **Backend generates new OpenAPI spec:**
   ```bash
   php artisan l5-swagger:generate
   ```
3. **Game developer regenerates types:**
   ```bash
   npm run generate-api-types
   ```
4. **TypeScript catches breaking changes** at compile-time
5. **Fix errors before runtime!**

### Staying Synced

**Automated regeneration:**

```json
{
  "scripts": {
    "dev": "npm run generate-api-types && vite",
    "prebuild": "npm run generate-api-types"
  }
}
```

Now types auto-update every time you run `npm run dev`!

### Testing API Integration

**Use a tool like Postman or Thunder Client to test endpoints manually first:**

1. Login to get token
2. Save token as environment variable
3. Test each endpoint
4. Verify response format matches types

---

## Troubleshooting

### Types Not Generating

**Problem:** `npm run generate-api-types` fails

**Solutions:**
- Ensure backend is running at the specified URL
- Check that `/api-documentation/json` is accessible
- Try accessing `http://localhost:8000/api-documentation/json` in browser
- Check for CORS issues

### Authentication Errors (401)

**Problem:** Getting 401 Unauthorized errors

**Solutions:**
- Check that token is being sent: `Authorization: Bearer {token}`
- Verify token is valid (not expired)
- Ensure token is stored correctly
- Try logging in again

### CORS Errors

**Problem:** Browser blocks API requests

**Solutions:**
- Backend must allow your origin in CORS config
- Check `config/cors.php` on Laravel side
- For development, backend should allow `http://localhost:*`

### WebSocket Connection Fails

**Problem:** Laravel Echo can't connect to Reverb

**Solutions:**
- Ensure Reverb server is running: `php artisan reverb:start`
- Check environment variables match backend config
- Verify firewall/port settings
- Check browser console for WebSocket errors

### Type Mismatches

**Problem:** TypeScript errors after regenerating types

**Solutions:**
- This is GOOD! It means the API changed
- Review backend changes
- Update your code to match new types
- Contact backend team if changes are unexpected

---

## Additional Resources

- [Laravel Sanctum Documentation](https://laravel.com/docs/12.x/sanctum)
- [Laravel Echo Documentation](https://laravel.com/docs/12.x/broadcasting#client-side-installation)
- [Laravel Reverb Documentation](https://reverb.laravel.com)
- [OpenAPI TypeScript Generator](https://github.com/drwpow/openapi-typescript)

---

## Support

For questions or issues:

1. Check this documentation first
2. Review Laravel backend logs
3. Check browser console for errors
4. Contact backend team with specific error messages

---

**Good luck building the game! 🎮**
