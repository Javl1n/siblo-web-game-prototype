import * as PIXI from 'pixi.js';

export class AnimatedPlayer {
  public sprite: PIXI.AnimatedSprite;
  private speed: number = 3;
  private animations: Map<string, PIXI.Texture[]> = new Map();
  private currentAnimation: string = 'idle';
  private lastDirection: number = 1; // 1 for right, -1 for left

  constructor(textures: PIXI.Texture[], x: number = 0, y: number = 0) {
    // Create animated sprite with default textures
    this.sprite = new PIXI.AnimatedSprite(textures);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();

    // Store default animation
    this.animations.set('idle', textures);
  }

  /**
   * Add a new animation
   * @param name - Name of the animation (e.g., 'walk', 'jump', 'attack')
   * @param textures - Array of textures for this animation
   */
  addAnimation(name: string, textures: PIXI.Texture[]): void {
    this.animations.set(name, textures);
  }

  /**
   * Play a specific animation
   * @param name - Name of the animation to play
   * @param loop - Whether to loop the animation (default: true)
   */
  playAnimation(name: string, loop: boolean = true): void {
    if (!this.animations.has(name) || this.currentAnimation === name) {
      return;
    }

    const textures = this.animations.get(name)!;
    this.sprite.textures = textures;
    this.sprite.loop = loop;
    this.sprite.gotoAndPlay(0);
    this.currentAnimation = name;
  }

  /**
   * Update player position
   * @param deltaTime - Time since last frame
   * @param keys - Current keyboard state
   * @param screenWidth - Screen width for bounds checking
   * @param screenHeight - Screen height for bounds checking
   */
  update(_deltaTime: number, keys: { [key: string]: boolean }, screenWidth: number, screenHeight: number): void {
    let moving = false;

    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
      this.sprite.x -= this.speed;
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x); // Flip left
      this.lastDirection = -1; // Remember we're facing left
      moving = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
      this.sprite.x += this.speed;
      this.sprite.scale.x = Math.abs(this.sprite.scale.x); // Flip right
      this.lastDirection = 1; // Remember we're facing right
      moving = true;
    }
    if (keys['ArrowUp'] || keys['w']) {
      this.sprite.y -= this.speed;
      moving = true;
    }
    if (keys['ArrowDown'] || keys['s']) {
      this.sprite.y += this.speed;
      moving = true;
    }

    // Play appropriate animation
    if (moving && this.animations.has('walk')) {
      this.playAnimation('walk');
    } else if (!moving && this.animations.has('idle')) {
      this.playAnimation('idle');
      // Maintain the last direction when idle
      if (this.lastDirection === -1) {
        this.sprite.scale.x = -Math.abs(this.sprite.scale.x); // Face left
      } else {
        this.sprite.scale.x = Math.abs(this.sprite.scale.x); // Face right
      }
    }

    // Keep within bounds
    const radius = this.sprite.width / 2;
    this.sprite.x = Math.max(radius, Math.min(screenWidth - radius, this.sprite.x));
    this.sprite.y = Math.max(radius, Math.min(screenHeight - radius, this.sprite.y));
  }

  /**
   * Set player speed
   * @param speed - New speed value
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Set animation speed
   * @param speed - New animation speed (0.1 is slow, 0.5 is fast)
   */
  setAnimationSpeed(speed: number): void {
    this.sprite.animationSpeed = speed;
  }

  /**
   * Destroy the player sprite
   */
  destroy(): void {
    this.sprite.destroy();
    this.animations.clear();
  }
}
