import { useState, useRef } from 'react';
import { GameEngine, type GameState } from '../game';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    isRunning: true,
  });

  const gameRef = useRef<GameEngine | null>(null);

  const handleGameStateChange = (state: GameState) => {
    setGameState(state);
  };

  return {
    gameState,
    gameRef,
    handleGameStateChange,
  };
};
