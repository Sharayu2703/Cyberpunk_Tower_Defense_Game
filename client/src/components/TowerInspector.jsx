import React from 'react';
import { X, ArrowUpCircle, DollarSign, Target, Award, Crosshair } from 'lucide-react';

export function TowerInspector({ tower, currentEnergy, onUpgrade, onSell, onSetTargetingMode, onClose }) {
  if (!tower) return null;

  const canUpgrade = tower.canUpgrade();
  const upgradeCost = tower.getUpgradeCost();
  const upgradeInfo = tower.getUpgradeInfo();
  const canAffordUpgrade = canUpgrade && currentEnergy >= upgradeCost;
  const sellValue = tower.getSellValue();

  const targetingModes = [
    { id: 'first', label: 'FIRST (Front)' },
    { id: 'last', label: 'LAST (Rear)' },
    { id: 'strongest', label: 'STRONGEST (HP)' },
    { id: 'weakest', label: 'WEAKEST (Low)' },
    { id: 'closest', label: 'CLOSEST (Dist)' },
  ];

  return (
    <aside className="absolute right-3 top-20 z-30 pointer-events-auto w-72 cyber-panel p-3.5 rounded-sm border border-purple-400/80 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/40 pb-2 mb-2.5">
        <div>
          <div className="text-[10px] font-orbitron text-cyan-400 uppercase tracking-wider">
            TACTICAL DEFENSE UNIT
          </div>
          <div className="text-base font-bold font-orbitron text-slate-100 flex items-center gap-1.5">
            <span>{tower.def.name}</span>
            <span className="px-1.5 py-0.2 bg-purple-900/80 text-purple-200 text-[10px] rounded border border-purple-400">
              TIER {tower.level}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Targeting Strategy Selector */}
      <div className="mb-3">
        <div className="text-[10px] font-orbitron text-slate-400 mb-1 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>TARGETING ALGORITHM</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-orbitron">
          {targetingModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSetTargetingMode(tower, mode.id)}
              className={`px-1.5 py-1 rounded text-center cursor-pointer transition-all ${
                tower.targetingMode === mode.id
                  ? 'bg-cyan-500 text-black font-bold shadow'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Combat Stats Grid */}
      <div className="bg-slate-950/60 p-2 rounded border border-purple-500/20 mb-3">
        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] font-mono-code">
          <div className="text-slate-400">DAMAGE:</div>
          <div className="text-right text-cyan-300 font-bold">{Math.round(tower.damage)}</div>

          <div className="text-slate-400">RANGE:</div>
          <div className="text-right text-purple-300 font-bold">{tower.range} px</div>

          <div className="text-slate-400">FIRE RATE:</div>
          <div className="text-right text-slate-200">{tower.fireRate.toFixed(1)}/s</div>

          <div className="text-slate-400">DPS:</div>
          <div className="text-right text-amber-400 font-bold">
            {(tower.damage * tower.fireRate).toFixed(0)}
          </div>

          <div className="text-slate-400 border-t border-slate-800 pt-1">KILLS:</div>
          <div className="text-right text-pink-400 font-bold border-t border-slate-800 pt-1">
            {tower.kills}
          </div>

          <div className="text-slate-400">TOTAL DMG:</div>
          <div className="text-right text-slate-300">
            {Math.round(tower.totalDamage).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons: Upgrade & Sell */}
      <div className="flex flex-col gap-2">
        {canUpgrade ? (
          <button
            onClick={() => onUpgrade(tower)}
            disabled={!canAffordUpgrade}
            className={`cyber-btn w-full py-2 px-3 rounded-sm flex items-center justify-between text-xs cursor-pointer ${
              canAffordUpgrade
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black border border-amber-400'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <ArrowUpCircle className="w-4 h-4" />
              <span>UPGRADE (TIER {tower.level + 1})</span>
            </div>
            <span className="font-mono-code font-black">{upgradeCost}⚡</span>
          </button>
        ) : (
          <div className="w-full py-1.5 text-center text-[10px] font-orbitron text-amber-400 bg-amber-950/40 border border-amber-500/40 rounded-sm">
            ★ MAXIMUM TIER REACHED ★
          </div>
        )}

        {/* Sell Button */}
        <button
          onClick={() => onSell(tower)}
          className="cyber-panel w-full py-1.5 px-3 rounded-sm flex items-center justify-between text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-500/40 hover:border-red-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-1 font-orbitron font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>DECOMMISSION (SELL)</span>
          </div>
          <span className="font-mono-code font-bold text-red-300">+{sellValue}⚡</span>
        </button>
      </div>
    </aside>
  );
}
