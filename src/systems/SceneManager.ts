/**
 * Scene Manager
 *
 * Manages game scene lifecycle:
 * - Loading and unloading scenes
 * - Scene transitions
 * - Resource management
 */

import * as PIXI from 'pixi.js';
import type { BaseScene } from '../scenes/BaseScene';

export class SceneManager {
  private app: PIXI.Application;
  private currentScene: BaseScene | null = null;
  private scenes: Map<string, new (app: PIXI.Application, sceneManager: SceneManager) => BaseScene>;
  private isTransitioning: boolean = false;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.scenes = new Map();
  }

  /**
   * Register a scene class for later instantiation
   * @param name - Unique scene name
   * @param SceneClass - Scene constructor
   */
  registerScene(
    name: string,
    SceneClass: new (app: PIXI.Application, sceneManager: SceneManager) => BaseScene
  ): void {
    this.scenes.set(name, SceneClass);
  }

  /**
   * Load and display a scene
   * @param name - Scene name to load
   * @param transitionDuration - Fade transition duration in ms (default: 300)
   */
  async loadScene(name: string, transitionDuration: number = 300): Promise<void> {
    if (this.isTransitioning) {
      console.warn('[SceneManager] Scene transition already in progress');
      return;
    }

    const SceneClass = this.scenes.get(name);
    if (!SceneClass) {
      throw new Error(`[SceneManager] Scene "${name}" not registered`);
    }

    this.isTransitioning = true;

    try {
      // Fade out current scene
      if (this.currentScene && transitionDuration > 0) {
        await this.fadeOut(this.currentScene.container, transitionDuration);
      }

      // Unload current scene
      if (this.currentScene) {
        await this.currentScene.unload();
        this.app.stage.removeChild(this.currentScene.container);
        this.currentScene = null;
      }

      // Create and load new scene
      const newScene = new SceneClass(this.app, this);
      await newScene.load();

      // Add to stage
      this.app.stage.addChild(newScene.container);
      this.currentScene = newScene;

      // Fade in new scene
      if (transitionDuration > 0) {
        newScene.container.alpha = 0;
        await this.fadeIn(newScene.container, transitionDuration);
      }

      console.log(`[SceneManager] Loaded scene: ${name}`);
    } catch (error) {
      console.error(`[SceneManager] Failed to load scene "${name}":`, error);
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Get current active scene
   */
  getCurrentScene(): BaseScene | null {
    return this.currentScene;
  }

  /**
   * Update current scene (called every frame)
   * @param deltaTime - Time since last frame
   */
  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Fade out a container
   */
  private fadeOut(container: PIXI.Container, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startAlpha = container.alpha;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        container.alpha = startAlpha * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Fade in a container
   */
  private fadeIn(container: PIXI.Container, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        container.alpha = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }
}
