import React from 'react';
import { Crosshair, Snowflake, Flame, Sparkles, Radio, Zap } from 'lucide-react';
import { TOWER_TYPES } from '../game/entities/Tower';

export function TowerArmory({ currentCredits, activePlacement, onSelectTower, onCancelPlacement }) {
  // Display towers in order, highlighting the primary 3
  const towers = [
    TOWER_TYPES.pulse_tower,
    TOWER_TYPES.frost_tower,
    TOWER_TYPES.mortar_tower,
    TOWER_TYPES.tesla_tower,
    TOWER_TYPES.railgun_tower,
  ];

  const getTowerIcon = (type) => {
    switch (type) {
      case 'pulse_tower':
      case 'pulse_laser':
        return <Crosshair className="w-5 h-5 text-cyan-400" />;
      case 'frost_tower':
      case 'cryo_disrupter':
        return <Snowflake className="w-5 h-5 text-sky-400" />;
      case 'mortar_tower':
      case 'plasma_mortar':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'tesla_tower':
      case 'tesla_arc':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'railgun_tower':
      case 'void_railgun':
        return <Radio className="w-5 h-5 text-pink-400" />;
      default:
        return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <aside className="w-72 h-[calc(100vh-4rem-3.5rem)] bg-[#0a1024]/90 border-r border-purple-500/30 p-3 flex flex-col justify-between overflow-y-auto select-none z-20 backdrop-blur-md">
      <div>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-200">
              TOWER ARMORY
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-cyan-400">
            AVAIL: {currentCredits}⚡
          </span>
        </div>

        {/* Active Placement Notice */}
        {activePlacement && (
          <div className="mb-2.5 p-2 bg-cyan-950/90 border border-cyan-400 rounded text-center animate-pulse">
            <div className="text-[10px] font-orbitron font-bold text-cyan-200">
              TARGET GRID CELL TO DEPLOY
            </div>
            <button
              onClick={onCancelPlacement}
              className="mt-1 px-2 py-0.5 bg-red-900/80 hover:bg-red-800 text-white text-[9px] font-bold rounded cursor-pointer uppercase"
            >
              Cancel Placement [ESC]
            </button>
          </div>
        )}

        {/* Tower Cards List */}
        <div className="space-y-2">
          {towers.map((tower, idx) => {
            const canAfford = currentCredits >= tower.cost;
            const isSelected = activePlacement === tower.id;

            return (
              <button
                key={tower.id}
                onClick={() => onSelectTower(tower.id)}
                disabled={!canAfford}
                className={`w-full group text-left p-2.5 rounded-sm transition-all relative border cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/90 border-cyan-400 shadow-[0_0_15px_rgba(37,184,255,0.3)] scale-[1.02]'
                    : canAfford
                    ? 'bg-[#0e1630]/90 border-purple-500/25 hover:border-purple-400 hover:bg-[#131d3d]'
                    : 'bg-black/50 border-slate-800/80 opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Hotkey Tag */}
                <span className="absolute top-1.5 right-2 text-[9px] font-mono-code text-slate-500 group-hover:text-cyan-300">
                  [{idx + 1}]
                </span>

                {/* Header: Icon, Name, Price */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded bg-slate-900/90 border border-slate-700/60 group-hover:border-purple-400 transition-colors">
                    {getTowerIcon(tower.id)}
                  </div>
                  <div>
                    <div className="font-orbitron font-bold text-xs text-slate-100 group-hover:text-cyan-300 flex items-center gap-1.5">
                      <span>{tower.name}</span>
                    </div>
                    <div className="text-[10px] font-rajdhani text-purple-300">
                      {tower.role}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 leading-tight mb-2 font-rajdhani line-clamp-2">
                  {tower.description}
                </p>

                {/* Stats Matrix */}
                <div className="grid grid-cols-3 gap-1 py-1 px-1.5 rounded bg-slate-950/80 border border-slate-800/60 text-[10px] font-mono-code">
                  <div>
                    <span className="text-slate-500 text-[8px] block">DMG</span>
                    <span className="text-cyan-300 font-bold">{tower.damage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] block">RNG</span>
                    <span className="text-purple-300 font-bold">{tower.range}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] block">SPD</span>
                    <span className="text-amber-400 font-bold">{tower.fireRate}/s</span>
                  </div>
                </div>

                {/* Cost Bar */}
                <div className="mt-2 flex items-center justify-between text-xs font-mono-code border-t border-purple-500/15 pt-1.5">
                  <span className="text-slate-400 text-[10px]">CONSTRUCTION:</span>
                  <span className={`font-black ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                    {tower.cost} CREDITS
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Armory Footer Hotkey Hint */}
      <div className="p-2 rounded bg-slate-950/60 border border-purple-500/20 text-[10px] font-mono-code text-slate-400 text-center">
        PRESS <span className="text-cyan-300">[1-5]</span> FOR INSTANT SELECTION
      </div>
    </aside>
  );
}
