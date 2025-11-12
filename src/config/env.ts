/**
 * Environment Configuration Loader
 *
 * Loads and validates environment variables from .env file.
 * Provides type-safe access to all configuration values with sensible defaults.
 */

export const ENV = {
  // Backend API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT as string) || 10000,

  // WebSocket (Laravel Reverb) Configuration
  REVERB_KEY: import.meta.env.VITE_REVERB_APP_KEY || '',
  REVERB_HOST: import.meta.env.VITE_REVERB_HOST || 'localhost',
  REVERB_PORT: parseInt(import.meta.env.VITE_REVERB_PORT as string) || 8080,
  REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME || 'http',

  // Game Configuration
  GAME_WIDTH: parseInt(import.meta.env.VITE_GAME_WIDTH as string) || 800,
  GAME_HEIGHT: parseInt(import.meta.env.VITE_GAME_HEIGHT as string) || 600,
  DEBUG: import.meta.env.VITE_GAME_DEBUG === 'true',
} as const;

/**
 * Validates required environment variables on startup
 * Throws an error if critical configuration is missing
 */
export function validateEnv(): void {
  const errors: string[] = [];

  if (!ENV.API_URL) {
    errors.push('VITE_API_URL is required. Check your .env file.');
  }

  if (errors.length > 0) {
    console.error('[ENV] Configuration errors:', errors);
    throw new Error(`Environment configuration invalid:\n${errors.join('\n')}`);
  }

  // Log configuration in debug mode
  if (ENV.DEBUG) {
    console.log('[ENV] Environment configuration loaded:');
    console.log(`  - API URL: ${ENV.API_URL}`);
    console.log(`  - API Timeout: ${ENV.API_TIMEOUT}ms`);
    console.log(`  - Game Size: ${ENV.GAME_WIDTH}x${ENV.GAME_HEIGHT}`);
    console.log(`  - Reverb: ${ENV.REVERB_SCHEME}://${ENV.REVERB_HOST}:${ENV.REVERB_PORT}`);
    console.log(`  - Debug Mode: ${ENV.DEBUG}`);
  } else {
    console.log(`[ENV] Connected to API: ${ENV.API_URL}`);
  }
}
