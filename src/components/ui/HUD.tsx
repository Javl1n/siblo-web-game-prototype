import type { GameState } from '../../game';

interface HUDProps {
  gameState: GameState;
}

export const HUD = ({ gameState }: HUDProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
      {/* Status indicator */}
      {!gameState.isRunning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-black/80 backdrop-blur-md px-12 py-8 rounded-2xl border-2 border-red-500 text-center">
            <div className="text-5xl font-bold text-red-500 mb-2">GAME PAUSED</div>
          </div>
        </div>
      )}
    </div>
  );
};
