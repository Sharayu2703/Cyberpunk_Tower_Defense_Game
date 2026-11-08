import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Award, CheckCircle, Skull, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export function GameOverModal({ gameState, onRestart, onOpenLeaderboard }) {
  const [playerName, setPlayerName] = useState('CYBER-OPERATIVE');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isVictory = gameState ? gameState.isVictory : false;

  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#25b8ff', '#a855f7', '#ec4899', '#f59e0b'],
        });
      } catch (e) {}
    }
  }, [isVictory]);

  if (!gameState || (!gameState.isGameOver && !gameState.isVictory)) return null;

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (submitted || submitting) return;
    setSubmitting(true);

    const record = {
      _id: 'local_' + Date.now(),
      playerName: playerName.trim() || 'CYBER-OPERATIVE',
      score: gameState.score,
      waveReached: gameState.currentWave,
      enemiesKilled: gameState.enemiesKilled,
      isVictory: gameState.isVictory,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage immediately so static Vercel users never lose scores
    try {
      const local = JSON.parse(localStorage.getItem('outpost_scores') || '[]');
      local.unshift(record);
      localStorage.setItem('outpost_scores', JSON.stringify(local.slice(0, 30)));
    } catch (err) {}

    // Also attempt remote API post
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (err) {
      // Remote API offline / static host; localStorage has already saved it
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none scanlines">
      <div className={`w-full max-w-md cyber-panel p-6 rounded-sm border-2 ${
        isVictory ? 'border-cyan-400' : 'border-red-500'
      } text-center shadow-2xl relative`}>
        {/* Icon & Title */}
        <div className="mb-4">
          <div className="inline-flex p-3 rounded-full mb-2 bg-[#0a1024] border border-slate-700">
            {isVictory ? (
              <Trophy className="w-10 h-10 text-cyan-400 animate-bounce" />
            ) : (
              <Skull className="w-10 h-10 text-red-500 animate-pulse" />
            )}
          </div>
          <h2 className={`text-2xl font-black font-orbitron ${
            isVictory ? 'text-cyan-300 neon-glow-cyan' : 'text-red-400 neon-glow-red'
          }`}>
            {isVictory ? 'SECTOR DEFENSE: VICTORY!' : 'OUTPOST OVERRUN: DEFEAT'}
          </h2>
          <p className="text-xs text-slate-400 font-rajdhani mt-1">
            {isVictory
              ? 'All 50 Incursion waves repelled. Sector stabilized.'
              : 'The Outpost Command Core has sustained fatal hull failure.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="bg-slate-950/80 p-3.5 rounded border border-purple-500/30 mb-5">
          <div className="grid grid-cols-2 gap-3 text-left font-mono-code text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">FINAL SCORE:</div>
              <div className="text-lg font-bold text-amber-400">
                {gameState.score.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">WAVE REACHED:</div>
              <div className="text-lg font-bold text-cyan-400">
                {gameState.currentWave} <span className="text-xs text-slate-500">/ 50</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">HOSTILES ELIMINATED:</div>
              <div className="text-base font-bold text-pink-400">
                {gameState.enemiesKilled.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">OPERATIVE RATING:</div>
              <div className="text-base font-bold text-purple-300">
                {isVictory ? 'S-TIER COMMANDER' : gameState.currentWave >= 30 ? 'A-TIER GUARDIAN' : 'TACTICAL CADET'}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {!submitted ? (
          <form onSubmit={handleSubmitScore} className="mb-5 flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 16))}
              placeholder="ENTER CALLSIGN"
              maxLength={16}
              className="flex-1 bg-slate-900 border border-purple-500/50 rounded px-3 py-2 text-xs font-orbitron text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded cursor-pointer border border-purple-400 flex items-center gap-1 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'TRANSMITTING...' : 'TRANSMIT'}</span>
            </button>
          </form>
        ) : (
          <div className="mb-5 p-2 bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-orbitron rounded flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>RECORD TRANSMITTED TO LEADERBOARD!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRestart}
            className="cyber-btn flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-black text-xs rounded cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RE-DEPLOY MISSION</span>
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="cyber-panel px-4 py-2.5 text-xs font-orbitron text-amber-400 hover:text-white rounded border border-amber-500/50 cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>HALL OF FAME</span>
          </button>
        </div>
      </div>
    </div>
  );
}
