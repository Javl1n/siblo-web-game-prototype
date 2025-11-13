# SIBLO Game Client

**tungo sa tagumpay**

Educational RPG game for Filipino students (grades 4-10). Collect and evolve creatures called Siblons by performing well on educational quizzes.

## Tech Stack

- **Game Engine**: PixiJS v8 (Pure PixiJS, no React)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Backend**: Laravel 12 + Sanctum + Reverb (separate repository)

---

## Setup Instructions

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: Latest version (recommended) or npm
- **Laravel Backend**: Must be running (see [SERVER.md](SERVER.md) for backend details)

### First-Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd siblo-web-game
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure for your environment:
   ```env
   # Development
   VITE_API_URL=http://localhost:8000
   VITE_GAME_DEBUG=true

   # Production
   VITE_API_URL=https://api.siblo.com
   VITE_GAME_DEBUG=false
   ```

4. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open browser**

   Navigate to `http://localhost:5173`

---

## Environment Configuration

This project uses environment-based configuration for easy deployment across different environments (dev, staging, production).

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Laravel backend URL | `http://localhost:8000` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `10000` |
| `VITE_REVERB_APP_KEY` | Reverb app key | - |
| `VITE_REVERB_HOST` | Reverb server host | `localhost` |
| `VITE_REVERB_PORT` | Reverb server port | `8080` |
| `VITE_REVERB_SCHEME` | Reverb connection scheme | `http` |
| `VITE_GAME_WIDTH` | Game canvas width (px) | `800` |
| `VITE_GAME_HEIGHT` | Game canvas height (px) | `600` |
| `VITE_GAME_DEBUG` | Enable debug logging | `false` |

### Environment-Specific Configuration

**Development:**
```env
VITE_API_URL=http://localhost:8000
VITE_REVERB_SCHEME=http
VITE_GAME_DEBUG=true
```

**Staging:**
```env
VITE_API_URL=https://staging-api.siblo.com
VITE_REVERB_SCHEME=https
VITE_GAME_DEBUG=true
```

**Production:**
```env
VITE_API_URL=https://api.siblo.com
VITE_REVERB_SCHEME=https
VITE_GAME_DEBUG=false
```

---

## Project Structure

```
src/
├── config/                  # Configuration files
│   ├── env.ts              # Environment variable loader
│   ├── constants.ts        # Game constants
│   └── apiEndpoints.ts     # API endpoint definitions
├── api/                     # Backend communication
│   ├── ApiClient.ts        # HTTP client with auth
│   ├── types.ts            # TypeScript API types
│   ├── AuthService.ts      # Authentication
│   ├── PlayerService.ts    # Player endpoints
│   ├── QuizService.ts      # Quiz endpoints (coming soon)
│   └── BattleService.ts    # Battle endpoints (coming soon)
├── state/                   # Zustand state stores
│   ├── authStore.ts        # Authentication state
│   └── playerStore.ts      # Player profile state
├── scenes/                  # Game scenes
│   ├── BaseScene.ts        # Abstract base class
│   ├── MenuScene.ts        # Login/Register
│   ├── OverworldScene.ts   # Exploration (coming soon)
│   ├── BattleScene.ts      # Battles (coming soon)
│   └── QuizScene.ts        # Quizzes (coming soon)
├── systems/                 # Core game systems
│   └── SceneManager.ts     # Scene lifecycle management
├── ui/                      # PixiJS UI components
│   ├── Button.ts           # Interactive button
│   └── TextField.ts        # Text input field
├── entities/                # Game objects (coming soon)
├── Game.ts                  # Main game class
└── main.ts                  # Entry point
```

---

## Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

---

## Architecture

### Pure PixiJS Implementation

This game uses **Pure PixiJS** (no React) for optimal performance and unified codebase:

- **Scene System**: Manage different game screens (Menu, Overworld, Battle, Quiz)
- **State Management**: Zustand for global state (auth, player data, etc.)
- **API Integration**: Type-safe HTTP client with Sanctum authentication
- **UI Components**: Custom PixiJS components (Button, TextField, etc.)

### Key Systems

1. **SceneManager**: Handles scene loading, transitions, and lifecycle
2. **API Client**: Communicates with Laravel backend
3. **Auth Store**: Manages login/register state
4. **Player Store**: Manages player profile and Siblon collection

---

## Backend Integration

This game client connects to a Laravel backend for:

- **Authentication**: User registration and login (Sanctum tokens)
- **Player Data**: Profile, level, XP, coins
- **Quizzes**: Browse, take, and submit quizzes
- **Battles**: Real-time turn-based battles (WebSocket via Reverb)
- **Siblons**: Creature collection and evolution

See [SERVER.md](SERVER.md) for complete backend API documentation.

---

## Portable Deployment

This codebase is designed to be easily portable across environments:

1. **Clone repository** to new machine/server
2. **Copy `.env.example` to `.env`**
3. **Configure environment** variables for that environment
4. **Install dependencies** with `pnpm install`
5. **Build or run** with `pnpm build` or `pnpm dev`

No code changes needed! All environment-specific configuration is in `.env`.

---

## Development Status

### ✅ Completed

- Environment configuration system
- Pure PixiJS architecture
- API client with authentication
- Zustand state management
- Scene management system
- Basic UI components (Button, TextField)
- MenuScene skeleton

### 🚧 In Progress

- Login/Register forms
- Quiz system integration
- Battle system integration

### 📋 Planned

- Overworld exploration
- Siblon collection system
- Audio system
- Animation effects

---

## Documentation

- **[SIBLO.md](SIBLO.md)**: Complete game design specification
- **[SERVER.md](SERVER.md)**: Backend API integration guide

---

## Support

For questions or issues:

1. Check this README and documentation files
2. Review browser console for errors
3. Verify `.env` configuration
4. Ensure Laravel backend is running
5. Check backend logs if API calls fail

---

## License

Proprietary - All rights reserved

---

**Good luck building the game! 🎮**
