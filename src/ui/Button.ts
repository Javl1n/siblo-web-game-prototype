/**
 * Button Component (PixiJS)
 *
 * Reusable interactive button with hover and click states.
 */

import * as PIXI from 'pixi.js';
import { GAME_CONFIG } from '../config/constants';

export interface ButtonConfig {
  text: string;
  width?: number;
  height?: number;
  backgroundColor?: number;
  hoverColor?: number;
  textColor?: number;
  fontSize?: number;
  onClick?: () => void;
}

export class Button extends PIXI.Container {
  private background: PIXI.Graphics;
  private labelText: PIXI.Text;
  private config: Required<ButtonConfig>;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private currentColor: number;

  constructor(config: ButtonConfig) {
    super();

    // Apply defaults
    this.config = {
      text: config.text,
      width: config.width ?? 200,
      height: config.height ?? 50,
      backgroundColor: config.backgroundColor ?? GAME_CONFIG.COLORS.PRIMARY,
      hoverColor: config.hoverColor ?? GAME_CONFIG.COLORS.SECONDARY,
      textColor: config.textColor ?? GAME_CONFIG.COLORS.TEXT,
      fontSize: config.fontSize ?? 20,
      onClick: config.onClick ?? (() => {}),
    };

    // Create background
    this.background = new PIXI.Graphics();
    this.currentColor = this.config.backgroundColor;
    this.drawBackground(this.config.backgroundColor, false);
    this.addChild(this.background);

    // Create label
    this.labelText = new PIXI.Text({
      text: this.config.text,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: this.config.fontSize,
        fill: this.config.textColor,
      },
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = this.config.width / 2;
    this.labelText.y = this.config.height / 2;
    this.addChild(this.labelText);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Setup event listeners
    this.on('pointerover', this.onHover);
    this.on('pointerout', this.onLeave);
    this.on('pointerdown', this.onPress);
    this.on('pointerup', this.onRelease);
    this.on('pointerupoutside', this.onRelease);
  }

  private drawBackground(color: number, pressed: boolean = false): void {
    this.background.clear();

    const shadowOffset = 4;
    const shadowColor = this.getShadowColor(color);
    const offset = pressed ? 2 : 0; // Move button down when pressed

    // Draw 3D shadow effect (retro style) - only if not pressed
    if (!pressed) {
      this.background.rect(shadowOffset, shadowOffset, this.config.width, this.config.height);
      this.background.fill({ color: shadowColor });
    }

    // Draw main button (no rounded corners for pixel art)
    this.background.rect(offset, offset, this.config.width, this.config.height);
    this.background.fill({ color: color });

    // Draw border on top
    this.background.rect(offset, offset, this.config.width, this.config.height);
    this.background.stroke({ color: 0x8B9BB4, width: 3 });
  }

  private getShadowColor(color: number): number {
    // Darken the color by 30% for shadow effect
    const r = ((color >> 16) & 0xFF) * 0.7;
    const g = ((color >> 8) & 0xFF) * 0.7;
    const b = (color & 0xFF) * 0.7;
    return ((r << 16) | (g << 8) | b) >>> 0;
  }

  private onHover = (): void => {
    this.isHovered = true;
    this.currentColor = this.config.hoverColor;
    this.drawBackground(this.currentColor, this.isPressed);
  };

  private onLeave = (): void => {
    this.isHovered = false;
    this.isPressed = false;
    this.currentColor = this.config.backgroundColor;
    this.drawBackground(this.currentColor, false);
  };

  private onPress = (): void => {
    this.isPressed = true;
    // Redraw with pressed state (moves button down, removes shadow)
    this.drawBackground(this.currentColor, true);
  };

  private onRelease = (): void => {
    if (this.isPressed && this.isHovered) {
      this.config.onClick();
    }
    this.isPressed = false;
    // Redraw without pressed state
    this.drawBackground(this.currentColor, false);
  };

  /**
   * Update button text
   */
  setText(text: string): void {
    this.labelText.text = text;
  }

  /**
   * Enable or disable the button
   */
  setEnabled(enabled: boolean): void {
    this.eventMode = enabled ? 'static' : 'none';
    this.alpha = enabled ? 1.0 : 0.5;
    this.cursor = enabled ? 'pointer' : 'default';
  }

  /**
   * Cleanup
   */
  destroy(options?: boolean | PIXI.DestroyOptions): void {
    this.off('pointerover', this.onHover);
    this.off('pointerout', this.onLeave);
    this.off('pointerdown', this.onPress);
    this.off('pointerup', this.onRelease);
    this.off('pointerupoutside', this.onRelease);
    super.destroy(options);
  }
}
