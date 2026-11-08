import React from 'react';
import { Terminal, Shield, Zap, Skull, AlertTriangle, Radio } from 'lucide-react';

export function EventFeed({ combatLog, activePlacement }) {
  const getLogIcon = (type) => {
    switch (type) {
      case 'kill':
        return <Skull className="w-3 h-3 text-pink-400 shrink-0" />;
      case 'alert':
        return <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />;
      case 'build':
        return <Zap className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'wave':
        return <Shield className="w-3 h-3 text-amber-400 shrink-0" />;
      default:
        return <Radio className="w-3 h-3 text-purple-400 shrink-0" />;
    }
  };

  const recentLogs = (combatLog || []).slice(0, 6);

  return (
    <footer className="w-full h-14 bg-[#070710]/95 border-t border-purple-500/30 px-4 flex items-center justify-between text-xs font-mono-code z-20 backdrop-blur-md select-none">
      {/* Feed Title */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800 shrink-0">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span className="font-orbitron font-bold text-[10px] text-slate-300 uppercase tracking-wider">
          TACTICAL EVENT FEED
        </span>
      </div>

      {/* Ticker / Scrolling Recent Combat Logs */}
      <div className="flex-1 overflow-hidden px-4 flex items-center gap-4">
        {recentLogs.length > 0 ? (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-1.5 text-[11px] whitespace-nowrap animate-fadeIn"
            >
              <span className="text-slate-500 text-[10px]">[{log.time}]</span>
              {getLogIcon(log.type)}
              <span
                className={`${
                  log.type === 'alert'
                    ? 'text-red-400 font-bold'
                    : log.type === 'kill'
                    ? 'text-pink-300'
                    : log.type === 'wave'
                    ? 'text-amber-300'
                    : log.type === 'build'
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }`}
              >
                {log.text}
              </span>
            </div>
          ))
        ) : (
          <span className="text-slate-500 text-[11px]">All sectors quiet. Monitoring quantum telemetry...</span>
        )}
      </div>

      {/* Contextual Notification Banner */}
      <div className="pl-3 border-l border-slate-800 shrink-0">
        {activePlacement ? (
          <span className="text-[10px] font-orbitron text-cyan-300 bg-cyan-950/70 border border-cyan-400/60 px-2 py-0.5 rounded animate-pulse">
            DEPLOYING: CLICK VALID BATTLEFIELD GRID NODE
          </span>
        ) : (
          <span className="text-[10px] font-orbitron text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
            SYSTEM STATUS: OPERATIONAL
          </span>
        )}
      </div>
    </footer>
  );
}
