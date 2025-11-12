import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';
import { AssetLoader } from '../game/systems/AssetLoader';
import { AnimatedPlayer } from '../game/entities/AnimatedPlayer';
import { usePlayerStore } from '../state/playerStore';
import { useAuthStore } from '../state/authStore';
import { GAME_CONFIG, KEYBINDS, SCENE_NAMES } from '../config/constants';
import { Button } from '../ui/Button';

export class OverworldScene extends BaseScene {
  private world!: PIXI.Container;
  private player!: AnimatedPlayer;
  private hud!: PIXI.Container;
  private camera!: PIXI.Container;

  // World configuration
  private readonly WORLD_WIDTH = 100; // tiles (was 25)
  private readonly WORLD_HEIGHT = 100; // tiles (was 20)
  private readonly TILE_SIZE = GAME_CONFIG.TILE_SIZE;

  // Camera bounds
  private cameraX = 0;
  private cameraY = 0;

  // Player position
  private playerX = 0;
  private playerY = 0;
  private readonly PLAYER_SPEED = GAME_CONFIG.PLAYER_SPEED;

  // Input state
  private keys: Set<string> = new Set();

  // Track last direction for idle animation
  private lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';

  // Interactive elements
  private interactables: Array<{ sprite: PIXI.Container | PIXI.Graphics; type: string; bounds: PIXI.Rectangle }> = [];
  private nearestInteractable: { sprite: PIXI.Container | PIXI.Graphics; type: string } | null = null;

  async load(): Promise<void> {
    console.log('[OverworldScene] Loading...');

    // Load assets
    await this.loadAssets();

    // Create camera container (everything that scrolls goes here)
    this.camera = new PIXI.Container();
    this.container.addChild(this.camera);

    // Create world container
    this.world = new PIXI.Container();
    this.camera.addChild(this.world);

    // Build the world
    this.createWorld();

    // Create player
    this.createPlayer();

    // Create HUD (fixed position, not affected by camera)
    this.createHUD();

    // Setup input handlers
    this.setupInput();

    // Initial camera position
    this.updateCamera();

    console.log('[OverworldScene] Loaded successfully');
  }

  private async loadAssets(): Promise<void> {
    const assetLoader = AssetLoader.getInstance();

    // Load player spritesheet if not already loaded
    if (!assetLoader.hasAsset('player')) {
      await assetLoader.loadSpriteSheet(
        'player',
        '/assets/player/player.png',
        '/assets/player/player.json'
      );
    }

    // Load grass tileset if not already loaded
    if (!assetLoader.hasAsset('grass')) {
      await assetLoader.loadSpriteSheet(
        'grass',
        '/assets/grass/Grass-01.png',
        '/assets/grass/grass.json'
      );
    }
  }

  private createWorld(): void {
    const assetLoader = AssetLoader.getInstance();
    const grassSheet = assetLoader.getAsset('grass');

    if (!grassSheet) {
      console.error('[OverworldScene] Grass spritesheet not loaded');
      return;
    }

    // Create grass tile background using random tiles from first 4x4 pattern
    // The spritesheet is 16x8 grid (512x256 pixels, 32x32 tiles)
    // We want to randomly select from the first 4 columns and 4 rows (4x4 = 16 tiles)

    // Build lookup array for textures in the first 4x4 area
    const texturePool: PIXI.Texture[] = [];
    const patternWidth = 4;
    const patternHeight = 4;

    // Collect textures from first 4x4 area
    for (let row = 0; row < patternHeight; row++) {
      for (let col = 0; col < patternWidth; col++) {
        const pixelX = col * 32;
        const pixelY = row * 32;

        // Find texture at this position
        for (const texture of Object.values(grassSheet.textures)) {
          const frame = (texture as PIXI.Texture).frame;
          if (frame.x === pixelX && frame.y === pixelY) {
            texturePool.push(texture as PIXI.Texture);
            break;
          }
        }
      }
    }

    // Create world tiles with random selection from the 4x4 pool
    for (let y = 0; y < this.WORLD_HEIGHT; y++) {
      for (let x = 0; x < this.WORLD_WIDTH; x++) {
        // Randomly select a texture from the pool
        const randomIndex = Math.floor(Math.random() * texturePool.length);
        const texture = texturePool[randomIndex];

        if (texture) {
          const tile = new PIXI.Sprite(texture);
          tile.x = x * this.TILE_SIZE;
          tile.y = y * this.TILE_SIZE;
          tile.width = this.TILE_SIZE;
          tile.height = this.TILE_SIZE;
          this.world.addChild(tile);
        }
      }
    }

    // Add battle zone portal (positioned relative to world center)
    const centerX = (this.WORLD_WIDTH * this.TILE_SIZE) / 2;
    const centerY = (this.WORLD_HEIGHT * this.TILE_SIZE) / 2;

    this.createPortal(centerX - 200, centerY - 300, 'battle', 0xff4444);

    // Add quiz zone portal
    this.createPortal(centerX + 200, centerY - 300, 'quiz', 0x4444ff);

    // Add NPC
    this.createNPC(centerX - 100, centerY + 200, 'Professor');
  }

