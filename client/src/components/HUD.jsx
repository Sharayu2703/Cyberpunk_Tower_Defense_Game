import React from 'react';
import { Shield, Zap, Award, Play, Pause, FastForward, RotateCcw, Volume2, VolumeX, Activity, Trophy, AlertTriangle } from 'lucide-react';
import { audio } from './AudioController';

export function HUD({ gameState, onTogglePause, onSetSpeed, onRestart, onOpenBenchmark, onOpenLeaderboard, onCallWaveEarly }) {
  const [isMuted, setIsMuted] = React.useState(audio.muted);

  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const hpRatio = gameState ? Math.max(0, gameState.baseHealth / gameState.maxBaseHealth) : 1;
  const isLowHealth = hpRatio < 0.3;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 flex justify-between items-start">
      {/* Top Left: Base Health & Energy Economy */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Base Core Health Widget */}
        <div className={`cyber-panel px-4 py-2.5 rounded-sm border-l-4 ${isLowHealth ? 'border-l-red-500 animate-pulse' : 'border-l-cyan-400'} flex items-center gap-3 shadow-lg`}>
          <div className={`p-2 rounded ${isLowHealth ? 'bg-red-950/80 text-red-400' : 'bg-cyan-950/80 text-cyan-400'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-orbitron uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <span>VOID CORE SHIELD</span>
              {isLowHealth && <AlertTriangle className="w-3.5 h-3.5 text-red-400 inline" />}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold font-orbitron ${isLowHealth ? 'text-red-400 neon-glow-pink' : 'text-cyan-300 neon-glow-cyan'}`}>
                {gameState ? Math.round(gameState.baseHealth) : 100}
              </span>
              <span className="text-xs text-slate-500 font-mono-code">/ 100 HP</span>
            </div>
            {/* Progress bar */}
            <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  hpRatio > 0.5 ? 'bg-cyan-400' : hpRatio > 0.25 ? 'bg-amber-400' : 'bg-red-500'
                }`}
                style={{ width: `${hpRatio * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Energy / Credits Widget */}
        <div className="cyber-panel px-4 py-2.5 rounded-sm border-l-4 border-l-purple-500 flex items-center gap-3 shadow-lg">
          <div className="p-2 rounded bg-purple-950/80 text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-orbitron uppercase text-slate-400 tracking-wider">
              QUANTUM ENERGY
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-orbitron text-purple-300 neon-glow-purple">
                {gameState ? gameState.energy : 450}
              </span>
              <span className="text-xs text-purple-400 font-mono-code">⚡</span>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="cyber-panel px-3.5 py-2.5 rounded-sm border-l-4 border-l-pink-500 flex items-center gap-2.5 shadow-lg hidden md:flex">
          <Award className="w-4 h-4 text-pink-400" />
          <div>
            <div className="text-[10px] font-orbitron uppercase text-slate-400">SCORE</div>
            <div className="text-base font-bold font-orbitron text-pink-300">
              {gameState ? gameState.score.toLocaleString() : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Top Center: Wave Status & Early Call */}
      <div className="pointer-events-auto flex flex-col items-center">
        <div className="cyber-panel px-5 py-2 rounded-sm border-t-2 border-t-cyan-500 text-center shadow-2xl flex items-center gap-4">
          <div>
            <div className="text-[11px] font-orbitron text-cyan-400 uppercase tracking-widest">
              DEFENSE SECTOR
            </div>
            <div className="text-2xl font-black font-orbitron text-slate-100 flex items-center justify-center gap-2">
              <span>WAVE</span>
              <span className="text-cyan-300 neon-glow-cyan">{gameState ? gameState.currentWave : 1}</span>
              <span className="text-xs text-slate-500">/ 50</span>
            </div>
          </div>

          <div className="h-8 w-px bg-purple-500/30" />

          {/* Wave State / Timer */}
          <div>
            {gameState && gameState.waveState === 'idle' ? (
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="text-[10px] text-amber-400 font-orbitron">NEXT WAVE IN</div>
                  <div className="text-lg font-bold font-orbitron text-amber-300">
                    {gameState.waveTimer}s
                  </div>
                </div>
                <button
                  onClick={onCallWaveEarly}
                  className="cyber-btn px-2.5 py-1.5 text-[11px] bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded shadow cursor-pointer border border-amber-400"
                >
                  START NOW
                </button>
              </div>
            ) : (
              <div className="text-left">
                <div className="text-[10px] text-pink-400 font-orbitron">HOSTILES ACTIVE</div>
                <div className="text-lg font-bold font-orbitron text-pink-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping inline-block" />
                  <span>{gameState ? gameState.enemiesRemaining : 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {gameState && gameState.isStressMode && (
          <div className="mt-1 px-3 py-0.5 bg-red-950/90 border border-red-500 text-red-300 text-[10px] font-orbitron font-bold tracking-wider rounded-sm animate-pulse">
            ⚠️ STRESS BENCHMARK ACTIVE (5000 HOSTILES / 100 TOWERS)
          </div>
        )}
      </div>

      {/* Top Right: Controls & Stress Test & Audio */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Stress Test / Benchmark Button */}
        <button
          onClick={onOpenBenchmark}
          className="cyber-btn px-3 py-2 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-400/60 text-purple-200 text-xs rounded-sm flex items-center gap-1.5 shadow-lg shadow-purple-950/50 cursor-pointer"
          title="Open Stress Benchmark & Performance Telemetry (5,000 enemies / 100 towers / 1,000 projectiles)"
        >
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">BENCHMARK HUD</span>
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="cyber-panel p-2 hover:bg-purple-900/50 text-slate-300 hover:text-white rounded-sm cursor-pointer border border-slate-700 hover:border-purple-400"
          title="High Scores Leaderboard"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        {/* Speed Controls (1x, 2x, 4x) */}
        <div className="cyber-panel p-1 rounded-sm border border-slate-700 flex items-center gap-1">
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-1 text-xs font-orbitron font-bold rounded cursor-pointer transition-all ${
                gameState && gameState.gameSpeed === spd
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Pause Button */}
        <button
          onClick={onTogglePause}
          className={`cyber-panel p-2 rounded-sm cursor-pointer border ${
            gameState && gameState.isPaused
              ? 'bg-amber-500/20 text-amber-400 border-amber-400 animate-pulse'
              : 'text-slate-300 hover:text-white border-slate-700 hover:border-cyan-400'
          }`}
          title={gameState && gameState.isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {gameState && gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className="cyber-panel p-2 text-slate-300 hover:text-white rounded-sm cursor-pointer border border-slate-700 hover:border-cyan-400"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="cyber-panel p-2 text-slate-400 hover:text-red-400 rounded-sm cursor-pointer border border-slate-700 hover:border-red-400"
          title="Restart Mission"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
