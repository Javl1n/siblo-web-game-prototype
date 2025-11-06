import type { GameState } from '../../game';

interface HUDProps {
  gameState: GameState;
}

export const HUD = ({ gameState }: HUDProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
      <div className="flex justify-between items-start">
        {/* Score */}
        <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Score</div>
          <div className="text-3xl font-bold text-white">{gameState.score}</div>
        </div>

        {/* Lives */}
        <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Lives</div>
          <div className="flex gap-2 mt-1">
            {Array.from({ length: gameState.lives }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-red-500 rounded-full border-2 border-white"
              />
            ))}
            {Array.from({ length: Math.max(0, 3 - gameState.lives) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-8 h-8 bg-gray-700/50 rounded-full border-2 border-gray-600"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {!gameState.isRunning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-black/80 backdrop-blur-md px-12 py-8 rounded-2xl border-2 border-red-500 text-center">
            <div className="text-5xl font-bold text-red-500 mb-2">GAME OVER</div>
            <div className="text-xl text-gray-300">Final Score: {gameState.score}</div>
          </div>
        </div>
      )}
    </div>
  );
};