  private createPortal(x: number, y: number, type: string, color: number): void {
    const portal = new PIXI.Graphics();
    portal.circle(0, 0, 24);
    portal.fill({ color, alpha: 0.6 });

    // Add glow effect
    portal.circle(0, 0, 32);
    portal.fill({ color, alpha: 0.3 });

    portal.x = x;
    portal.y = y;

    // Add label
    const label = new PIXI.Text({
      text: type.toUpperCase(),
      style: {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
      },
    });
    label.anchor.set(0.5);
    label.y = -40;
    portal.addChild(label);

    this.world.addChild(portal);

    // Add to interactables
    this.interactables.push({
      sprite: portal,
      type,
      bounds: new PIXI.Rectangle(x - 40, y - 40, 80, 80)
    });
  }

  private createNPC(x: number, y: number, name: string): void {
    // Create simple NPC sprite (colored circle for now)
    const npc = new PIXI.Graphics();
    npc.circle(0, 0, 16);
    npc.fill(0x44ff44);

    // Add eyes
    npc.circle(-6, -4, 3);
    npc.fill(0x000000);
    npc.circle(6, -4, 3);
    npc.fill(0x000000);

    npc.x = x;
    npc.y = y;

    // Add name label
    const label = new PIXI.Text({
      text: name,
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    label.anchor.set(0.5);
    label.y = -30;
    npc.addChild(label);

    this.world.addChild(npc);

    // Add to interactables
    this.interactables.push({
      sprite: npc,
      type: 'npc',
      bounds: new PIXI.Rectangle(x - 20, y - 20, 40, 40)
    });
  }

  private createPlayer(): void {
    // Get player spritesheet
    const assetLoader = AssetLoader.getInstance();
    const playerSheet = assetLoader.getAsset('player');

    if (!playerSheet) {
      console.error('[OverworldScene] Player spritesheet not loaded');
      return;
    }

    // Get forward (down) animations
    const forwardIdleTextures: PIXI.Texture[] = [];
    const texture = playerSheet.textures['forward_idle_01.png'];
    if (texture) forwardIdleTextures.push(texture);

    const forwardWalkTextures: PIXI.Texture[] = [];
    ['forward_walk_01.png', 'forward_walk_02.png'].forEach(name => {
      const tex = playerSheet.textures[name];
      if (tex) forwardWalkTextures.push(tex);
    });

    // Get backward (up) animations
    const backwardIdleTextures: PIXI.Texture[] = [];
    const backTex = playerSheet.textures['backward_idle_01.png'];
    if (backTex) backwardIdleTextures.push(backTex);

    const backwardWalkTextures: PIXI.Texture[] = [];
    ['backward_walk_01.png', 'backward_walk_02.png'].forEach(name => {
      const tex = playerSheet.textures[name];
      if (tex) backwardWalkTextures.push(tex);
    });

    // Get right animations
    const rightIdleTextures: PIXI.Texture[] = [];
    const rightTex = playerSheet.textures['right_idle_01.png'];
    if (rightTex) rightIdleTextures.push(rightTex);

    const rightWalkTextures: PIXI.Texture[] = [];
    ['right_walk_01.png', 'right_walk_02.png'].forEach(name => {
      const tex = playerSheet.textures[name];
      if (tex) rightWalkTextures.push(tex);
    });

    // Get left animations
    const leftIdleTextures: PIXI.Texture[] = [];
    const leftTex = playerSheet.textures['left_idle_01.png'];
    if (leftTex) leftIdleTextures.push(leftTex);

    const leftWalkTextures: PIXI.Texture[] = [];
    ['left_walk_02.png', 'left_walk_03.png'].forEach(name => {
      const tex = playerSheet.textures[name];
      if (tex) leftWalkTextures.push(tex);
    });

    // Fallback check
    if (forwardIdleTextures.length === 0) {
      console.error('[OverworldScene] No idle textures found. Available textures:', Object.keys(playerSheet.textures));
      const firstTexture = Object.values(playerSheet.textures)[0];
      if (firstTexture) {
        forwardIdleTextures.push(firstTexture as PIXI.Texture);
      } else {
        console.error('[OverworldScene] Cannot create player - no textures available');
        return;
      }
    }

    // Create player at center of world
    this.playerX = (this.WORLD_WIDTH * this.TILE_SIZE) / 2;
    this.playerY = (this.WORLD_HEIGHT * this.TILE_SIZE) / 2;

    // Start with forward idle
    this.player = new AnimatedPlayer(forwardIdleTextures, this.playerX, this.playerY);
    this.player.setSpeed(this.PLAYER_SPEED);

    // Add all directional animations
    this.player.addAnimation('forward_idle', forwardIdleTextures);
    this.player.addAnimation('forward_walk', forwardWalkTextures);
    this.player.addAnimation('backward_idle', backwardIdleTextures);
    this.player.addAnimation('backward_walk', backwardWalkTextures);
    this.player.addAnimation('right_idle', rightIdleTextures);
    this.player.addAnimation('right_walk', rightWalkTextures);
    this.player.addAnimation('left_idle', leftIdleTextures);
    this.player.addAnimation('left_walk', leftWalkTextures);

    this.world.addChild(this.player.sprite);
  }

  private createHUD(): void {
    this.hud = new PIXI.Container();
    this.container.addChild(this.hud);

    const { width, height } = this.getScreenSize();

    // Create semi-transparent background for HUD
    const hudBg = new PIXI.Graphics();
    hudBg.roundRect(10, 10, 250, 100, 8);
    hudBg.fill({ color: 0x000000, alpha: 0.7 });
    this.hud.addChild(hudBg);

    // Get player data from store
    const playerState = usePlayerStore.getState();
    const profile = playerState.profile;

    // Player stats text
    const statsText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'monospace',
        fontSize: 14,
        fill: 0xffffff,
      },
    });
    statsText.x = 20;
    statsText.y = 20;

