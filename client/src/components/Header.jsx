import React, { useState } from 'react';
import { Shield, Zap, Award, Play, Pause, FastForward, RotateCcw, Volume2, VolumeX, Activity, Trophy, AlertTriangle, Radar } from 'lucide-react';
import { audio } from './AudioController';

export function Header({ gameState, onTogglePause, onSetSpeed, onRestart, onOpenBenchmark, onOpenLeaderboard }) {
  const [isMuted, setIsMuted] = useState(audio.muted);

  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const hpRatio = gameState ? Math.max(0, gameState.baseHealth / gameState.maxBaseHealth) : 1;
  const isCritical = hpRatio < 0.3;

  return (
    <header className="w-full h-16 bg-[#0a1024]/90 border-b border-purple-500/30 px-4 flex items-center justify-between select-none z-30 shadow-2xl backdrop-blur-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/50 shadow-[0_0_15px_rgba(112,39,255,0.4)]">
          <Radar className="w-5 h-5 text-electric-blue animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-orbitron font-black text-lg tracking-wider text-white neon-glow-blue">
              OUTPOST
            </span>
            <span className="text-[10px] font-orbitron font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-neon-violet border border-purple-500/40">
              PROTOCOL ZERO
            </span>
          </div>
          <p className="text-[10px] font-rajdhani text-slate-400 tracking-wider">
            QUANTUM PERIMETER DEFENSE COMMAND
          </p>
        </div>
      </div>

      {/* Core Vitals: Base Health, Credits, Wave, Score */}
      <div className="flex items-center gap-4">
        {/* Outpost Core Hull & Shield */}
        <div className={`cyber-panel px-3.5 py-1.5 rounded-sm border-l-4 ${isCritical ? 'border-l-red-500 animate-pulse' : 'border-l-cyan-400'} flex items-center gap-2.5`}>
          <Shield className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-cyan-400'}`} />
          <div>
            <div className="text-[9px] font-orbitron uppercase text-slate-400 flex items-center gap-1">
              <span>CORE INTEGRITY</span>
              {isCritical && <AlertTriangle className="w-3 h-3 text-red-400 inline" />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-black font-orbitron ${isCritical ? 'text-red-400 neon-glow-red' : 'text-cyan-300 neon-glow-cyan'}`}>
                {gameState ? Math.round(gameState.baseHealth) : 100}
              </span>
              <span className="text-[10px] text-slate-500 font-mono-code">/ 100 HP</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden ml-1">
            <div
              className={`h-full transition-all duration-300 ${
                hpRatio > 0.5 ? 'bg-cyan-400' : hpRatio > 0.25 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Currency / Credits */}
        <div className="cyber-panel px-3.5 py-1.5 rounded-sm border-l-4 border-l-purple-500 flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-[9px] font-orbitron uppercase text-slate-400">CREDITS</div>
            <div className="flex items-center gap-1 text-sm font-black font-orbitron text-purple-300 neon-glow-purple">
              <span>{gameState ? (gameState.credits ?? gameState.energy) : 450}</span>
              <span className="text-[10px] text-purple-400">⚡</span>
            </div>
          </div>
        </div>

        {/* Incursion Wave Progress */}
        <div className="cyber-panel px-3.5 py-1.5 rounded-sm border-l-4 border-l-pink-500 flex items-center gap-2.5">
          <div className="text-center">
            <div className="text-[9px] font-orbitron uppercase text-slate-400">INCURSION</div>
            <div className="text-sm font-black font-orbitron text-white flex items-center gap-1">
              <span className="text-pink-400">WAVE {gameState ? gameState.currentWave : 1}</span>
              <span className="text-slate-500 text-[10px]">/ 50</span>
            </div>
          </div>
        </div>

        {/* Tactical Score */}
        <div className="cyber-panel px-3.5 py-1.5 rounded-sm border-l-4 border-l-amber-500 flex items-center gap-2.5 hidden lg:flex">
          <Award className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[9px] font-orbitron uppercase text-slate-400">SCORE</div>
            <div className="text-sm font-black font-orbitron text-amber-300">
              {gameState ? gameState.score.toLocaleString() : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Control Deck: Speed, Pause, Audio, Benchmark, Leaderboard, Restart */}
      <div className="flex items-center gap-2">
        {/* Speed Controls: 1x, 2x, 3x (strictly per requirement) */}
        <div className="cyber-panel p-1 rounded-sm flex items-center gap-1 border border-slate-700/60">
          {[1, 2, 3].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-0.5 text-xs font-orbitron font-bold rounded cursor-pointer transition-all ${
                gameState && gameState.gameSpeed === spd
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Simulation Speed ${spd}x`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Pause / Resume Button */}
        <button
          onClick={onTogglePause}
          className={`cyber-panel p-2 rounded-sm cursor-pointer border ${
            gameState && gameState.isPaused
              ? 'bg-amber-500/20 text-amber-400 border-amber-400 animate-pulse'
              : 'text-slate-300 hover:text-white border-slate-700 hover:border-cyan-400'
          }`}
          title={gameState && gameState.isPaused ? 'Resume Mission [SPACE]' : 'Pause Mission [SPACE]'}
        >
          {gameState && gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          className="cyber-panel p-2 rounded-sm text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-400 cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Benchmark Developer Panel Toggle */}
        <button
          onClick={onOpenBenchmark}
          className="cyber-btn px-2.5 py-1.5 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-cyan-300 border border-purple-500/60 text-xs rounded-sm flex items-center gap-1.5 shadow-md cursor-pointer"
          title="Open Performance Benchmark & Stress Scenario [B]"
        >
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden xl:inline text-[11px]">BENCHMARK</span>
        </button>

        {/* Leaderboard Hall of Fame */}
        <button
          onClick={onOpenLeaderboard}
          className="cyber-panel p-2 rounded-sm text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400 cursor-pointer"
          title="Global Hall of Fame"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        {/* Restart Mission */}
        <button
          onClick={onRestart}
          className="cyber-panel p-2 rounded-sm text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-400 cursor-pointer"
          title="Restart Mission"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
