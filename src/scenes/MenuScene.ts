/**
 * Menu Scene
 *
 * Main menu with login/register functionality.
 * Entry point for unauthenticated users.
 */

import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';
import { GAME_CONFIG, SCENE_NAMES } from '../config/constants';
import { LoginForm } from '../ui/LoginForm';
import { RegisterForm } from '../ui/RegisterForm';
import { usePlayerStore } from '../state/playerStore';

type ViewState = 'login' | 'register';

export class MenuScene extends BaseScene {
  private titleText!: PIXI.Text;
  private subtitleText!: PIXI.Text;
  private loginForm!: LoginForm;
  private registerForm!: RegisterForm;
  private currentView: ViewState = 'login';
  private formContainer!: PIXI.Container;

  async load(): Promise<void> {
    console.log('[MenuScene] Loading...');

    const { width, height } = this.getScreenSize();

    // Create background
    const background = new PIXI.Graphics();
    background.rect(0, 0, width, height);
    background.fill({ color: GAME_CONFIG.COLORS.BACKGROUND });
    this.container.addChild(background);

    // Create title - smaller and positioned higher for space
    this.titleText = new PIXI.Text({
      text: 'SIBLO',
      style: {
        fontFamily: 'Arial',
        fontSize: height < 900 ? 48 : 72,
        fontWeight: 'bold',
        fill: GAME_CONFIG.COLORS.PRIMARY,
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.x = width / 2;
    this.titleText.y = height < 900 ? 30 : height / 8;
    this.container.addChild(this.titleText);

    // Create subtitle
    this.subtitleText = new PIXI.Text({
      text: 'tungo sa tagumpay',
      style: {
        fontFamily: 'Arial',
        fontSize: height < 900 ? 18 : 24,
        fill: GAME_CONFIG.COLORS.TEXT,
        align: 'center',
      },
    });
    this.subtitleText.anchor.set(0.5);
    this.subtitleText.x = width / 2;
    this.subtitleText.y = this.titleText.y + (height < 900 ? 50 : 80);
    this.container.addChild(this.subtitleText);

    // Create form container
    this.formContainer = new PIXI.Container();
    this.container.addChild(this.formContainer);

    // Create login form
    this.loginForm = new LoginForm(
      this.app,
      () => this.handleLoginSuccess(),
      () => this.switchToRegister()
    );

    // Create register form
    this.registerForm = new RegisterForm(
      this.app,
      () => this.handleRegisterSuccess(),
      () => this.switchToLogin()
    );

    // Add forms to container
    this.formContainer.addChild(this.loginForm);
    this.formContainer.addChild(this.registerForm);

    // Position forms
    this.positionForms();

    // Show login form by default
    this.showLogin();

    console.log('[MenuScene] Loaded');
  }

  private positionForms(): void {
    const { width, height } = this.getScreenSize();

    // Center forms horizontally
    this.formContainer.x = width / 2 - 200; // 400 is form width / 2

    // Position forms with better vertical spacing
    // For login, center it nicely. For register, position higher
    if (this.currentView === 'login') {
      // Login form can be more centered
      this.formContainer.y = Math.max(height / 2 - 250, 120);
    } else {
      // Register form needs to start higher
      this.formContainer.y = Math.max(height / 2 - 350, 100);
    }
  }

  private showLogin(): void {
    this.currentView = 'login';
    this.loginForm.show();
    this.registerForm.hide();
    this.positionForms(); // Reposition when switching views
  }

  private showRegister(): void {
    this.currentView = 'register';
    this.loginForm.hide();
    this.registerForm.show();
    this.positionForms(); // Reposition when switching views
  }

  private switchToRegister(): void {
    this.showRegister();
  }

  private switchToLogin(): void {
    this.showLogin();
  }

  private async handleLoginSuccess(): Promise<void> {
    console.log('[MenuScene] Login successful!');

    // Fetch player profile
    try {
      await usePlayerStore.getState().fetchProfile();
      await usePlayerStore.getState().fetchSiblons();
    } catch (error) {
      console.error('[MenuScene] Failed to fetch player data:', error);
    }

    // Transition to OverworldScene
    await this.sceneManager.loadScene(SCENE_NAMES.OVERWORLD);
  }

  private async handleRegisterSuccess(): Promise<void> {
    console.log('[MenuScene] Registration successful!');

    // Fetch player profile
    try {
      await usePlayerStore.getState().fetchProfile();
      await usePlayerStore.getState().fetchSiblons();
    } catch (error) {
      console.error('[MenuScene] Failed to fetch player data:', error);
    }

    // Transition to OverworldScene
    await this.sceneManager.loadScene(SCENE_NAMES.OVERWORLD);
  }

  update(_deltaTime: number): void {
    // Update input positions if window was resized
    if (this.currentView === 'login') {
      this.loginForm.updateInputPositions();
    } else {
      this.registerForm.updateInputPositions();
    }
  }

  async unload(): Promise<void> {
    // Hide forms to remove DOM elements
    this.loginForm.hide();
    this.registerForm.hide();

    await super.unload();
  }
}
