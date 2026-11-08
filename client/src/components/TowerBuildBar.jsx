import React from 'react';
import { Zap, Crosshair, Sparkles, Flame, Snowflake, Radio } from 'lucide-react';
import { TOWER_TYPES } from '../game/entities/Tower';

export function TowerBuildBar({ currentEnergy, activePlacement, onSelectTower, onCancelPlacement }) {
  const towers = Object.values(TOWER_TYPES);

  const getTowerIcon = (type) => {
    switch (type) {
      case 'pulse_laser': return <Crosshair className="w-4 h-4 text-cyan-400" />;
      case 'plasma_mortar': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'cryo_disrupter': return <Snowflake className="w-4 h-4 text-sky-400" />;
      case 'tesla_arc': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'void_railgun': return <Radio className="w-4 h-4 text-pink-400" />;
      default: return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <footer className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2">
      {/* Active placement indicator */}
      {activePlacement && (
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-orbitron rounded-sm shadow-lg animate-pulse">
          <span>SELECT TILE ON GRID TO CONSTRUCT TURRET</span>
          <button
            onClick={onCancelPlacement}
            className="px-1.5 py-0.5 bg-red-900/80 hover:bg-red-800 text-white text-[10px] font-bold rounded cursor-pointer"
          >
            CANCEL [ESC]
          </button>
        </div>
      )}

      {/* Build Dock */}
      <div className="cyber-panel px-3 py-2 rounded-sm border-b-2 border-b-purple-500 shadow-2xl flex items-center gap-2">
        {towers.map((tower, idx) => {
          const canAfford = currentEnergy >= tower.cost;
          const isSelected = activePlacement === tower.id;

          return (
            <button
              key={tower.id}
              onClick={() => onSelectTower(tower.id)}
              disabled={!canAfford}
              className={`group relative flex flex-col items-center px-3.5 py-2 rounded-sm transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-purple-950/90 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                  : canAfford
                  ? 'bg-slate-900/80 border-purple-500/30 hover:border-purple-400 hover:bg-slate-800'
                  : 'bg-black/50 border-slate-800 opacity-40 cursor-not-allowed'
              }`}
            >
              {/* Hotkey Tag */}
              <span className="absolute top-1 left-1.5 text-[9px] font-mono-code text-slate-500 group-hover:text-cyan-300">
                [{idx + 1}]
              </span>

              {/* Icon & Title */}
              <div className="mt-2.5 mb-1 flex items-center gap-1.5">
                {getTowerIcon(tower.id)}
                <span className="font-orbitron font-bold text-xs text-slate-200 group-hover:text-white">
                  {tower.name}
                </span>
              </div>

              {/* Cost & Role */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono-code">
                <span className={`font-bold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                  {tower.cost}⚡
                </span>
                <span className="text-slate-500 text-[10px]">|</span>
                <span className="text-slate-400 text-[10px] font-rajdhani">
                  {tower.role}
                </span>
              </div>

              {/* Hover Tooltip Dossier */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 cyber-panel p-2.5 rounded-sm border border-purple-400 shadow-2xl text-left z-40">
                <div className="text-[11px] font-orbitron font-bold text-cyan-300 mb-1 flex justify-between">
                  <span>{tower.name}</span>
                  <span className="text-amber-400">{tower.cost} Energy</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mb-2">
                  {tower.description}
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono-code text-slate-400 border-t border-purple-500/30 pt-1.5">
                  <div>DMG: <span className="text-slate-200">{tower.damage}</span></div>
                  <div>RNG: <span className="text-slate-200">{tower.range}</span></div>
                  <div>RATE: <span className="text-slate-200">{tower.fireRate}/s</span></div>
                  <div>TYPE: <span className="text-slate-200">{tower.projectileType}</span></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
