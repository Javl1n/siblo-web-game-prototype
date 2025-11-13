/**
 * TextField Component (PixiJS + DOM Hybrid)
 *
 * Text input field using DOM overlay for actual input,
 * with PixiJS graphics for visual representation.
 */

import * as PIXI from 'pixi.js';
import { GAME_CONFIG } from '../config/constants';

export interface TextFieldConfig {
  placeholder?: string;
  width?: number;
  height?: number;
  type?: 'text' | 'password' | 'email';
  maxLength?: number;
  backgroundColor?: number;
  borderColor?: number;
  textColor?: number;
  fontSize?: number;
}

export class TextField extends PIXI.Container {
  private background: PIXI.Graphics;
  private inputElement: HTMLInputElement;
  private config: Required<TextFieldConfig>;

  constructor(config: TextFieldConfig = {}) {
    super();

    // Apply defaults
    this.config = {
      placeholder: config.placeholder ?? '',
      width: config.width ?? 300,
      height: config.height ?? 40,
      type: config.type ?? 'text',
      maxLength: config.maxLength ?? 100,
      backgroundColor: config.backgroundColor ?? 0x2a2a3e,
      borderColor: config.borderColor ?? GAME_CONFIG.COLORS.PRIMARY,
      textColor: config.textColor ?? GAME_CONFIG.COLORS.TEXT,
      fontSize: config.fontSize ?? 16,
    };

    // Create background
    this.background = new PIXI.Graphics();
    this.drawBackground(this.config.borderColor);
    this.addChild(this.background);

    // Create DOM input element
    this.inputElement = this.createInputElement();

    // Make container interactive
    this.eventMode = 'static';
    this.on('pointerdown', this.focus);
  }

  private createInputElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = this.config.type;
    input.placeholder = this.config.placeholder;
    input.maxLength = this.config.maxLength;

    // Style the input (pixel art)
    input.className = 'pixel-art-input';
    input.style.cssText = `
      position: absolute;
      width: ${this.config.width - 20}px;
      height: ${this.config.height - 10}px;
      display: none;
      z-index: 1000;
    `;

    // Event listeners
    input.addEventListener('focus', () => {
      this.drawBackground(GAME_CONFIG.COLORS.SECONDARY);
    });

    input.addEventListener('blur', () => {
      this.drawBackground(this.config.borderColor);
    });

    document.body.appendChild(input);

    return input;
  }

  private drawBackground(borderColor: number): void {
    this.background.clear();

    // Draw fill (pixel art - no rounded corners)
    this.background.rect(0, 0, this.config.width, this.config.height);
    this.background.fill({ color: this.config.backgroundColor });

    // Draw sharp pixel art border
    this.background.rect(0, 0, this.config.width, this.config.height);
    this.background.stroke({ color: borderColor, width: 2 });
  }

  /**
   * Update the position of the DOM input element
   */
  updateInputPosition(app: PIXI.Application): void {
    const globalPos = this.getGlobalPosition();
    const canvasBounds = app.canvas.getBoundingClientRect();

    this.inputElement.style.left = `${canvasBounds.left + globalPos.x + 10}px`;
    this.inputElement.style.top = `${canvasBounds.top + globalPos.y + 5}px`;
  }

  /**
   * Show the input element
   */
  show(app: PIXI.Application): void {
    this.updateInputPosition(app);
    this.inputElement.style.display = 'block';
  }

  /**
   * Hide the input element
   */
  hide(): void {
    this.inputElement.style.display = 'none';
  }

  /**
   * Focus the input
   */
  focus = (): void => {
    this.inputElement.focus();
  };

  /**
   * Get current value
   */
  getValue(): string {
    return this.inputElement.value;
  }

  /**
   * Set value
   */
  setValue(value: string): void {
    this.inputElement.value = value;
  }

  /**
   * Clear value
   */
  clear(): void {
    this.inputElement.value = '';
  }

  /**
   * Cleanup
   */
  destroy(options?: boolean | PIXI.DestroyOptions): void {
    this.inputElement.remove();
    super.destroy(options);
  }
}
