import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/ui/HUD';
import { Menu } from './components/ui/Menu';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
    gameState,
    handleGameStateChange,
  } = useGameState();

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden relative">
      {/* PixiJS Game Canvas (Vanilla PixiJS) */}
      <GameCanvas onGameStateChange={handleGameStateChange} />

      {/* React UI Layer (Tailwind CSS) */}
      <HUD gameState={gameState} />
      <Menu />
    </div>
  );
}

export default App;
