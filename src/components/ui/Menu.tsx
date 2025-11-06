interface MenuProps {
  onIncreaseScore: () => void;
  onDecreaseLives: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
}

export const Menu = ({ onIncreaseScore, onDecreaseLives, onTogglePause, isPaused }: MenuProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
      <div className="flex justify-center gap-4">
        {/* Control buttons */}
        <button
          onClick={onIncreaseScore}
          className="pointer-events-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 border border-green-500"
        >
          +10 Score
        </button>

        <button
          onClick={onTogglePause}
          className={`pointer-events-auto font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 border ${
            isPaused
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-500'
              : 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500'
          } text-white`}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={onDecreaseLives}
          className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 border border-red-500"
        >
          -1 Life
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <div className="inline-block bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
          <div className="text-sm text-gray-300">
            Use <span className="font-bold text-white">Arrow Keys</span> or{' '}
            <span className="font-bold text-white">WASD</span> to move
          </div>
        </div>
      </div>
    </div>
  );
};
