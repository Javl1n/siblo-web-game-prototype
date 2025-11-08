import * as PIXI from 'pixi.js';

export interface GameState {
  isRunning: boolean;
}

export class GameEngine {
  private app: PIXI.Application;
  private state: GameState;
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
      isRunning: true,
    };

    this.setupKeyboardControls();
    this.init();
  }

  private async init(): Promise<void> {
    // Create grasslands background
    await this.createGrasslands();

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
        PIXI.Assets.load('/assets/player/player.png'),
        fetch('/assets/player/player.json').then(res => res.json())
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

  private async createGrasslands(): Promise<void> {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    try {
      // Load the grass tileset texture and JSON data
      const [baseTexture, grassData] = await Promise.all([
        PIXI.Assets.load('/assets/grass/Grass-01.png'),
        fetch('/assets/grass/grass.json').then(res => res.json())
      ]);

      // Disable texture smoothing for crisp pixel art
      baseTexture.source.scaleMode = 'nearest';

      // Create a container for the grass tiles
      const grassContainer = new PIXI.Container();

      // Calculate how many tiles we need to fill the screen
      const tileSize = 32;
      const scale = 2; // Scale up the tiles for better visibility
      const scaledTileSize = tileSize * scale;
      const tilesX = Math.ceil(width / scaledTileSize) + 1;
      const tilesY = Math.ceil(height / scaledTileSize) + 1;

      // Create textures for first 4x4 tiles (16 tiles total)
      const grassTextures: PIXI.Texture[] = [];

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * tileSize;
          const y = row * tileSize;

          const rect = new PIXI.Rectangle(x, y, tileSize, tileSize);
          const texture = new PIXI.Texture({
            source: baseTexture.source,
            frame: rect,
          });
          grassTextures.push(texture);
        }
      }

      console.log(`Loaded ${grassTextures.length} tiles from first 4x4 grid`);

      // Fill the screen with grass tiles (randomly selected for variety)
      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          // Randomly select a grass tile
          const randomTileIndex = Math.floor(Math.random() * grassTextures.length);
          const tileTexture = grassTextures[randomTileIndex];

          const tile = new PIXI.Sprite(tileTexture);
          tile.x = x * scaledTileSize;
          tile.y = y * scaledTileSize;
          tile.scale.set(scale);

          grassContainer.addChild(tile);
        }
      }

      this.app.stage.addChild(grassContainer);
      console.log('Grass tileset background loaded successfully');
    } catch (error) {
      console.error('Failed to load grass tileset:', error);

      // Fallback to solid color background
      const grassBase = new PIXI.Graphics();
      grassBase.rect(0, 0, width, height);
      grassBase.fill({ color: 0x6BAA4A });
      this.app.stage.addChild(grassBase);
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

  public getState(): GameState {
    return { ...this.state };
  }

  public destroy(): void {
    // Clean up keyboard listeners
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});

    // Destroy sprites
    if (this.playerSprite) {
      this.playerSprite.destroy();
    }
  }
}
