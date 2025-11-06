import { useState, useRef } from 'react';
import { GameEngine, type GameState } from '../game';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isRunning: true,
  });

  const gameRef = useRef<GameEngine | null>(null);

  const handleGameStateChange = (state: GameState) => {
    setGameState(state);
  };

  const incrementScore = () => {
    gameRef.current?.incrementScore(10);
  };

  const decrementLives = () => {
    gameRef.current?.decrementLives();
  };

  const togglePause = () => {
    gameRef.current?.togglePause();
  };

  return {
    gameState,
    gameRef,
    handleGameStateChange,
    incrementScore,
    decrementLives,
    togglePause,
  };
};
