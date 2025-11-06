import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { GameEngine, type GameState } from '../game';

interface GameCanvasProps {
  onGameStateChange: (state: GameState) => void;
}

export const GameCanvas = ({ onGameStateChange }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const onGameStateChangeRef = useRef(onGameStateChange);

  // Keep the callback ref updated
  useEffect(() => {
    onGameStateChangeRef.current = onGameStateChange;
  }, [onGameStateChange]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: PIXI.Application;
    let game: GameEngine;
    let mounted = true;

    // Create and initialize PixiJS application
    (async () => {
      app = new PIXI.Application();

      await app.init({
        background: '#6BAA4A',
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (!mounted || !canvasRef.current) return;

      // Append canvas to DOM
      canvasRef.current.appendChild(app.canvas);

      // Initialize game engine
      game = new GameEngine(app);
      gameRef.current = game;
      appRef.current = app;

      // Subscribe to game state changes
      game.subscribe((state) => {
        onGameStateChangeRef.current(state);
      });

      // Send initial state
      onGameStateChangeRef.current(game.getState());

      // Game loop
      app.ticker.add((ticker) => {
        game.update(ticker.deltaTime);
      });
    })();

    // Cleanup
    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
      if (appRef.current) {
        appRef.current.ticker.stop();
        appRef.current.destroy(true, { children: true, texture: true, textureSource: true });
        appRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  return <div ref={canvasRef} className="relative w-full h-full" />;
};
