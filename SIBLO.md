# SIBLO Game Client - Features & Context

## Project Overview

**SIBLO** is an educational RPG platform for Filipino students (grades 4-10) that gamifies learning through creature collection and evolution. This document covers the **Game Client** - the PixiJS-powered student-facing application.

**Tagline**: "tungo sa tagumpay"

### Core Concept
Students play an RPG where they collect and evolve creatures called **Siblons** by performing well on educational quizzes. Academic achievement directly translates to in-game power and progression.

---

## Architecture

### System Overview

The game client is a **separate PixiJS application** that communicates with a Laravel backend via RESTful API and WebSockets.

```
┌─────────────────────────────────────────────────────────┐
│                   SIBLO Game Client                      │
│                     (PixiJS App)                         │
│                                                          │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Battle   │  │    Quiz     │  │  Siblon     │     │
│  │   System   │  │   System    │  │ Collection  │     │
│  └────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Game State Management                   │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Laravel Backend API                     │
│                                                          │
│  - Authentication (Sanctum)                             │
│  - Quiz Management                                       │
│  - Battle Logic (Server-Authoritative)                  │
│  - Siblon Data & Evolution                              │
│  - Progress Tracking                                     │
│  - Rewards Calculation                                   │
└─────────────────────────────────────────────────────────┘
```

### Technical Stack

**Core Framework:**
- **Game Engine**: PixiJS v8 (2D WebGL renderer)
- **Language**: TypeScript
- **Build Tool**: Vite

**Networking:**
- **API Client**: Fetch API with Laravel Sanctum tokens
- **Real-time**: Laravel Echo.js (WebSocket via Reverb)
- **Authentication**: Token-based (Sanctum)

**State Management:**
- **Options**: Zustand, Redux Toolkit, or custom solution
- **Persistence**: LocalStorage for offline state

**Audio:**
- **Library**: Howler.js (cross-browser audio)
- **Format**: WebM/OGG for web compatibility

**Asset Management:**
- **Sprites**: PNG sprite sheets
- **Animations**: JSON-based (Spine/DragonBones) or frame-based
- **Loading**: PixiJS AssetLoader

---

## Prototype Strategy: Training Grounds

The prototype uses a contained **"Training Grounds"** environment rather than the full 8-region system.

### Scope of Prototype
- **No region progression** - single Training Grounds area
- **No grade restrictions** - all quizzes available to all students
- **Simplified Siblon collection** - subset of 20-30 species
- **Core gameplay loop** - Quiz → Rewards → Siblon Growth → Battle

### What This Tests
✅ Quiz integration and completion flow  
✅ Reward distribution and feedback  
✅ Siblon stats, leveling, and evolution  
✅ Turn-based battle mechanics  
✅ Player progression and engagement  

### What's Excluded (Post-Prototype)
❌ Regional exploration and unlocking  
❌ Story/narrative progression  
❌ Full 182 Siblon collection  
❌ Grade-level content gating  
❌ PvP matchmaking and rankings  

---

## Core Game Systems

### 1. Player Profile & Progression

#### Player Stats
- **Trainer Name**: Display name (set during registration)
- **Level**: Player level (earned through quiz XP)
- **Experience Points (XP)**: Total XP accumulated
- **Coins**: In-game currency for items/upgrades
- **Current Region**: Training Grounds (prototype)

#### Progression Mechanics
- **Leveling**: Gain XP from completing quizzes
- **Level Thresholds**: XP required increases per level
  - Level 1→2: 100 XP
  - Level 2→3: 250 XP
  - Level 3→4: 450 XP
  - Formula: `XP_required = baseXP * (level^1.5)`

#### Profile Screen UI
```
╔═══════════════════════════════════════════╗
║  TRAINER PROFILE                          ║
║                                           ║
║  [Avatar]  Trainer Juan                   ║
║            Level 15                       ║
║            ▓▓▓▓▓▓▓▓░░░░ 3,450 / 5,000 XP ║
║                                           ║
║  💰 Coins: 1,200                          ║
║  🏆 Battles Won: 23                       ║
║  📝 Quizzes Completed: 45                 ║
║  📚 Current Streak: 7 days                ║
║                                           ║
║  [View Siblons]  [View Achievements]     ║
╚═══════════════════════════════════════════╝
```

---

### 2. Siblon System

Siblons are collectible creatures that students train and battle with. Their growth is tied directly to educational performance.

#### Siblon Species Data Structure

```typescript
interface SiblonSpecies {
  id: number;
  name: string;
  dex_number: number; // Pokédex-style number (001-182)
  type_primary: ElementType; // "Fire", "Water", "Earth", etc.
  type_secondary?: ElementType;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  
  // Base Stats (at level 1)
  base_hp: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  
  // Evolution
  evolution_level?: number; // Level required to evolve
  evolves_to_species_id?: number;
  evolution_method: 'level' | 'quiz_mastery' | 'item';
  
  // Visual
  sprite_url: string;
  sprite_battle_url: string;
  description: string;
  
  // Regional Data (excluded in prototype)
  region?: string;
}
```

