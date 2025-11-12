/**
 * SIBLO Game
 *
 * Main game class using Pure PixiJS architecture.
 * Manages the game application, scene system, and game loop.
 */

import * as PIXI from 'pixi.js';
import { SceneManager } from './systems/SceneManager';
import { ENV, validateEnv } from './config/env';
import { SCENE_NAMES } from './config/constants';
import { useAuthStore } from './state/authStore';

// Import scenes
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';
// import { BattleScene } from './scenes/BattleScene';
// import { QuizScene } from './scenes/QuizScene';

export class Game {
  private app: PIXI.Application;
  private sceneManager: SceneManager;

  constructor() {
    // Validate environment configuration
    validateEnv();

    // Create PixiJS application
    this.app = new PIXI.Application();

    // Create scene manager
    this.sceneManager = new SceneManager(this.app);

    // Register all scenes
    this.registerScenes();
  }

  /**
   * Initialize the game
   */
  async init(): Promise<void> {
    // Get window dimensions for full screen
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Initialize PixiJS application with full screen dimensions
    await this.app.init({
      width: width,
      height: height,
      backgroundColor: 0x1a1a2e,
      resolution: 1, // Force 1:1 pixel ratio for pixel art
      autoDensity: false, // Disable auto-density for consistent pixel sizes
      antialias: false, // Disable antialiasing for crisp pixel art
      roundPixels: true, // Round pixel positions for pixel-perfect rendering
      resizeTo: window, // Auto-resize to window
    });

    // Set default scale mode for all textures to nearest-neighbor (pixel art)
    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';

    // Add canvas to DOM
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(this.app.canvas);
    } else {
      document.body.appendChild(this.app.canvas);
    }

    // Force canvas to be fullscreen by overriding inline styles
    this.app.canvas.style.position = 'absolute';
    this.app.canvas.style.top = '0';
    this.app.canvas.style.left = '0';
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.app.canvas.style.display = 'block';

    // Handle window resize
    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    // Load authentication state from storage
    useAuthStore.getState().loadTokenFromStorage();

    // Start game loop
    this.app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaTime / 60; // Convert to seconds
      this.update(deltaTime);
    });

    // Determine initial scene based on auth state
    const { isAuthenticated } = useAuthStore.getState();
    const initialScene = isAuthenticated ? SCENE_NAMES.OVERWORLD : SCENE_NAMES.MENU;

    // Load initial scene
    await this.sceneManager.loadScene(initialScene);

    console.log('[Game] Initialization complete');
  }

  /**
   * Register all game scenes
   */
  private registerScenes(): void {
    this.sceneManager.registerScene(SCENE_NAMES.MENU, MenuScene);
    this.sceneManager.registerScene(SCENE_NAMES.OVERWORLD, OverworldScene);
    // this.sceneManager.registerScene(SCENE_NAMES.BATTLE, BattleScene);
    // this.sceneManager.registerScene(SCENE_NAMES.QUIZ, QuizScene);
  }

  /**
   * Game update loop (called every frame)
   */
  private update(deltaTime: number): void {
    this.sceneManager.update(deltaTime);
  }

  /**
   * Get the scene manager instance
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Get the PixiJS application instance
   */
  getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Cleanup and destroy the game
   */
  destroy(): void {
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
  }
}