    if (profile) {
      statsText.text = `Level: ${profile.level}\nXP: ${profile.experience_points}\nCoins: ${profile.coins}`;
    } else {
      statsText.text = 'Loading...';
    }

    this.hud.addChild(statsText);

    // Menu button (top right)
    const menuButton = new Button({
      text: 'MENU',
      width: 100,
      height: 40,
      onClick: () => this.openMenu(),
    });
    menuButton.x = width - 120;
    menuButton.y = 10;
    this.hud.addChild(menuButton as any);

    // Interaction prompt (bottom center)
    const interactPrompt = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'monospace',
        fontSize: 16,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4 },
      },
    });
    interactPrompt.anchor.set(0.5);
    interactPrompt.x = width / 2;
    interactPrompt.y = height - 50;
    interactPrompt.visible = false;
    this.hud.addChild(interactPrompt);

    // Store reference for updates
    (this.hud as any).statsText = statsText;
    (this.hud as any).interactPrompt = interactPrompt;
  }

  private setupInput(): void {
    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);

      // Handle interaction - check if key is in interact array
      const isInteractKey = (KEYBINDS.INTERACT as readonly string[]).includes(e.code);
      if (isInteractKey && this.nearestInteractable) {
        this.handleInteraction(this.nearestInteractable.type);
      }

      // Handle menu - check if key is in menu array
      const isMenuKey = (KEYBINDS.MENU as readonly string[]).includes(e.code);
      if (isMenuKey) {
        this.openMenu();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Store handlers for cleanup
    (this as any).handleKeyDown = handleKeyDown;
    (this as any).handleKeyUp = handleKeyUp;
  }

  private handleInteraction(type: string): void {
    console.log(`[OverworldScene] Interacting with: ${type}`);

    switch (type) {
      case 'battle':
        // TODO: Uncomment when BattleScene is implemented
        // this.sceneManager.loadScene(SCENE_NAMES.BATTLE);
        alert('Battle system coming soon!');
        break;
      case 'quiz':
        // TODO: Uncomment when QuizScene is implemented
        // this.sceneManager.loadScene(SCENE_NAMES.QUIZ);
        alert('Quiz system coming soon!');
        break;
      case 'npc':
        alert('NPC: Welcome to the world of Siblo!');
        break;
    }
  }

  private openMenu(): void {
    const logout = confirm('Open Menu\n\nLogout?');
    if (logout) {
      useAuthStore.getState().logout();
      usePlayerStore.getState().clearPlayerData();
      this.sceneManager.loadScene(SCENE_NAMES.MENU);
    }
  }

  private updateCamera(): void {
    const { width, height } = this.getScreenSize();

    // Center camera on player
    this.cameraX = this.playerX - width / 2;
    this.cameraY = this.playerY - height / 2;

    // Clamp camera to world bounds
    const worldPixelWidth = this.WORLD_WIDTH * this.TILE_SIZE;
    const worldPixelHeight = this.WORLD_HEIGHT * this.TILE_SIZE;

    this.cameraX = Math.max(0, Math.min(this.cameraX, worldPixelWidth - width));
    this.cameraY = Math.max(0, Math.min(this.cameraY, worldPixelHeight - height));

    // Apply camera position
    this.camera.x = -this.cameraX;
    this.camera.y = -this.cameraY;
  }

  private checkNearbyInteractables(): void {
    const playerBounds = new PIXI.Rectangle(this.playerX - 20, this.playerY - 20, 40, 40);

    let nearest: { sprite: PIXI.Container | PIXI.Graphics; type: string } | null = null;
    let minDistance = Infinity;

    for (const interactable of this.interactables) {
      // Check if player is near this interactable
      if (this.rectanglesIntersect(playerBounds, interactable.bounds)) {
        const dx = interactable.sprite.x - this.playerX;
        const dy = interactable.sprite.y - this.playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = { sprite: interactable.sprite, type: interactable.type };
        }
      }
    }

    this.nearestInteractable = nearest;

    // Update interaction prompt
    const prompt = (this.hud as any).interactPrompt as PIXI.Text;
    if (nearest) {
      prompt.text = `Press E to interact`;
      prompt.visible = true;
    } else {
      prompt.visible = false;
    }
  }

  private rectanglesIntersect(r1: PIXI.Rectangle, r2: PIXI.Rectangle): boolean {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  update(_deltaTime: number): void {
    // Determine movement direction
    let moving = false;
    let dx = 0;
    let dy = 0;

    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
      dx = 1;
      moving = true;
    } else if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
      dx = -1;
      moving = true;
    }

    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
      dy = 1;
      moving = true;
    } else if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
      dy = -1;
      moving = true;
    }

    // Update player position
    if (moving) {
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      this.playerX += dx * this.PLAYER_SPEED;
      this.playerY += dy * this.PLAYER_SPEED;

      // Clamp to world bounds
      const worldPixelWidth = this.WORLD_WIDTH * this.TILE_SIZE;
      const worldPixelHeight = this.WORLD_HEIGHT * this.TILE_SIZE;
      this.playerX = Math.max(16, Math.min(worldPixelWidth - 16, this.playerX));
      this.playerY = Math.max(16, Math.min(worldPixelHeight - 16, this.playerY));

      // Update sprite position
      this.player.sprite.x = this.playerX;
      this.player.sprite.y = this.playerY;

      // Choose animation based on primary direction
      let animationName = 'forward_walk';

      // Prioritize vertical movement for animation
      if (dy > 0) {
        // Moving down
        animationName = 'forward_walk';
        this.lastDirection = 'forward';
      } else if (dy < 0) {
        // Moving up
        animationName = 'backward_walk';
        this.lastDirection = 'backward';
      } else if (dx > 0) {
        // Moving right
        animationName = 'right_walk';
        this.lastDirection = 'right';
      } else if (dx < 0) {
        // Moving left
        animationName = 'left_walk';
        this.lastDirection = 'left';
      }

      // Play the appropriate walk animation
      this.player.playAnimation(animationName);
    } else {
      // Play idle animation based on last direction
      this.player.playAnimation(`${this.lastDirection}_idle`);
    }

    // Update camera to follow player
    this.updateCamera();

    // Check for nearby interactables
    this.checkNearbyInteractables();
  }

  async unload(): Promise<void> {
    console.log('[OverworldScene] Unloading...');

    // Remove input handlers
    const handleKeyDown = (this as any).handleKeyDown;
    const handleKeyUp = (this as any).handleKeyUp;

    if (handleKeyDown) {
      window.removeEventListener('keydown', handleKeyDown);
    }
    if (handleKeyUp) {
      window.removeEventListener('keyup', handleKeyUp);
    }

    // Clear keys
    this.keys.clear();

    // Clear interactables
    this.interactables = [];
    this.nearestInteractable = null;

    console.log('[OverworldScene] Unloaded successfully');
  }
}