#### Player's Siblon (Instance)

```typescript
interface PlayerSiblon {
  id: number; // Unique instance ID
  player_id: number;
  species_id: number;
  species: SiblonSpecies; // Populated data
  
  nickname?: string; // Custom name
  level: number;
  experience_points: number;
  
  // Current Stats (base + growth)
  current_hp: number;
  max_hp: number;
  attack_stat: number;
  defense_stat: number;
  speed_stat: number;
  
  // Party Management
  is_in_party: boolean; // Max 6 in active party
  party_position?: number; // 1-6
  
  // Metadata
  caught_at: Date;
  total_battles: number;
  battles_won: number;
}
```

#### Siblon Stats & Growth

**Stat Calculation Formula:**
```typescript
function calculateStat(baseStat: number, level: number, statType: 'hp' | 'other'): number {
  if (statType === 'hp') {
    return Math.floor((2 * baseStat * level) / 100) + level + 10;
  } else {
    return Math.floor((2 * baseStat * level) / 100) + 5;
  }
}
```

**Example:**
- Flamara (Fire-type starter)
  - Base HP: 39
  - At Level 1: HP = 45
  - At Level 10: HP = 62
  - At Level 50: HP = 183

**Leveling Up:**
- Siblons gain XP from battles and quizzes
- Each level increases stats based on base stats
- Higher base stats = larger increases per level

#### Evolution System

**Three Evolution Types:**

1. **Level-Based Evolution**
   - Siblon reaches required level → Evolution prompt
   - Example: Flamara (Lv. 1) → Inferion (Lv. 16) → Pyroverus (Lv. 36)

2. **Quiz Mastery Evolution**
   - Complete 5 quizzes in a specific subject with 80%+ score
   - Example: Mathling → Algebro (Math Mastery)

3. **Item-Based Evolution**
   - Use special evolution item from quiz rewards
   - Example: Sparklet + Thunder Stone → Voltara

**Evolution UI Flow:**
```
[Siblon reaches evolution condition]
       ↓
[Bright flash animation]
       ↓
[Evolution cutscene - transformation]
       ↓
[New form revealed with stat comparison]
       ↓
[Player can cancel or confirm]
```

#### Subject Affinity System

Certain Siblons have **subject affinity** - they gain bonus XP when the player performs well on quizzes in their favored subject.

```typescript
interface SubjectAffinity {
  siblon_species_id: number;
  subject: 'Math' | 'Science' | 'English' | 'Filipino' | 'Social Studies';
  bonus_multiplier: number; // 1.5x XP for quizzes in this subject
}
```

**Example:**
- **Mathling** (Math affinity): Gets 150 XP from Math quiz instead of 100 XP
- **Scienceton** (Science affinity): Gets bonus from Science quizzes

This encourages students to:
- Build diverse Siblon teams
- Engage with multiple subjects
- Feel rewarded for subject expertise

---

### 3. Quiz System (Student-Facing)

#### Quiz Discovery & Selection

**Quiz Browser UI:**
```
╔═══════════════════════════════════════════════════════╗
║  AVAILABLE QUIZZES                    [Filter ▼]      ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  ⭐ [FEATURED] Grade 5 Math - Fractions               ║
║     🔥 Medium | ⏱️ 15 min | 📝 10 questions           ║
║     Rewards: 150 XP, 50 coins                         ║
║     [START QUIZ]                                      ║
║                                                        ║
║  📘 Science - The Water Cycle                         ║
║     🌱 Easy | ⏱️ 10 min | 📝 8 questions              ║
║     Rewards: 100 XP, 30 coins                         ║
║     [START QUIZ]                                      ║
║                                                        ║
║  📕 English - Reading Comprehension                   ║
║     💀 Hard | ⏱️ 20 min | 📝 15 questions             ║
║     Rewards: 250 XP, 100 coins, Mystery Item          ║
║     Attempts: 2/3 remaining                           ║
║     [RETRY QUIZ]                                      ║
╚═══════════════════════════════════════════════════════╝
```

**Filtering Options:**
- Subject (Math, Science, English, Filipino)
- Difficulty (Easy, Medium, Hard)
- Status (Not Started, In Progress, Completed)

#### Quiz Taking Flow

**1. Quiz Start:**
```typescript
// API Call
POST /api/quizzes/{id}/start

// Response
{
  attempt_id: 500,
  quiz_id: 10,
  started_at: "2025-11-10T10:30:00Z",
  expires_at: "2025-11-10T10:45:00Z", // Time limit
  questions: [...] // Full quiz data
}
```

