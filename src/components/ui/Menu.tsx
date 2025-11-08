export const Menu = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
      {/* Instructions */}
      <div className="text-center">
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
