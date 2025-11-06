import * as PIXI from 'pixi.js';

export class AssetLoader {
  private static instance: AssetLoader;
  private loadedAssets: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Load a sprite sheet with its JSON data
   * @param name - Unique identifier for the sprite sheet
   * @param imagePath - Path to the sprite sheet image
   * @param jsonPath - Path to the sprite sheet JSON data (optional if using texture atlas)
   */
  async loadSpriteSheet(name: string, imagePath: string, jsonPath?: string): Promise<PIXI.Spritesheet> {
    if (this.loadedAssets.has(name)) {
      return this.loadedAssets.get(name);
    }

    try {
      // Load the texture
      const texture = await PIXI.Assets.load(imagePath);

      let spritesheet: PIXI.Spritesheet;

      if (jsonPath) {
        // Load with external JSON
        const jsonData = await fetch(jsonPath).then(res => res.json());
        spritesheet = new PIXI.Spritesheet(texture, jsonData);
        await spritesheet.parse();
      } else {
        // Assume the texture already has spritesheet data
        spritesheet = new PIXI.Spritesheet(texture, {
          frames: {},
          meta: {
            scale: '1',
          },
        });
      }

      this.loadedAssets.set(name, spritesheet);
      return spritesheet;
    } catch (error) {
      console.error(`Failed to load sprite sheet: ${name}`, error);
      throw error;
    }
  }

  /**
   * Load a single texture/image
   * @param name - Unique identifier for the texture
   * @param path - Path to the image
   */
  async loadTexture(name: string, path: string): Promise<PIXI.Texture> {
    if (this.loadedAssets.has(name)) {
      return this.loadedAssets.get(name);
    }

    try {
      const texture = await PIXI.Assets.load(path);
      this.loadedAssets.set(name, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture: ${name}`, error);
      throw error;
    }
  }

  /**
   * Load multiple assets at once
   * @param assets - Array of asset definitions
   */
  async loadMultiple(assets: { name: string; path: string; type?: 'texture' | 'spritesheet'; jsonPath?: string }[]): Promise<void> {
    const promises = assets.map(asset => {
      if (asset.type === 'spritesheet') {
        return this.loadSpriteSheet(asset.name, asset.path, asset.jsonPath);
      }
      return this.loadTexture(asset.name, asset.path);
    });

    await Promise.all(promises);
  }

  /**
   * Get a loaded asset
   * @param name - The name of the asset
   */
  getAsset(name: string): any {
    return this.loadedAssets.get(name);
  }

  /**
   * Check if an asset is loaded
   * @param name - The name of the asset
   */
  hasAsset(name: string): boolean {
    return this.loadedAssets.has(name);
  }

  /**
   * Clear all loaded assets
   */
  clear(): void {
    this.loadedAssets.clear();
  }
}