**2. Question Display:**
```
╔═══════════════════════════════════════════════════════╗
║  Grade 5 Math - Fractions         Question 3 of 10    ║
║                                   ⏱️ 12:34 remaining   ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  What is 1/2 + 1/4?                                   ║
║                                                        ║
║  ⚪ A) 3/4                                             ║
║  ⚪ B) 2/6                                             ║
║  ⚪ C) 1/6                                             ║
║  ⚪ D) 3/6                                             ║
║                                                        ║
║  [PREVIOUS]              [SKIP]         [NEXT]        ║
╚═══════════════════════════════════════════════════════╝
```

**3. Answer Submission:**
- Student answers all questions
- Client collects answers in local state
- Submit all at once when finished

```typescript
// API Call
POST /api/quiz-attempts/{attempt_id}/submit

// Request
{
  answers: [
    { question_id: 101, selected_choice_ids: [1] },
    { question_id: 102, selected_choice_ids: [2, 3] } // Multiple correct
  ]
}

// Response
{
  score: 8,
  max_score: 10,
  percentage: 80,
  passed: true,
  rewards: {
    experience_points: 150,
    coins: 50,
    items: [],
    siblon_xp_distribution: [
      { siblon_id: 42, xp_gained: 120 }, // With affinity bonus
      { siblon_id: 78, xp_gained: 80 }
    ]
  },
  answers: [
    {
      question_id: 101,
      is_correct: true,
      correct_answer: "3/4",
      explanation: "1/2 + 1/4 = 2/4 + 1/4 = 3/4"
    }
  ]
}
```

**4. Results Screen:**
```
╔═══════════════════════════════════════════════════════╗
║                  QUIZ COMPLETE!                        ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║              ⭐⭐⭐ 80% - PASSED! ⭐⭐⭐               ║
║                                                        ║
║  Score: 8 / 10                                        ║
║  Time: 12 minutes 34 seconds                          ║
║                                                        ║
║  REWARDS EARNED:                                       ║
║  ✨ +150 Experience Points                            ║
║  💰 +50 Coins                                         ║
║                                                        ║
║  YOUR SIBLONS GREW STRONGER:                          ║
║  🔥 Flamara gained 120 XP! (Math Affinity Bonus!)    ║
║  💧 Aqualis gained 80 XP!                             ║
║                                                        ║
║  [VIEW ANSWERS]  [BACK TO QUIZZES]  [BATTLE!]        ║
╚═══════════════════════════════════════════════════════╝
```

#### Quiz Retry System
- Some quizzes allow multiple attempts (max_attempts field)
- Best score is kept
- Reduced rewards on retries (50% XP/coins)
- Encourages learning from mistakes

---

### 4. Battle System

The battle system is **turn-based** and **server-authoritative** to prevent cheating while maintaining the feel of a classic RPG.

#### Battle Types

1. **PvE (Training Battles)**
   - Fight AI-controlled wild Siblons
   - Earn XP and coins
   - Chance to catch new Siblons

2. **PvP (Player vs Player)**
   - Real-time battles against other students
   - Leaderboard rankings
   - Special PvP rewards

3. **Story Battles** (Post-Prototype)
   - Battles against "Gym Leaders" (Guro Bosses)
   - Regional progression gates
   - Unlock new areas

#### Battle Initiation

**From Overworld:**
```typescript
// Start a battle
const response = await fetch('/api/battles/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    player_siblon_id: 42, // Active Siblon
    battle_type: 'pve', // or 'pvp'
    opponent_id: null // For PvE, backend assigns wild Siblon
  })
});

const { battle_id, initial_state } = await response.json();

// Connect to battle WebSocket channel
Echo.private(`battle.${battle_id}`)
  .listen('BattleStarted', handleBattleStart)
  .listen('BattleMoveExecuted', handleMoveResult)
  .listen('BattleEnded', handleBattleEnd);
```

#### Battle UI

```
╔═══════════════════════════════════════════════════════════╗
║                    BATTLE - Turn 3                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║   OPPONENT                              YOUR SIBLON        ║
║   Rockito Lv.12                         Flamara Lv.15     ║
║   ▓▓▓▓▓▓░░░░ 28/45 HP                  ▓▓▓▓▓▓▓▓░░ 42/50 HP║
║                                                            ║
║   [Enemy Sprite]                        [Your Sprite]     ║
║                                                            ║
║                                                            ║
║   ┌─────────────────────────────────────────────────┐    ║
║   │ What will Flamara do?                           │    ║
║   │                                                  │    ║
║   │  [🔥 EMBER]      [🌟 QUICK ATTACK]             │    ║
║   │  Fire | 40 dmg   Normal | 30 dmg                │    ║
║   │                                                  │    ║
║   │  [🧪 POTION]     [🏃 RUN]                      │    ║
║   │  Heal 20 HP      Escape battle                  │    ║
║   └─────────────────────────────────────────────────┘    ║
╚═══════════════════════════════════════════════════════════╝
```

