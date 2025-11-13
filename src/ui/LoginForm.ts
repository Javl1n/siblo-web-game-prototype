/**
 * Login Form Component (PixiJS)
 *
 * Login form with email and password fields.
 */

import * as PIXI from 'pixi.js';
import { Button } from './Button';
import { TextField } from './TextField';
import { GAME_CONFIG } from '../config/constants';
import { useAuthStore } from '../state/authStore';

export class LoginForm extends PIXI.Container {
  private emailField!: TextField;
  private passwordField!: TextField;
  private loginButton!: Button;
  private registerButton!: Button;
  private errorText!: PIXI.Text;
  private titleText!: PIXI.Text;
  private app: PIXI.Application;
  private onSuccess: () => void;
  private onSwitchToRegister: () => void;

  constructor(
    app: PIXI.Application,
    onSuccess: () => void,
    onSwitchToRegister: () => void
  ) {
    super();

    this.app = app;
    this.onSuccess = onSuccess;
    this.onSwitchToRegister = onSwitchToRegister;

    this.createUI();
  }

  private createUI(): void {
    const formWidth = 400;
    const fieldWidth = 350;
    const fieldHeight = 38;
    const spacing = 12;
    let yPos = 0;

    // Title
    this.titleText = new PIXI.Text({
      text: 'Login',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 20,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = formWidth / 2;
    this.titleText.y = yPos;
    this.addChild(this.titleText);
    yPos += this.titleText.height + spacing;

    // Email field
    const emailLabel = new PIXI.Text({
      text: 'Email',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 10,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    emailLabel.x = (formWidth - fieldWidth) / 2;
    emailLabel.y = yPos;
    this.addChild(emailLabel);
    yPos += emailLabel.height + 8;

    this.emailField = new TextField({
      placeholder: 'Enter your email',
      width: fieldWidth,
      height: fieldHeight,
      type: 'email',
    });
    this.emailField.x = (formWidth - fieldWidth) / 2;
    this.emailField.y = yPos;
    this.addChild(this.emailField);
    yPos += fieldHeight + spacing;

    // Password field
    const passwordLabel = new PIXI.Text({
      text: 'Password',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 10,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    passwordLabel.x = (formWidth - fieldWidth) / 2;
    passwordLabel.y = yPos;
    this.addChild(passwordLabel);
    yPos += passwordLabel.height + 8;

    this.passwordField = new TextField({
      placeholder: 'Enter your password',
      width: fieldWidth,
      height: fieldHeight,
      type: 'password',
    });
    this.passwordField.x = (formWidth - fieldWidth) / 2;
    this.passwordField.y = yPos;
    this.addChild(this.passwordField);
    yPos += fieldHeight + spacing;

    // Error text (hidden by default)
    this.errorText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 8,
        fill: GAME_CONFIG.COLORS.DANGER,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: fieldWidth,
      },
    });
    this.errorText.anchor.set(0.5, 0);
    this.errorText.x = formWidth / 2;
    this.errorText.y = yPos;
    this.errorText.visible = false;
    this.addChild(this.errorText);
    yPos += 25; // Reserve space for error

    // Login button
    this.loginButton = new Button({
      text: 'Login',
      width: fieldWidth,
      height: 42,
      onClick: () => this.handleLogin(),
    });
    this.loginButton.x = (formWidth - fieldWidth) / 2;
    this.loginButton.y = yPos;
    this.addChild(this.loginButton);
    yPos += 42 + spacing;

    // Register link button
    const registerText = new PIXI.Text({
      text: "Don't have an account?",
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 9,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    registerText.anchor.set(0.5, 0);
    registerText.x = formWidth / 2;
    registerText.y = yPos;
    this.addChild(registerText);
    yPos += registerText.height + 10;

    this.registerButton = new Button({
      text: 'Create Account',
      width: 200,
      height: 32,
      backgroundColor: 0x2a2a3e,
      hoverColor: GAME_CONFIG.COLORS.SECONDARY,
      fontSize: 9,
      onClick: () => this.onSwitchToRegister(),
    });
    this.registerButton.x = (formWidth - 200) / 2;
    this.registerButton.y = yPos;
    this.addChild(this.registerButton);
  }

  private async handleLogin(): Promise<void> {
    const email = this.emailField.getValue().trim();
    const password = this.passwordField.getValue();

    // Clear previous error
    this.hideError();

    // Validate
    if (!email || !password) {
      this.showError('Please enter both email and password');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Disable button during login
    this.loginButton.setEnabled(false);
    this.loginButton.setText('Logging in...');

    try {
      // Call auth store
      await useAuthStore.getState().login(email, password);

      // Success - call callback
      this.onSuccess();
    } catch (error: any) {
      // Show error
      const errorMessage = error.message || 'Login failed. Please try again.';
      this.showError(errorMessage);

      // Re-enable button
      this.loginButton.setEnabled(true);
      this.loginButton.setText('Login');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showError(message: string): void {
    this.errorText.text = message;
    this.errorText.visible = true;
  }

  private hideError(): void {
    this.errorText.visible = false;
    this.errorText.text = '';
  }

  /**
   * Show the form and its input fields
   */
  show(): void {
    this.visible = true;
    this.emailField.show(this.app);
    this.passwordField.show(this.app);
  }

  /**
   * Hide the form and its input fields
   */
  hide(): void {
    this.visible = false;
    this.emailField.hide();
    this.passwordField.hide();
  }

  /**
   * Update input positions (call on window resize)
   */
  updateInputPositions(): void {
    this.emailField.updateInputPosition(this.app);
    this.passwordField.updateInputPosition(this.app);
  }

  /**
   * Cleanup
   */
  destroy(options?: boolean | PIXI.DestroyOptions): void {
    this.emailField.destroy();
    this.passwordField.destroy();
    super.destroy(options);
  }
}
