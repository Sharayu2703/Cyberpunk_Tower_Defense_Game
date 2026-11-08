import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { audio } from './AudioController';

export function PauseOverlay({ onResume, onRestart }) {
  const [isMuted, setIsMuted] = React.useState(audio.muted);

  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md select-none scanlines">
      <div className="w-full max-w-sm cyber-panel p-6 rounded-sm border-2 border-purple-500/80 text-center shadow-2xl relative">
        <div className="inline-flex p-3 rounded-full mb-3 bg-purple-950/80 border border-purple-500/60 shadow-[0_0_20px_rgba(112,39,255,0.4)]">
          <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        <h2 className="text-xl font-black font-orbitron text-white tracking-widest mb-1 neon-glow-purple">
          MISSION PAUSED
        </h2>
        <p className="text-xs text-slate-400 font-rajdhani mb-6">
          TACTICAL PROTOCOL SUSPENDED &bull; PRESS [SPACE] TO RESUME
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="cyber-btn w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 text-black font-black text-xs rounded cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={toggleSound}
            className="w-full py-2 px-4 rounded text-xs font-orbitron text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2 px-4 rounded text-xs font-orbitron text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ABORT & RESTART MISSION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