#### Battle Flow (Server-Authoritative)

**Client → Server → Client Pattern:**

```typescript
// 1. Player selects move (Client)
function selectMove(moveId: string) {
  // Send move intention via WebSocket
  Echo.private(`battle.${battleId}`)
    .whisper('move-intent', {
      player_id: playerId,
      move_id: moveId,
      target_siblon_id: opponentSiblonId
    });
  
  // Show "waiting" state
  showBattleMessage("Flamara is preparing to attack...");
}

// 2. Server receives, calculates, broadcasts (Backend - for context)
// Server calculates:
// - Type effectiveness (Fire vs Water = 0.5x damage)
// - Critical hits (10% chance for 1.5x damage)
// - Accuracy check
// - Damage = (Attack / Defense) * Move Power * Modifiers

// 3. Client receives authoritative result (Client)
Echo.private(`battle.${battleId}`)
  .listen('BattleMoveExecuted', (result) => {
    // result = {
    //   attacker_id, defender_id, move, damage,
    //   defender_new_hp, is_critical, is_knockout,
    //   message: "Flamara used Ember! It's super effective!"
    // }
    
    // Play attack animation
    animateMove(result.attacker_id, result.move);
    
    // Show damage number
    showDamagePopup(result.damage, result.is_critical);
    
    // Update HP bar with animation
    animateHPChange(result.defender_id, result.defender_new_hp);
    
    // Show battle text
    showBattleMessage(result.message);
    
    if (result.is_knockout) {
      playKnockoutAnimation(result.defender_id);
      // Battle ends automatically
    }
  });
```

#### Type Effectiveness System

**Elemental Types:**
- 🔥 Fire
- 💧 Water
- 🌱 Grass
- ⚡ Electric
- 🪨 Rock
- 💨 Wind
- ⭐ Normal

**Effectiveness Chart:**
```
Fire → Grass (2x)     Grass → Water (2x)    Water → Fire (2x)
Fire → Water (0.5x)   Grass → Fire (0.5x)   Water → Grass (0.5x)
Electric → Water (2x) Rock → Fire (2x)      etc.
```

#### Moves & Abilities

```typescript
interface Move {
  id: string;
  name: string;
  type: ElementType;
  category: 'physical' | 'special' | 'status';
  power: number; // 0 for status moves
  accuracy: number; // 0-100
  pp: number; // Power Points (uses per battle)
  description: string;
  effect?: MoveEffect; // Special effects (poison, burn, stat changes)
}

// Example Moves
const MOVE_DATABASE = {
  tackle: {
    name: "Tackle",
    type: "Normal",
    power: 30,
    accuracy: 100,
    category: "physical"
  },
  ember: {
    name: "Ember",
    type: "Fire",
    power: 40,
    accuracy: 100,
    category: "special",
    effect: { type: 'burn', chance: 10 }
  },
  water_gun: {
    name: "Water Gun",
    type: "Water",
    power: 40,
    accuracy: 100,
    category: "special"
  }
};
```

Each Siblon learns moves as they level up:
- Level 1: Basic move (Tackle)
- Level 5: Type move (Ember for Fire types)
- Level 10: Secondary move
- Level 15: Powerful move
- Evolution: Special signature move

#### Battle Rewards

**Victory Rewards:**
- **XP for all party Siblons** (distributed based on participation)
- **Coins** (based on opponent level)
- **Chance for items** (Potions, Evolution Stones)
- **Rare: Wild Siblon catch opportunity** (PvE only)

**Reward Calculation:**
```typescript
function calculateBattleRewards(
  playerLevel: number,
  opponentLevel: number,
  battleType: 'pve' | 'pvp'
): BattleRewards {
  const baseXP = opponentLevel * 50;
  const levelDiff = opponentLevel - playerLevel;
  const difficultyMultiplier = 1 + (levelDiff * 0.1); // Harder = more XP
  
  return {
    experience_points: Math.floor(baseXP * difficultyMultiplier),
    coins: opponentLevel * 10,
    items: rollItemDrops(),
    can_catch: battleType === 'pve' && Math.random() < 0.3 // 30% catch chance
  };
}
```

---

### 5. Training Grounds Environment

The prototype takes place in a single contained area: **The Training Grounds**.

#### Environment Design

**Visual Theme:**
- Open field with training dummies
- Small pond for Water-type Siblons
- Rocky area for Rock-type Siblons
- Central building: Quiz Hall
- NPCs: Tutorial Guide, Battle Trainer, Quiz Master

