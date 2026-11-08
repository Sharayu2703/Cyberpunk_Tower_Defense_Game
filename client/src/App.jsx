import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import { Header } from './components/Header';
import { TowerArmory } from './components/TowerArmory';
import { CommandPanel } from './components/CommandPanel';
import { EventFeed } from './components/EventFeed';
import { BenchmarkModal } from './components/BenchmarkModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StartScreenModal } from './components/StartScreenModal';
import { PauseOverlay } from './components/PauseOverlay';
import { MAP_WIDTH, MAP_HEIGHT } from './game/map/MapConfig';

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [gameState, setGameState] = useState(null);
  const [activePlacement, setActivePlacement] = useState(null);
  const [selectedTower, setSelectedTower] = useState(null);

  // Modals & Screens
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize master GameEngine
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Subscribe to engine state telemetry
    const unsubscribe = engine.subscribe((state) => {
      setGameState({ ...state });
      setSelectedTower(state.selectedTower);
      setActivePlacement(engine.placementMode);
    });

    engine.start();

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      // Numbers 1-5 for tower armory selection
      const towerKeys = ['pulse_tower', 'frost_tower', 'mortar_tower', 'tesla_tower', 'railgun_tower'];
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 5) {
        engine.setPlacementMode(towerKeys[keyNum - 1]);
        return;
      }

      if (e.key === 'Escape') {
        if (engine.placementMode) {
          engine.cancelPlacement();
        } else if (engine.selectedTower) {
          engine.selectedTower = null;
          engine.notifyState();
        }
        setShowBenchmark(false);
        setShowLeaderboard(false);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        engine.togglePause();
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        setShowBenchmark((prev) => !prev);
        return;
      }

      if (e.key === 'u' || e.key === 'U') {
        if (engine.selectedTower) {
          engine.upgradeTower(engine.selectedTower);
        }
        return;
      }

      if (e.key === 's' || e.key === 'S') {
        if (engine.selectedTower) {
          engine.sellTower(engine.selectedTower);
        }
        return;
      }
    };

    const handleWindowResize = () => {
      engine.handleResize();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleWindowResize);
      unsubscribe();
      engine.stop();
    };
  }, []);

  // Coordinate helper: maps screen canvas pixels to virtual game map coordinates
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseMove = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { x, y } = getCanvasCoords(e);
    engine.updateHoverPosition(x, y);
  };

  const handleCanvasClick = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { x, y } = getCanvasCoords(e);
    engine.handleCanvasClick(x, y);
  };

  return (
    <div className="relative w-screen h-screen bg-[#070710] overflow-hidden flex flex-col font-rajdhani select-none">
      {/* 1. TOP HEADER */}
      <Header
        gameState={gameState}
        onTogglePause={() => engineRef.current?.togglePause()}
        onSetSpeed={(spd) => engineRef.current?.setGameSpeed(spd)}
        onRestart={() => engineRef.current?.restart()}
        onOpenBenchmark={() => setShowBenchmark(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* 2. MAIN BATTLEFIELD & SIDEBARS */}
      <div className="relative flex-1 flex w-full overflow-hidden">
        {/* LEFT SIDEBAR: TOWER ARMORY */}
        <TowerArmory
          currentCredits={gameState ? (gameState.credits ?? gameState.energy) : 0}
          activePlacement={activePlacement}
          onSelectTower={(type) => engineRef.current?.setPlacementMode(type)}
          onCancelPlacement={() => engineRef.current?.cancelPlacement()}
        />

        {/* CENTER BATTLEFIELD CANVAS */}
        <main className="relative flex-1 h-full flex items-center justify-center p-2 bg-[#06040c] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            className="max-w-full max-h-full object-contain cursor-crosshair border border-purple-500/30 rounded shadow-[0_0_50px_rgba(112,39,255,0.18)]"
          />

          {/* Pause Screen Overlay */}
          {gameState && gameState.isPaused && (
            <PauseOverlay
              onResume={() => engineRef.current?.togglePause()}
              onRestart={() => engineRef.current?.restart()}
            />
          )}
        </main>

        {/* RIGHT SIDEBAR: COMMAND PANEL */}
        <CommandPanel
          selectedTower={selectedTower}
          currentCredits={gameState ? (gameState.credits ?? gameState.energy) : 0}
          gameState={gameState}
          onUpgradeTower={(t) => engineRef.current?.upgradeTower(t)}
          onSellTower={(t) => engineRef.current?.sellTower(t)}
          onSetTargetingMode={(t, mode) => {
            t.setTargetingMode(mode);
            engineRef.current?.notifyState();
          }}
          onCallWaveEarly={() => engineRef.current?.waveManager?.callWaveEarly()}
          onDeselectTower={() => {
            if (engineRef.current) {
              engineRef.current.selectedTower = null;
              engineRef.current.notifyState();
            }
          }}
        />
      </div>

      {/* 3. BOTTOM AREA: COMBAT EVENT FEED */}
      <EventFeed
        combatLog={gameState ? gameState.combatLog : []}
        activePlacement={activePlacement}
      />

      {/* MODALS */}

      {/* Start Operation Screen */}
      {showStartScreen && (
        <StartScreenModal onStart={() => setShowStartScreen(false)} />
      )}

      {/* Benchmark Developer Telemetry Modal */}
      {showBenchmark && (
        <BenchmarkModal
          gameState={gameState}
          onRunStress={() => engineRef.current?.runStressScenario()}
          onToggleNaive={() => engineRef.current?.toggleNaiveMode()}
          onClose={() => setShowBenchmark(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Game Over / Victory Modal */}
      <GameOverModal
        gameState={gameState}
        onRestart={() => engineRef.current?.restart()}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
    </div>
  );
}
