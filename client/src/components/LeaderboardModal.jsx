import React, { useEffect, useState } from 'react';
import { X, Trophy, RefreshCw, Award, ShieldCheck } from 'lucide-react';

const DEFAULT_SCORES = [
  { _id: '1', playerName: 'NEXUS-PRIME', score: 98500, waveReached: 50, enemiesKilled: 4820, isVictory: true },
  { _id: '2', playerName: 'CYBER-VALKYRIE', score: 72400, waveReached: 44, enemiesKilled: 3950, isVictory: false },
  { _id: '3', playerName: 'VOID-PHANTOM', score: 54100, waveReached: 38, enemiesKilled: 2900, isVictory: false },
  { _id: '4', playerName: 'GLITCH-HUNTER', score: 41200, waveReached: 30, enemiesKilled: 2100, isVictory: false },
  { _id: '5', playerName: 'GRID-RUNNER', score: 28900, waveReached: 22, enemiesKilled: 1450, isVictory: false },
];

export function LeaderboardModal({ onClose }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbSource, setDbSource] = useState('Loading...');

  const fetchScores = async () => {
    setLoading(true);
    let loadedFromApi = false;

    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setScores(data.data);
          setDbSource(data.source === 'mongodb' ? 'MongoDB Cluster' : 'Cloud Serverless API');
          loadedFromApi = true;
        }
      }
    } catch (e) {
      // API offline or static deployment
    }

    if (!loadedFromApi) {
      // Offline / LocalStorage fallback
      try {
        const local = JSON.parse(localStorage.getItem('outpost_scores') || '[]');
        const combined = [...local, ...DEFAULT_SCORES].sort((a, b) => b.score - a.score).slice(0, 20);
        setScores(combined);
        setDbSource('Local Quantum Storage (Offline / Static Deploy)');
      } catch (err) {
        setScores(DEFAULT_SCORES);
        setDbSource('Local Storage');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none scanlines">
      <div className="w-full max-w-lg cyber-panel border border-amber-500/60 rounded-sm shadow-2xl p-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black font-orbitron text-amber-300 tracking-wider">
                TACTICAL COMMAND LEADERBOARD
              </h2>
              <p className="text-[11px] text-slate-400 font-rajdhani">
                Global Operations Hall of Fame &bull; Storage: <span className="text-cyan-300">{dbSource}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scores Table */}
        <div className="max-h-72 overflow-y-auto mb-4 border border-purple-500/20 rounded bg-slate-950/60">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-orbitron text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>SYNCHRONIZING QUANTUM DATABASE...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-orbitron text-xs">
              NO OPERATIVE RECORDS REGISTERED YET.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono-code">
              <thead className="bg-slate-900/80 text-[10px] font-orbitron text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2 text-center w-12">#</th>
                  <th className="p-2">OPERATIVE</th>
                  <th className="p-2 text-center">WAVE</th>
                  <th className="p-2 text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scores.map((s, idx) => (
                  <tr key={s._id || idx} className="hover:bg-purple-950/20 transition-colors">
                    <td className="p-2 text-center font-bold">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </td>
                    <td className="p-2 font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{s.playerName}</span>
                      {s.isVictory && (
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" title="Defeated Wave 50" />
                      )}
                    </td>
                    <td className="p-2 text-center text-cyan-400 font-bold">
                      W-{s.waveReached}
                    </td>
                    <td className="p-2 text-right text-amber-400 font-bold">
                      {s.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs font-rajdhani text-slate-400">
          <button
            onClick={fetchScores}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>REFRESH</span>
          </button>
          <button
            onClick={onClose}
            className="cyber-panel px-4 py-1.5 text-xs font-orbitron text-slate-200 hover:text-white rounded border border-slate-700 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