#### Key Locations

**1. Quiz Hall** 📚
- Central building where students access quizzes
- NPC: Quiz Master Guro (Teacher character)
- Browse and start quizzes
- View quiz history

**2. Training Arena** ⚔️
- Open area for PvE battles
- Wild Siblons spawn here
- NPC: Battle Trainer (explains battle mechanics)

**3. Siblon Center** 🏥
- Heal all Siblons for free
- NPC: Nurse character
- Access Siblon storage (view collection)

**4. Player Home** 🏠
- Safe area, no encounters
- Access profile, settings, logout
- Future: Customize room with rewards

#### Overworld Navigation

**Movement:**
- WASD or Arrow Keys for keyboard
- Virtual D-pad for mobile
- Click-to-move for mouse

**Interactions:**
- E key or tap to interact with NPCs/objects
- Automatic dialogue when approaching NPCs

**Random Encounters:**
- Walking in tall grass triggers wild Siblon battles (PvE)
- Visual indicator: grass shakes before encounter
- Can be avoided by staying on paths

---

### 6. Rewards & Progression Loop

The core gameplay loop that ties learning to gaming:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Complete Quiz (80%+)                                 │
│         ↓                                              │
│   Earn XP + Coins                                      │
│         ↓                                              │
│   Siblons Level Up (with subject affinity bonuses)    │
│         ↓                                              │
│   Siblons Evolve (at thresholds)                      │
│         ↓                                              │
│   Stronger Siblons Win More Battles                    │
│         ↓                                              │
│   Battle Rewards → More XP/Coins                       │
│         ↓                                              │
│   Use Coins to Buy Items/Upgrades                      │
│         ↓                                              │
│   Motivation to Complete More Quizzes ────┐           │
│         ↑                                  │           │
│         └──────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Direct Quiz → Game Benefits

**Passing a Quiz (60%+ threshold) gives:**
- Base XP and coins
- Siblon XP distributed to party
- Small chance for item reward

**Achieving 80%+ gives:**
- 1.5x XP multiplier
- Bonus coins
- Better item drop rates
- "Excellence Badge" on quiz record

**Achieving 100% (perfect score) gives:**
- 2x XP multiplier
- Rare item guaranteed
- "Perfect!" achievement
- Unlocks special cosmetics

**Subject Mastery Benefits:**
- Complete 5 quizzes in same subject at 80%+ → Subject Badge
- Subject Badge unlocks special Siblon evolutions
- Rare Siblons appear more frequently

#### Daily Rewards & Streaks

**Login Streaks:**
- Day 1: 50 coins
- Day 3: 100 coins + Potion
- Day 7: 500 coins + Rare Item + XP Boost
- Day 30: Legendary Siblon Egg

**Daily Quests:**
- Complete 1 quiz (Reward: 100 XP, 30 coins)
- Win 3 battles (Reward: 150 XP, 50 coins)
- Level up any Siblon (Reward: 200 XP, 100 coins)

---

## Game Screens & UI

### Main Menu

```
╔═══════════════════════════════════════════════════════╗
║                                                        ║
║                    S I B L O                          ║
║                 tungo sa tagumpay                     ║
║                                                        ║
║                                                        ║
║                  [CONTINUE]                           ║
║                  [NEW GAME]                           ║
║                  [SETTINGS]                           ║
║                  [LOGOUT]                             ║
║                                                        ║
║                                                        ║
║  Welcome back, Trainer Juan!                          ║
║  Level 15 | Last played: 2 hours ago                  ║
╚═══════════════════════════════════════════════════════╝
```

### Overworld HUD

```
╔═══════════════════════════════════════════════════════════╗
║ 👤 Juan Lv.15 | 💰 1,200 | ⭐ 3,450/5,000 XP      ⚙️ 📱 ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║                                                            ║
║                    [GAME WORLD VIEW]                      ║
║                                                            ║
║                    Player sprite here                     ║
║                    NPCs, environment                      ║
║                                                            ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║ PARTY:                                                     ║
║ [🔥Flamara Lv.15 ▓▓▓▓▓▓▓░ 42/50]  [💧Aqualis Lv.12 ...]║
╚═══════════════════════════════════════════════════════════╝
```

### Siblon Collection Screen

```
╔═══════════════════════════════════════════════════════════╗
║  SIBLON COLLECTION                   Collected: 8 / 182   ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  [Sprite] #001 Flamara         [Sprite] #002 Inferion    ║
║  Fire Type | Lv. 15            Fire Type | Lv. 28        ║
║  ⭐⭐⭐ (Owned)                 ❌ Not Owned                ║
║                                                            ║
║  [Sprite] #003 Pyroverus       [Sprite] #004 Aqualis     ║
║  Fire Type | Lv. 42            Water Type | Lv. 12       ║
║  ❌ Not Owned                   ⭐⭐⭐ (Owned)              ║
║                                                            ║
║  [SORT: Dex #]  [FILTER: Type ▼]  [VIEW: Party]         ║
╚═══════════════════════════════════════════════════════════╝
```

