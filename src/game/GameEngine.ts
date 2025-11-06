import * as PIXI from 'pixi.js';

export interface GameState {
  score: number;
  lives: number;
  isRunning: boolean;
}

type StateListener = (state: GameState) => void;

export class GameEngine {
  private app: PIXI.Application;
  private state: GameState;
  private listeners: Set<StateListener> = new Set();
  private playerSprite: PIXI.AnimatedSprite | null = null;
  private playerSpeed = 5;
  private keys: { [key: string]: boolean } = {};
  private isInitialized = false;
  private animations: Map<string, PIXI.Texture[]> = new Map();
  private currentAnimation: string = 'forward_idle';
  private lastDirection: 'forward' | 'backward' | 'side' = 'forward';
  private facingLeft: boolean = false;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.state = {
      score: 0,
      lives: 3,
      isRunning: true,
    };

    this.setupKeyboardControls();
    this.init();
  }

  private async init(): Promise<void> {
    // Create grasslands background
    this.createGrasslands();

    // Load and create player sprite
    await this.loadPlayer();

    // Add welcome text
    const text = new PIXI.Text({
      text: 'Use Arrow Keys to Move!',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'center',
      },
    });
    text.x = this.app.screen.width / 2;
    text.y = 30;
    text.anchor.set(0.5);
    this.app.stage.addChild(text);

    this.isInitialized = true;
  }

  private async loadPlayer(): Promise<void> {
    try {
      // Load the player sprite sheet texture and JSON data
      const [baseTexture, spriteData] = await Promise.all([
        PIXI.Assets.load('/assets/player.png'),
        fetch('/assets/player.json').then(res => res.json())
      ]);

      console.log('Loaded player sprite data:', spriteData);

      // Create textures for each frame based on JSON data
      const frameTextures: Map<string, PIXI.Texture> = new Map();

      // Disable texture smoothing for crisp pixel art
      baseTexture.source.scaleMode = 'nearest';

      for (const [frameName, frameData] of Object.entries(spriteData.frames)) {
        const frame = (frameData as any).frame;
        const rect = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
        const texture = new PIXI.Texture({
          source: baseTexture.source,
          frame: rect,
        });
        frameTextures.set(frameName, texture);
      }

      // Create animations from JSON data
      for (const [animName, frameNames] of Object.entries(spriteData.animations)) {
        const textures = (frameNames as string[]).map(frameName => {
          const texture = frameTextures.get(frameName);
          if (!texture) {
            console.warn(`Frame ${frameName} not found for animation ${animName}`);
            return null;
          }
          return texture;
        }).filter(t => t !== null) as PIXI.Texture[];

        this.animations.set(animName, textures);
      }

      console.log(`Created ${this.animations.size} animations:`, Array.from(this.animations.keys()));

      // Create animated sprite with initial animation (forward_idle)
      const initialTextures = this.animations.get('forward_idle') || [];
      const animatedSprite = new PIXI.AnimatedSprite(initialTextures);
      animatedSprite.anchor.set(0.5);
      animatedSprite.x = this.app.screen.width / 2;
      animatedSprite.y = this.app.screen.height / 2;
      animatedSprite.animationSpeed = 0.15;
      animatedSprite.play();

      this.playerSprite = animatedSprite;

      // Scale up pixel art for better visibility
      this.playerSprite.scale.set(2);

      // Add to stage
      this.app.stage.addChild(this.playerSprite);

      console.log('Player sprite loaded with animations');
    } catch (error) {
      console.error('Failed to load player sprite sheet:', error);

      // Fallback to a colored rectangle if image fails to load
      const fallbackSprite = new PIXI.Graphics();
      fallbackSprite.rect(-25, -25, 50, 50);
      fallbackSprite.fill({ color: 0x00ff00 });
      fallbackSprite.x = this.app.screen.width / 2;
      fallbackSprite.y = this.app.screen.height / 2;
      this.app.stage.addChild(fallbackSprite);

      console.warn('Using fallback sprite instead of player.png');
    }
  }

  private createGrasslands(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Create base grass layer (entire screen)
    const grassBase = new PIXI.Graphics();
    grassBase.rect(0, 0, width, height);
    grassBase.fill({ color: 0x6BAA4A });
    this.app.stage.addChild(grassBase);

    // Add darker grass patches for depth
    for (let i = 0; i < 15; i++) {
      const patch = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 80 + 40;

      patch.circle(x, y, size);
      patch.fill({ color: 0x5a9e4a, alpha: 0.3 });
      this.app.stage.addChild(patch);
    }

    // Add lighter grass patches
    for (let i = 0; i < 10; i++) {
      const patch = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 60 + 30;

      patch.circle(x, y, size);
      patch.fill({ color: 0x7bc055, alpha: 0.3 });
      this.app.stage.addChild(patch);
    }

    // Add dirt paths (diagonal)
    for (let i = 0; i < 3; i++) {
      const path = new PIXI.Graphics();
      const startX = Math.random() * width * 0.5;
      const startY = Math.random() * height;
      const endX = startX + width * 0.6;
      const endY = (startY + height * 0.3) % height;
      const pathWidth = Math.random() * 40 + 30;

      // Create path using lines
      for (let j = 0; j < 20; j++) {
        const t = j / 20;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        path.circle(x, y, pathWidth);
      }
      path.fill({ color: 0x8B7355, alpha: 0.4 });
      this.app.stage.addChild(path);
    }

    // Add small grass tufts scattered around
    for (let i = 0; i < 150; i++) {
      const tuft = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;

      // Draw small grass tuft (3 tiny lines)
      for (let j = 0; j < 3; j++) {
        const angle = (j - 1) * 0.3;
        tuft.moveTo(x, y);
        tuft.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
      }
      tuft.stroke({ color: 0x4a8c3a, width: 1, alpha: Math.random() * 0.4 + 0.2 });
      this.app.stage.addChild(tuft);
    }

    // Add small rocks
    for (let i = 0; i < 20; i++) {
      const rock = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 8 + 4;

      rock.circle(x, y, size);
      rock.fill({ color: 0x808080, alpha: 0.6 });
      this.app.stage.addChild(rock);
    }

    // Add colorful flowers scattered around
    for (let i = 0; i < 40; i++) {
      const flower = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;

      // Draw flower petals (top-down view)
      const colors = [0xff69b4, 0xffff00, 0xff6347, 0xffa500, 0x9370db];
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5;
        const petalX = x + Math.cos(angle) * 4;
        const petalY = y + Math.sin(angle) * 4;
        flower.circle(petalX, petalY, 2.5);
      }
      flower.circle(x, y, 2);
      flower.fill({ color: color, alpha: 0.8 });
      this.app.stage.addChild(flower);
    }

    // Add small bushes/shrubs
    for (let i = 0; i < 10; i++) {
      const bush = new PIXI.Graphics();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 15 + 10;

      // Draw bush with overlapping circles
      bush.circle(x, y, size);
      bush.circle(x + size * 0.5, y, size * 0.8);
      bush.circle(x - size * 0.5, y, size * 0.8);
      bush.circle(x, y + size * 0.4, size * 0.7);
      bush.fill({ color: 0x2d5a1e, alpha: 0.7 });
      this.app.stage.addChild(bush);
    }
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  private playAnimation(name: string): void {
    if (!this.playerSprite || this.currentAnimation === name) return;

    const textures = this.animations.get(name);
    if (!textures) {
      console.warn(`Animation ${name} not found`);
      return;
    }

    this.playerSprite.textures = textures;
    this.playerSprite.play();
    this.currentAnimation = name;
  }

  public update(deltaTime: number): void {
    if (!this.state.isRunning || !this.playerSprite || !this.isInitialized) return;

    let moving = false;
    let moveX = 0;
    let moveY = 0;

    // Track movement direction
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      moveX -= this.playerSpeed;
      moving = true;
      this.facingLeft = true;
      this.lastDirection = 'side';
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      moveX += this.playerSpeed;
      moving = true;
      this.facingLeft = false;
      this.lastDirection = 'side';
    }
    if (this.keys['ArrowUp'] || this.keys['w']) {
      moveY -= this.playerSpeed;
      moving = true;
      this.lastDirection = 'backward';
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      moveY += this.playerSpeed;
      moving = true;
      this.lastDirection = 'forward';
    }

    // Update position
    this.playerSprite.x += moveX;
    this.playerSprite.y += moveY;

    // Determine which animation to play
    let animationName: string;
    if (moving) {
      animationName = `${this.lastDirection}_walk`;
    } else {
      animationName = `${this.lastDirection}_idle`;
    }

    // Handle left/right flipping for side animations
    if (this.lastDirection === 'side') {
      this.playerSprite.scale.x = this.facingLeft ? -2 : 2;
    } else {
      this.playerSprite.scale.x = 2;
    }
    this.playerSprite.scale.y = 2;

    // Play the appropriate animation
    this.playAnimation(animationName);

    // Keep player within bounds (using sprite's actual dimensions)
    const halfWidth = this.playerSprite.width / 2;
    const halfHeight = this.playerSprite.height / 2;
    this.playerSprite.x = Math.max(halfWidth, Math.min(this.app.screen.width - halfWidth, this.playerSprite.x));
    this.playerSprite.y = Math.max(halfHeight, Math.min(this.app.screen.height - halfHeight, this.playerSprite.y));
  }

  public incrementScore(points: number = 10): void {
    this.state.score += points;
    this.notifyListeners();
  }

  public decrementLives(): void {
    this.state.lives--;
    if (this.state.lives <= 0) {
      this.state.isRunning = false;
    }
    this.notifyListeners();
  }

  public togglePause(): void {
    this.state.isRunning = !this.state.isRunning;
    this.notifyListeners();
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public destroy(): void {
    // Clean up keyboard listeners
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});

    // Clear all listeners
    this.listeners.clear();

    // Destroy sprites
    if (this.playerSprite) {
      this.playerSprite.destroy();
    }
  }
}
