/**
 * Base Scene
 *
 * Abstract base class for all game scenes.
 * Provides common functionality for scene lifecycle management.
 */

import * as PIXI from 'pixi.js';
import type { SceneManager } from '../systems/SceneManager';

export abstract class BaseScene {
  protected app: PIXI.Application;
  protected sceneManager: SceneManager;
  public container: PIXI.Container;

  constructor(app: PIXI.Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
    this.container = new PIXI.Container();
  }

  /**
   * Load scene assets and initialize
   * Called when scene is being loaded
   */
  abstract load(): Promise<void>;

  /**
   * Update scene logic
   * Called every frame
   * @param deltaTime - Time since last frame (in seconds)
   */
  abstract update(deltaTime: number): void;

  /**
   * Unload scene and cleanup resources
   * Called when scene is being removed
   */
  async unload(): Promise<void> {
    // Remove all children
    this.container.removeChildren();

    // Destroy container
    this.container.destroy({ children: true });
  }

  /**
   * Get screen dimensions
   */
  protected getScreenSize(): { width: number; height: number } {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height,
    };
  }

  /**
   * Center a display object on screen
   */
  protected centerOnScreen(obj: PIXI.Container): void {
    const { width, height } = this.getScreenSize();
    obj.x = width / 2;
    obj.y = height / 2;
  }
}