### Party Management Screen

```
╔═══════════════════════════════════════════════════════════╗
║  ACTIVE PARTY (6 max)                                     ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  1. [🔥 Flamara Lv.15]     HP: 42/50  Atk: 35  Def: 28   ║
║     Moves: Ember, Quick Attack, Flame Wheel              ║
║     [VIEW DETAILS]  [REMOVE FROM PARTY]                  ║
║                                                            ║
║  2. [💧 Aqualis Lv.12]     HP: 38/40  Atk: 28  Def: 32   ║
║     Moves: Water Gun, Tackle, Bubble Beam                ║
║     [VIEW DETAILS]  [REMOVE FROM PARTY]                  ║
║                                                            ║
║  3. [Empty Slot]                                          ║
║     [ADD FROM COLLECTION]                                 ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║  COLLECTION (Not in Party)                                ║
║  • Rockito Lv.10  • Sparklet Lv.8  • Leafeon Lv.9       ║
║    [Add to Party]    [Add to Party]   [Add to Party]     ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Technical Implementation Details

### Project Structure

```
siblo-game-client/
├── src/
│   ├── main.ts                 # Entry point
│   ├── Game.ts                 # Main Game class
│   │
│   ├── scenes/                 # Game scenes
│   │   ├── MenuScene.ts
│   │   ├── OverworldScene.ts
│   │   ├── BattleScene.ts
│   │   ├── QuizScene.ts
│   │   └── SiblonCollectionScene.ts
│   │
│   ├── entities/               # Game objects
│   │   ├── Player.ts
│   │   ├── Siblon.ts
│   │   ├── NPC.ts
│   │   └── WildSiblon.ts
│   │
│   ├── systems/                # Core game systems
│   │   ├── BattleSystem.ts
│   │   ├── QuizSystem.ts
│   │   ├── ProgressionSystem.ts
│   │   └── RewardSystem.ts
│   │
│   ├── api/                    # Backend communication
│   │   ├── ApiClient.ts        # Fetch wrapper with auth
│   │   ├── AuthService.ts
│   │   ├── QuizService.ts
│   │   ├── BattleService.ts
│   │   └── WebSocketManager.ts # Laravel Echo setup
│   │
│   ├── state/                  # State management
│   │   ├── GameState.ts        # Global game state
│   │   ├── PlayerStore.ts      # Zustand store
│   │   └── BattleStore.ts
│   │
│   ├── ui/                     # UI components
│   │   ├── HUD.ts
│   │   ├── DialogBox.ts
│   │   ├── BattleMenu.ts
│   │   └── QuizInterface.ts
│   │
│   ├── utils/                  # Utilities
│   │   ├── AssetLoader.ts
│   │   ├── AudioManager.ts
│   │   ├── InputManager.ts
│   │   └── calculations.ts     # Damage formulas, etc.
│   │
│   └── config/                 # Configuration
│       ├── constants.ts
│       ├── moves.ts            # Move database
│       └── typeChart.ts        # Type effectiveness
│
├── public/
│   ├── assets/
│   │   ├── sprites/           # Character & Siblon sprites
│   │   ├── backgrounds/       # Scene backgrounds
│   │   ├── ui/                # UI elements
│   │   └── audio/             # Music & SFX
│   │
│   └── index.html
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Core Classes

#### Game.ts (Main Game Loop)

```typescript
import * as PIXI from 'pixi.js';
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';

export class Game {
  private app: PIXI.Application;
  private currentScene: PIXI.Container | null = null;
  
  constructor() {
    this.app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
    });
    
    document.body.appendChild(this.app.view as HTMLCanvasElement);
    
    // Start with menu scene
    this.loadScene(new MenuScene(this));
    
    // Game loop
    this.app.ticker.add(this.update.bind(this));
  }
  
  loadScene(scene: PIXI.Container) {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
    }
    
    this.currentScene = scene;
    this.app.stage.addChild(scene);
  }
  
  private update(delta: number) {
    // Update current scene
    if (this.currentScene && 'update' in this.currentScene) {
      (this.currentScene as any).update(delta);
    }
  }
}
```

#### ApiClient.ts (Backend Communication)

