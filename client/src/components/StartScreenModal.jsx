import React from 'react';
import { Radar, Play, ShieldCheck, Zap, Crosshair, Award } from 'lucide-react';
import { audio } from './AudioController';

export function StartScreenModal({ onStart }) {
  const handleStart = () => {
    audio.init();
    audio.playWaveStart();
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none scanlines">
      <div className="w-full max-w-xl cyber-panel p-6 sm:p-8 rounded-sm border-2 border-purple-500/80 text-center shadow-[0_0_60px_rgba(112,39,255,0.3)] relative">
        {/* Animated Brand Emblem */}
        <div className="inline-flex p-3.5 rounded-full mb-3 bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/60 shadow-[0_0_25px_rgba(37,184,255,0.4)]">
          <Radar className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-white tracking-widest neon-glow-blue">
            OUTPOST
          </h1>
          <span className="text-xs font-orbitron font-bold px-2 py-0.5 rounded bg-purple-950 text-cyan-300 border border-purple-400">
            PROTOCOL ZERO
          </span>
        </div>
        <p className="text-xs font-orbitron text-purple-300 tracking-widest uppercase mb-4">
          Tactical Quantum Perimeter Defense
        </p>

        {/* Mission Briefing Card */}
        <div className="p-3.5 rounded bg-[#0a1024]/90 border border-purple-500/30 text-left mb-6 space-y-2">
          <div className="text-[10px] font-orbitron text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPERATION BRIEFING</span>
          </div>
          <p className="text-xs text-slate-300 font-rajdhani leading-relaxed">
            Dimensional hostile vanguard forces have breached sector perimeter gates Alpha and Beta. Construct and upgrade automated defense turrets along the approach corridors to protect the Outpost Command Core through all <strong className="text-pink-400">50 incursion waves</strong>.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-500/20 text-center">
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-orbitron text-slate-400 block">WAVES</span>
              <span className="text-base font-bold font-orbitron text-cyan-300">50 WAVES</span>
            </div>
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-orbitron text-slate-400 block">STARTING CREDITS</span>
              <span className="text-base font-bold font-orbitron text-amber-300">450⚡</span>
            </div>
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-orbitron text-slate-400 block">BOSS ENCOUNTERS</span>
              <span className="text-base font-bold font-orbitron text-pink-400">EVERY 10 WAVES</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="cyber-btn w-full py-3 px-6 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-black font-black text-sm rounded cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,184,255,0.4)] tracking-widest"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>INITIATE PROTOCOL // DEPLOY DEFENSES</span>
        </button>
      </div>
    </div>
  );
}
