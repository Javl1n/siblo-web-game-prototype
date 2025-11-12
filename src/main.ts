/**
 * SIBLO Game - Entry Point
 *
 * Pure PixiJS implementation (no React).
 * Initializes and starts the game.
 */

import './index.css';
import { Game } from './Game';

// Create and initialize the game
const game = new Game();

game.init().catch((error) => {
  console.error('[Main] Failed to initialize game:', error);

  // Show error message to user
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff4444;
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    text-align: center;
    max-width: 400px;
  `;
  errorDiv.innerHTML = `
    <h2>Game Failed to Start</h2>
    <p>${error.message}</p>
    <p style="font-size: 12px; margin-top: 10px;">
      Please check your .env configuration and ensure the backend is running.
    </p>
  `;
  document.body.appendChild(errorDiv);
});

// Expose game instance globally for debugging (dev only)
if (import.meta.env.DEV) {
  (window as any).game = game;
}