```typescript
export class ApiClient {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  private token: string | null = null;
  
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Convenience methods
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

#### WebSocketManager.ts (Real-time)

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export class WebSocketManager {
  private echo: Echo | null = null;
  
  connect(token: string) {
    window.Pusher = Pusher;
    
    this.echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: import.meta.env.VITE_REVERB_PORT,
      wssPort: import.meta.env.VITE_REVERB_PORT,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
  
  joinBattleChannel(battleId: string, callbacks: BattleCallbacks) {
    if (!this.echo) throw new Error('WebSocket not connected');
    
    return this.echo.private(`battle.${battleId}`)
      .listen('BattleStarted', callbacks.onStart)
      .listen('BattleMoveExecuted', callbacks.onMove)
      .listen('BattleEnded', callbacks.onEnd)
      .listenForWhisper('move-intent', callbacks.onOpponentMove);
  }
  
  whisperMove(battleId: string, moveData: MoveIntent) {
    if (!this.echo) throw new Error('WebSocket not connected');
    
    this.echo.private(`battle.${battleId}`)
      .whisper('move-intent', moveData);
  }
}

export const wsManager = new WebSocketManager();
```

### State Management Example (Zustand)

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerState {
  // Profile
  userId: number | null;
  username: string;
  trainerName: string;
  level: number;
  experiencePoints: number;
  coins: number;
  
  // Siblons
  party: PlayerSiblon[];
  collection: PlayerSiblon[];
  
  // Progress
  quizzesCompleted: number;
  battlesWon: number;
  loginStreak: number;
  
  // Actions
  setProfile: (profile: PlayerProfile) => void;
  addExperience: (xp: number) => void;
  addCoins: (amount: number) => void;
  updateParty: (party: PlayerSiblon[]) => void;
  levelUpSiblon: (siblonId: number, newLevel: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      // Initial state
      userId: null,
      username: '',
      trainerName: '',
      level: 1,
      experiencePoints: 0,
      coins: 0,
      party: [],
      collection: [],
      quizzesCompleted: 0,
      battlesWon: 0,
      loginStreak: 0,
      
      // Actions
      setProfile: (profile) => set({ ...profile }),
      
      addExperience: (xp) => set((state) => {
        const newXP = state.experiencePoints + xp;
        const newLevel = calculateLevel(newXP);
        return {
          experiencePoints: newXP,
          level: newLevel > state.level ? newLevel : state.level,
        };
      }),
      
      addCoins: (amount) => set((state) => ({
        coins: state.coins + amount
      })),
      
      updateParty: (party) => set({ party }),
      
      levelUpSiblon: (siblonId, newLevel) => set((state) => ({
        party: state.party.map(s => 
          s.id === siblonId ? { ...s, level: newLevel } : s
        ),
        collection: state.collection.map(s =>
          s.id === siblonId ? { ...s, level: newLevel } : s
        )
      })),
    }),
    {
      name: 'siblo-player-storage',
      partialize: (state) => ({
        // Only persist specific fields
        userId: state.userId,
        username: state.username,
        trainerName: state.trainerName,
      }),
    }
  )
);
```

---

## Asset Requirements

### Sprites

**Character Sprites:**
- Player (8-directional movement, 32x32px per frame)
- NPCs (static or simple animation, 32x32px)

**Siblon Sprites:**
- Overworld sprites (16x16px or 24x24px for small display)
- Battle sprites (96x96px front view for opponent, 128x128px back view for player's Siblon)
- Evolution animation frames

**UI Elements:**
- Dialogue boxes (9-slice scaling)
- Button states (normal, hover, pressed)
- HP bars, XP bars
- Menu backgrounds

### Audio

**Music:**
- Main menu theme
- Overworld exploration theme
- Battle theme (normal)
- Battle theme (boss) - post-prototype
- Victory fanfare
- Quiz completion jingle

**Sound Effects:**
- Menu select/confirm
- Battle moves (unique per type)
- Damage taken
- Level up chime
- Evolution fanfare
- Coin collect
- Quiz correct/incorrect answer

---

## Performance Considerations

### Optimization Strategies

**Sprite Atlases:**
- Combine multiple sprites into texture atlases
- Reduce draw calls
- Use PIXI's sprite sheet loader

**Object Pooling:**
- Reuse battle objects (damage numbers, particles)
- Don't destroy/recreate frequently used entities

**Level of Detail:**
- Reduce sprite quality on low-end devices
- Simplify particle effects
- Lower audio quality as fallback

**Lazy Loading:**
- Load battle sprites only when entering battle
- Preload next scene assets during transitions
- Unload unused assets

**Network Optimization:**
- Cache API responses where possible
- Compress WebSocket messages
- Batch non-critical updates

### Target Performance
- **Desktop**: 60 FPS constant
- **Mobile**: 30 FPS minimum, 60 FPS target
- **Network**: <200ms quiz submission latency
- **Battle**: <300ms move execution latency

---

## Accessibility Features

### Controls
- **Keyboard**: Full navigation with WASD/Arrows + E/Enter/Esc
- **Mouse**: Click-to-move, clickable UI
- **Touch**: Virtual D-pad, tap interactions
- **Gamepad**: Support for common controllers (post-prototype)

### Visual Accessibility
- **Colorblind Modes**: Type icons have symbols, not just colors
- **Text Scaling**: Adjustable font size in settings
- **High Contrast**: Optional high-contrast UI mode
- **Screen Reader**: Alt text for important UI elements (limited in PixiJS)

### Audio Accessibility
- **Subtitles**: For NPC dialogue and battle text
- **Visual Cues**: Screen shake, flash effects for audio events
- **Mute Options**: Separate volume for music/SFX

---

## Progressive Web App (PWA) Features

### Offline Support
- Cache game assets for offline gameplay
- Local save state (syncs when online)
- Offline quiz attempts (submitted when reconnected)

### Mobile Installation
- Add to Home Screen prompt
- Full-screen mode on mobile
- Mobile-optimized touch controls
- Responsive UI scaling

---

## Post-Prototype Expansion

### Full Regional System (Grades 4-10)
- **8 Regions** = 8 Grade Levels
- Each region has unique Siblons, themes, and "Guro Bosses"
- Story progression gates require quiz mastery

### Advanced Features
- **Trading System**: Trade Siblons with classmates
- **Guilds/Teams**: School-based teams compete on leaderboards
- **Seasonal Events**: Limited-time quizzes and special Siblons
- **Achievements**: 100+ achievements for completionists
- **Customization**: Trainer avatar customization, Siblon nicknames

### Social Features
- **Friend System**: Add friends, view their progress
- **PvP Leaderboards**: Weekly/monthly rankings
- **Cooperative Quizzes**: Team up for group quizzes
- **Spectate Battles**: Watch other players' battles

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Project setup (Vite + PixiJS + TypeScript)
- ✅ Basic scene management
- ✅ Asset loading system
- ✅ Player movement in overworld
- API client integration
- Authentication flow

### Phase 2: Quiz Integration (Weeks 3-4)
- Quiz browser UI
- Quiz-taking interface
- Answer submission
- Results screen with rewards
- Quiz completion persistence

### Phase 3: Siblon System (Weeks 5-6)
- Siblon data models
- Collection screen UI
- Party management
- Leveling and stat calculations
- Evolution system
- Subject affinity bonuses

### Phase 4: Battle System (Weeks 7-9)
- Battle scene setup
- Turn-based battle flow
- WebSocket integration for real-time battles
- Move animations and effects
- Type effectiveness system
- Battle rewards

### Phase 5: Overworld & NPCs (Weeks 10-11)
- Training Grounds map design
- NPC interactions
- Wild Siblon encounters
- Dialogue system
- Location transitions

### Phase 6: Polish & Testing (Weeks 12-14)
- UI/UX improvements
- Sound effects and music
- Performance optimization
- Bug fixes
- Playtesting with students
- Balance adjustments

### Phase 7: Integration Testing (Week 15)
- End-to-end testing with backend
- Cross-browser testing
- Mobile device testing
- Network latency testing
- Final adjustments

---

## Success Metrics

### Engagement Metrics
- **Daily Active Users (DAU)**
- **Average session length**
- **Quiz completion rate**
- **Battle participation rate**
- **Return rate (day 1, day 7, day 30)**

### Learning Metrics
- **Quizzes completed per week**
- **Average quiz scores**
- **Improvement over time (score trends)**
- **Subject engagement distribution**

### Technical Metrics
- **Client-side FPS** (target: 60fps)
- **API response times** (target: <200ms)
- **Battle move latency** (target: <300ms)
- **Asset load times** (target: <3s initial load)
- **Crash rate** (target: <1%)

---

## Appendix: API Reference Summary

For complete API documentation, refer to the Teacher Platform documentation. Key endpoints used by game client:

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Login and get token
- `POST /api/auth/logout` - Revoke token

### Player
- `GET /api/player/profile` - Get profile and stats
- `GET /api/player/siblons` - Get Siblon collection
- `GET /api/player/daily-activity` - Get today's activity

### Quizzes
- `GET /api/quizzes` - List available quizzes
- `GET /api/quizzes/{id}` - Get quiz details
- `POST /api/quizzes/{id}/start` - Start quiz attempt
- `POST /api/quiz-attempts/{id}/submit` - Submit answers

### Battles
- `POST /api/battles/start` - Initiate battle
- `GET /api/battles/{id}` - Get battle state
- `POST /api/battles/{id}/forfeit` - Forfeit battle
- WebSocket: `battle.{id}` - Real-time battle events

---

*Document Version: 1.0*  
*Last Updated: November 10, 2025*  
*Project: SIBLO Educational RPG Platform*  
*Focus: Game Client (PixiJS) - Student-Facing Application*