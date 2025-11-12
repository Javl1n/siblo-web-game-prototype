/**
 * Register Form Component (PixiJS)
 *
 * Registration form with all required fields for new student accounts.
 */

import * as PIXI from 'pixi.js';
import { Button } from './Button';
import { TextField } from './TextField';
import { GAME_CONFIG } from '../config/constants';
import { useAuthStore } from '../state/authStore';
import type { RegisterRequest } from '../api/types';

export class RegisterForm extends PIXI.Container {
  private nameField: TextField;
  private usernameField: TextField;
  private emailField: TextField;
  private passwordField: TextField;
  private passwordConfirmField: TextField;
  private trainerNameField: TextField;
  private registerButton: Button;
  private backButton: Button;
  private errorText: PIXI.Text;
  private titleText: PIXI.Text;
  private app: PIXI.Application;
  private onSuccess: () => void;
  private onBack: () => void;

  constructor(
    app: PIXI.Application,
    onSuccess: () => void,
    onBack: () => void
  ) {
    super();

    this.app = app;
    this.onSuccess = onSuccess;
    this.onBack = onBack;

    this.createUI();
  }

  private createUI(): void {
    const formWidth = 400;
    const fieldWidth = 350;
    const fieldHeight = 38;
    const spacing = 12; // Reduced from 15
    let yPos = 0;

    // Title
    this.titleText = new PIXI.Text({
      text: 'Create Account',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = formWidth / 2;
    this.titleText.y = yPos;
    this.addChild(this.titleText);
    yPos += this.titleText.height + spacing;

    // Full Name
    this.addFieldWithLabel('Full Name', 'name', yPos);
    this.nameField = new TextField({
      placeholder: 'Juan Dela Cruz',
      width: fieldWidth,
      height: fieldHeight,
      type: 'text',
      maxLength: 100,
    });
    this.nameField.x = (formWidth - fieldWidth) / 2;
    this.nameField.y = yPos + 20;
    this.addChild(this.nameField);
    yPos += 20 + fieldHeight + spacing;

    // Username
    this.addFieldWithLabel('Username', 'username', yPos);
    this.usernameField = new TextField({
      placeholder: 'juandc',
      width: fieldWidth,
      height: fieldHeight,
      type: 'text',
      maxLength: 50,
    });
    this.usernameField.x = (formWidth - fieldWidth) / 2;
    this.usernameField.y = yPos + 20;
    this.addChild(this.usernameField);
    yPos += 20 + fieldHeight + spacing;

    // Email
    this.addFieldWithLabel('Email', 'email', yPos);
    this.emailField = new TextField({
      placeholder: 'juan@example.com',
      width: fieldWidth,
      height: fieldHeight,
      type: 'email',
    });
    this.emailField.x = (formWidth - fieldWidth) / 2;
    this.emailField.y = yPos + 20;
    this.addChild(this.emailField);
    yPos += 20 + fieldHeight + spacing;

    // Password
    this.addFieldWithLabel('Password', 'password', yPos);
    this.passwordField = new TextField({
      placeholder: 'Min 8 characters',
      width: fieldWidth,
      height: fieldHeight,
      type: 'password',
    });
    this.passwordField.x = (formWidth - fieldWidth) / 2;
    this.passwordField.y = yPos + 20;
    this.addChild(this.passwordField);
    yPos += 20 + fieldHeight + spacing;

    // Confirm Password
    this.addFieldWithLabel('Confirm Password', 'passwordConfirm', yPos);
    this.passwordConfirmField = new TextField({
      placeholder: 'Re-enter password',
      width: fieldWidth,
      height: fieldHeight,
      type: 'password',
    });
    this.passwordConfirmField.x = (formWidth - fieldWidth) / 2;
    this.passwordConfirmField.y = yPos + 20;
    this.addChild(this.passwordConfirmField);
    yPos += 20 + fieldHeight + spacing;

    // Trainer Name
    this.addFieldWithLabel('Trainer Name (In-Game)', 'trainerName', yPos);
    this.trainerNameField = new TextField({
      placeholder: 'Trainer Juan',
      width: fieldWidth,
      height: fieldHeight,
      type: 'text',
      maxLength: 50,
    });
    this.trainerNameField.x = (formWidth - fieldWidth) / 2;
    this.trainerNameField.y = yPos + 20;
    this.addChild(this.trainerNameField);
    yPos += 20 + fieldHeight + spacing;

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

    // Register button
    this.registerButton = new Button({
      text: 'Create Account',
      width: fieldWidth,
      height: 42,
      backgroundColor: GAME_CONFIG.COLORS.SUCCESS,
      hoverColor: 0x6BC91F,
      onClick: () => this.handleRegister(),
    });
    this.registerButton.x = (formWidth - fieldWidth) / 2;
    this.registerButton.y = yPos;
    this.addChild(this.registerButton);
    yPos += 42 + spacing;

    // Back button
    this.backButton = new Button({
      text: 'Back to Login',
      width: 200,
      height: 32,
      backgroundColor: 0x2a2a3e,
      hoverColor: GAME_CONFIG.COLORS.SECONDARY,
      fontSize: 9,
      onClick: () => this.onBack(),
    });
    this.backButton.x = (formWidth - 200) / 2;
    this.backButton.y = yPos;
    this.addChild(this.backButton);
  }

  private addFieldWithLabel(label: string, fieldName: string, yPos: number): void {
    const fieldLabel = new PIXI.Text({
      text: label,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 10,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    fieldLabel.x = 25;
    fieldLabel.y = yPos;
    this.addChild(fieldLabel);
  }

  private async handleRegister(): Promise<void> {
    // Get values
    const name = this.nameField.getValue().trim();
    const username = this.usernameField.getValue().trim();
    const email = this.emailField.getValue().trim();
    const password = this.passwordField.getValue();
    const passwordConfirm = this.passwordConfirmField.getValue();
    const trainerName = this.trainerNameField.getValue().trim();

    // Clear previous error
    this.hideError();

    // Validate
    const validation = this.validateForm(name, username, email, password, passwordConfirm, trainerName);
    if (!validation.valid) {
      this.showError(validation.error!);
      return;
    }

    // Disable button during registration
    this.registerButton.setEnabled(false);
    this.registerButton.setText('Creating Account...');

    try {
      const registerData: RegisterRequest = {
        name,
        username,
        email,
        password,
        password_confirmation: passwordConfirm,
        trainer_name: trainerName,
      };

      // Call auth store
      await useAuthStore.getState().register(registerData);

      // Success - call callback
      this.onSuccess();
    } catch (error: any) {
      // Show error
      let errorMessage = 'Registration failed. Please try again.';

      // Handle validation errors from backend
      if (error.errors) {
        const errors = Object.values(error.errors).flat();
        errorMessage = errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.showError(errorMessage);

      // Re-enable button
      this.registerButton.setEnabled(true);
      this.registerButton.setText('Create Account');
    }
  }

  private validateForm(
    name: string,
    username: string,
    email: string,
    password: string,
    passwordConfirm: string,
    trainerName: string
  ): { valid: boolean; error?: string } {
    if (!name) {
      return { valid: false, error: 'Please enter your full name' };
    }

    if (!username) {
      return { valid: false, error: 'Please enter a username' };
    }

    if (username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (!email) {
      return { valid: false, error: 'Please enter your email' };
    }

    if (!this.isValidEmail(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    if (!password) {
      return { valid: false, error: 'Please enter a password' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password !== passwordConfirm) {
      return { valid: false, error: 'Passwords do not match' };
    }

    if (!trainerName) {
      return { valid: false, error: 'Please enter a trainer name' };
    }

    return { valid: true };
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
    this.nameField.show(this.app);
    this.usernameField.show(this.app);
    this.emailField.show(this.app);
    this.passwordField.show(this.app);
    this.passwordConfirmField.show(this.app);
    this.trainerNameField.show(this.app);
  }

  /**
   * Hide the form and its input fields
   */
  hide(): void {
    this.visible = false;
    this.nameField.hide();
    this.usernameField.hide();
    this.emailField.hide();
    this.passwordField.hide();
    this.passwordConfirmField.hide();
    this.trainerNameField.hide();
  }

  /**
   * Update input positions (call on window resize)
   */
  updateInputPositions(): void {
    this.nameField.updateInputPosition(this.app);
    this.usernameField.updateInputPosition(this.app);
    this.emailField.updateInputPosition(this.app);
    this.passwordField.updateInputPosition(this.app);
    this.passwordConfirmField.updateInputPosition(this.app);
    this.trainerNameField.updateInputPosition(this.app);
  }

  /**
   * Cleanup
   */
  destroy(options?: boolean | PIXI.ContainerDestroyOptions): void {
    this.nameField.destroy();
    this.usernameField.destroy();
    this.emailField.destroy();
    this.passwordField.destroy();
    this.passwordConfirmField.destroy();
    this.trainerNameField.destroy();
    super.destroy(options);
  }
}
