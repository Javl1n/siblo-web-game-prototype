# Sprite Sheet Usage Guide

This guide shows you how to use sprite sheets in your PixiJS game.

## Table of Contents
1. [What is a Sprite Sheet?](#what-is-a-sprite-sheet)
2. [Preparing Your Sprite Sheet](#preparing-your-sprite-sheet)
3. [Using Sprite Sheets in the Game](#using-sprite-sheets)
4. [Creating Animated Sprites](#creating-animated-sprites)
5. [Tools for Creating Sprite Sheets](#tools-for-creating-sprite-sheets)

---

## What is a Sprite Sheet?

A sprite sheet (also called a texture atlas) is a single image that contains multiple smaller images (sprites). This is more efficient than loading individual images because:
- Reduces the number of HTTP requests
- Improves rendering performance (fewer texture switches)
- Reduces memory usage

**Example sprite sheet structure:**
```
┌─────────────────────────────────┐
│ [idle1] [idle2] [idle3] [idle4] │
│ [walk1] [walk2] [walk3] [walk4] │
│ [jump1] [jump2] [attack1] [...]│
└─────────────────────────────────┘
```

---

## Preparing Your Sprite Sheet

### Option 1: Using TexturePacker (Recommended)

1. Download [TexturePacker](https://www.codeandweb.com/texturepacker)
2. Import your sprite images
3. Export as "PixiJS" format
4. You'll get two files:
   - `spritesheet.png` - The image
   - `spritesheet.json` - The frame data

### Option 2: Manual JSON Format

If you create the sprite sheet manually, use this JSON structure:

```json
{
  "frames": {
    "player_idle_01.png": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 }
    },
    "player_idle_02.png": {
      "frame": { "x": 64, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 }
    }
  },
  "meta": {
    "scale": "1"
  }
}
```

### Option 3: Using Individual Images (Grid-based)

If your sprites are in a uniform grid:

```typescript
import * as PIXI from 'pixi.js';

// Load the sprite sheet image
const texture = await PIXI.Assets.load('/assets/spritesheet.png');

// Create textures from regions
const frameWidth = 64;
const frameHeight = 64;
const frames: PIXI.Texture[] = [];

for (let i = 0; i < 4; i++) {
  const rect = new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
  frames.push(new PIXI.Texture({
    source: texture.source,
    frame: rect,
  }));
}
```

---

## Using Sprite Sheets in the Game

### Method 1: Using AssetLoader (Recommended)

```typescript
import { AssetLoader } from './game/systems/AssetLoader';
import { AnimatedPlayer } from './game/entities/AnimatedPlayer';

// In your GameEngine initialization
async initAssets() {
  const loader = AssetLoader.getInstance();

  // Load a sprite sheet with JSON
  await loader.loadSpriteSheet(
    'player',
    '/assets/player-spritesheet.png',
    '/assets/player-spritesheet.json'
  );

  // Get the sprite sheet
  const spritesheet = loader.getAsset('player');

  // Extract specific animation frames
  const idleFrames = [
    spritesheet.textures['player_idle_01.png'],
    spritesheet.textures['player_idle_02.png'],
    spritesheet.textures['player_idle_03.png'],
    spritesheet.textures['player_idle_04.png'],
  ];

  const walkFrames = [
    spritesheet.textures['player_walk_01.png'],
    spritesheet.textures['player_walk_02.png'],
    spritesheet.textures['player_walk_03.png'],
    spritesheet.textures['player_walk_04.png'],
  ];

  // Create animated player
  const player = new AnimatedPlayer(idleFrames, 400, 300);
  player.addAnimation('walk', walkFrames);

  this.app.stage.addChild(player.sprite);
}
```

### Method 2: Direct Loading

```typescript
import * as PIXI from 'pixi.js';

// Load sprite sheet directly
const texture = await PIXI.Assets.load('/assets/player.png');
const spritesheetData = await fetch('/assets/player.json').then(r => r.json());

const spritesheet = new PIXI.Spritesheet(texture, spritesheetData);
await spritesheet.parse();

// Create animated sprite
const animatedSprite = new PIXI.AnimatedSprite(
  Object.values(spritesheet.textures)
);
animatedSprite.animationSpeed = 0.1;
animatedSprite.play();
```

### Method 3: Loading Multiple Assets

```typescript
const loader = AssetLoader.getInstance();

await loader.loadMultiple([
  {
    name: 'player',
    path: '/assets/player-spritesheet.png',
    type: 'spritesheet',
    jsonPath: '/assets/player-spritesheet.json',
  },
  {
    name: 'enemies',
    path: '/assets/enemies-spritesheet.png',
    type: 'spritesheet',
    jsonPath: '/assets/enemies-spritesheet.json',
  },
  {
    name: 'background',
    path: '/assets/background.png',
    type: 'texture',
  },
]);
```

---

## Creating Animated Sprites

### Example 1: Simple Animation

```typescript
import * as PIXI from 'pixi.js';

// Create frames manually
const frames = [];
for (let i = 0; i < 8; i++) {
  const texture = PIXI.Texture.from(`frame_${i}.png`);
  frames.push(texture);
}

// Create animated sprite
const sprite = new PIXI.AnimatedSprite(frames);
sprite.x = 100;
sprite.y = 100;
sprite.anchor.set(0.5);
sprite.animationSpeed = 0.1; // Adjust speed (lower = slower)
sprite.play();

app.stage.addChild(sprite);
```

### Example 2: Multiple Animations

```typescript
import { AnimatedPlayer } from './game/entities/AnimatedPlayer';

// Create player with idle animation
const player = new AnimatedPlayer(idleTextures, 400, 300);

// Add more animations
player.addAnimation('walk', walkTextures);
player.addAnimation('jump', jumpTextures);
player.addAnimation('attack', attackTextures);

// Play specific animation
player.playAnimation('walk');

// In your game loop
player.update(deltaTime, keys, screenWidth, screenHeight);
```

### Example 3: Custom Animation Controller

```typescript
class CustomSprite {
  private sprite: PIXI.AnimatedSprite;
  private animations: Map<string, PIXI.Texture[]>;

  constructor() {
    this.animations = new Map();
  }

  addAnimation(name: string, textures: PIXI.Texture[]) {
    this.animations.set(name, textures);
  }

  play(animationName: string, loop: boolean = true) {
    const textures = this.animations.get(animationName);
    if (textures) {
      this.sprite.textures = textures;
      this.sprite.loop = loop;
      this.sprite.gotoAndPlay(0);
    }
  }

  // Listen for animation complete
  onComplete(callback: () => void) {
    this.sprite.onComplete = callback;
  }
}
```

---

## Project Structure for Assets

Recommended folder structure:

```
public/
  assets/
    spritesheets/
      player/
        player.png
        player.json
      enemies/
        enemy1.png
        enemy1.json
        enemy2.png
        enemy2.json
    textures/
      background.png
      tiles.png
    sounds/
      ...
```

---

## Complete Example: Adding a Sprite Sheet Player

Here's a full example of integrating sprite sheets into your game:

```typescript
// src/game/GameEngine.ts
import * as PIXI from 'pixi.js';
import { AssetLoader } from './systems/AssetLoader';
import { AnimatedPlayer } from './entities/AnimatedPlayer';

export class GameEngine {
  private player: AnimatedPlayer | null = null;

  async init() {
    const loader = AssetLoader.getInstance();

    // Load player sprite sheet
    await loader.loadSpriteSheet(
      'player',
      '/assets/spritesheets/player/player.png',
      '/assets/spritesheets/player/player.json'
    );

    const spritesheet = loader.getAsset('player');

    // Create animation arrays
    const idleFrames = this.getFrames(spritesheet, 'idle', 4);
    const walkFrames = this.getFrames(spritesheet, 'walk', 8);

    // Create player
    this.player = new AnimatedPlayer(
      idleFrames,
      this.app.screen.width / 2,
      this.app.screen.height / 2
    );
    this.player.addAnimation('walk', walkFrames);
    this.player.setAnimationSpeed(0.15);

    this.app.stage.addChild(this.player.sprite);
  }

  private getFrames(spritesheet: PIXI.Spritesheet, name: string, count: number): PIXI.Texture[] {
    const frames: PIXI.Texture[] = [];
    for (let i = 1; i <= count; i++) {
      const frameName = `${name}_${i.toString().padStart(2, '0')}.png`;
      if (spritesheet.textures[frameName]) {
        frames.push(spritesheet.textures[frameName]);
      }
    }
    return frames;
  }

  update(deltaTime: number) {
    if (this.player) {
      this.player.update(
        deltaTime,
        this.keys,
        this.app.screen.width,
        this.app.screen.height
      );
    }
  }
}
```

---

## Tools for Creating Sprite Sheets

### Free Tools
1. **TexturePacker** (Free version available) - https://www.codeandweb.com/texturepacker
2. **Shoebox** (Free) - https://renderhjs.net/shoebox/
3. **Leshy SpriteSheet Tool** (Online, Free) - https://www.leshylabs.com/apps/sstool/
4. **Piskel** (Pixel art editor with export) - https://www.piskelapp.com/

### Paid Tools
1. **Aseprite** ($19.99) - Best for pixel art - https://www.aseprite.org/
2. **Spine** ($69+) - For skeletal animation - http://esotericsoftware.com/

### Finding Free Sprite Sheets
1. **OpenGameArt** - https://opengameart.org/
2. **itch.io** - https://itch.io/game-assets/free
3. **Kenney Assets** - https://kenney.nl/assets (All CC0)
4. **CraftPix** - https://craftpix.net/freebies/

---

## Tips and Best Practices

1. **Optimize sprite sheet size**: Keep it power of 2 (512x512, 1024x1024, 2048x2048)
2. **Use consistent frame sizes**: Makes animation smoother
3. **Minimize empty space**: Use tools to pack sprites efficiently
4. **Name frames logically**: `character_walk_01`, `character_walk_02`, etc.
5. **Separate by context**: Different sprite sheets for UI, characters, enemies, etc.
6. **Consider atlas generation**: Use tools to automatically pack sprites
7. **Test on target devices**: Ensure textures aren't too large for mobile devices

---

## Troubleshooting

### Sprite doesn't appear
- Check if the path is correct (relative to `public` folder)
- Verify JSON frame names match texture names
- Check browser console for loading errors

### Animation is too fast/slow
- Adjust `animationSpeed` property (0.1 = slow, 0.5 = fast)
- Consider using `ticker.deltaTime` for frame-rate independent animation

### Sprite is blurry
- Set `antialias: true` in PixiJS app options
- Use higher resolution textures
- Set `resolution` and `autoDensity` in app init

### Memory issues
- Don't load too many large sprite sheets at once
- Destroy unused sprites properly
- Use texture caching for frequently used sprites

---

## Next Steps

1. Create your first sprite sheet using TexturePacker or Piskel
2. Place it in `/public/assets/spritesheets/`
3. Use the `AssetLoader` to load it in your game
4. Create an `AnimatedPlayer` or custom entity class
5. Add multiple animations for different states

Happy sprite sheet creating! 🎮
