import React from 'react';
import { Target, ArrowUpCircle, DollarSign, X, ShieldAlert, Clock, HelpCircle, Activity, ChevronRight, Zap } from 'lucide-react';

export function CommandPanel({
  selectedTower,
  currentCredits,
  gameState,
  onUpgradeTower,
  onSellTower,
  onSetTargetingMode,
  onCallWaveEarly,
  onDeselectTower,
}) {
  const canUpgrade = selectedTower && selectedTower.canUpgrade();
  const upgradeCost = selectedTower ? selectedTower.getUpgradeCost() : 0;
  const upgradeInfo = selectedTower ? selectedTower.getUpgradeInfo() : null;
  const canAffordUpgrade = canUpgrade && currentCredits >= upgradeCost;
  const sellValue = selectedTower ? selectedTower.getSellValue() : 0;

  const targetingModes = [
    { id: 'first', label: 'FIRST (Front)' },
    { id: 'last', label: 'LAST (Rear)' },
    { id: 'strongest', label: 'STRONG (HP)' },
    { id: 'weakest', label: 'WEAK (Low)' },
    { id: 'closest', label: 'CLOSE (Dist)' },
  ];

  return (
    <aside className="w-80 h-[calc(100vh-4rem-3.5rem)] bg-[#0a1024]/90 border-l border-purple-500/30 p-3 flex flex-col justify-between overflow-y-auto select-none z-20 backdrop-blur-md">
      <div className="space-y-3.5">
        {/* SECTION 1: SELECTED TOWER INSPECTOR (if tower selected) */}
        {selectedTower ? (
          <div className="p-3 rounded-sm bg-[#0e1630]/90 border border-purple-500/40 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-2.5">
              <div>
                <div className="text-[9px] font-orbitron text-cyan-400 uppercase tracking-wider">
                  ACTIVE TURRET LOCK
                </div>
                <div className="text-sm font-bold font-orbitron text-white flex items-center gap-1.5">
                  <span>{selectedTower.def.name}</span>
                  <span className="px-1.5 py-0.2 bg-purple-900/80 text-purple-200 text-[9px] rounded border border-purple-400">
                    TIER {selectedTower.level}
                  </span>
                </div>
              </div>
              <button
                onClick={onDeselectTower}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                title="Deselect Turret [ESC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Targeting Algorithm Selector */}
            <div className="mb-2.5">
              <div className="text-[10px] font-orbitron text-slate-400 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>TARGETING ALGORITHM</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-orbitron">
                {targetingModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onSetTargetingMode(selectedTower, mode.id)}
                    className={`px-1.5 py-1 rounded text-center cursor-pointer transition-all ${
                      selectedTower.targetingMode === mode.id
                        ? 'bg-cyan-500 text-black font-bold shadow'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Combat Telemetry */}
            <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80 mb-2.5 text-[10px] font-mono-code grid grid-cols-2 gap-y-1 gap-x-2">
              <div className="text-slate-400">DAMAGE:</div>
              <div className="text-right text-cyan-300 font-bold">{Math.round(selectedTower.damage)}</div>

              <div className="text-slate-400">RANGE:</div>
              <div className="text-right text-purple-300 font-bold">{selectedTower.range} px</div>

              <div className="text-slate-400">RATE:</div>
              <div className="text-right text-slate-200">{selectedTower.fireRate.toFixed(1)}/s</div>

              <div className="text-slate-400">DPS:</div>
              <div className="text-right text-amber-400 font-bold">
                {(selectedTower.damage * selectedTower.fireRate).toFixed(0)}
              </div>

              <div className="text-slate-400 border-t border-slate-800/60 pt-1">KILLS:</div>
              <div className="text-right text-pink-400 font-bold border-t border-slate-800/60 pt-1">
                {selectedTower.kills}
              </div>

              <div className="text-slate-400">TOTAL DMG:</div>
              <div className="text-right text-slate-300">
                {Math.round(selectedTower.totalDamage).toLocaleString()}
              </div>
            </div>

            {/* Actions: Upgrade & Sell */}
            <div className="flex flex-col gap-1.5">
              {canUpgrade ? (
                <button
                  onClick={() => onUpgradeTower(selectedTower)}
                  disabled={!canAffordUpgrade}
                  className={`cyber-btn w-full py-1.5 px-2.5 rounded-sm flex items-center justify-between text-xs cursor-pointer ${
                    canAffordUpgrade
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-black border border-amber-400'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-[10px]">
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>UPGRADE TIER {selectedTower.level + 1}</span>
                  </div>
                  <span className="font-mono-code font-black text-[11px]">{upgradeCost}⚡</span>
                </button>
              ) : (
                <div className="w-full py-1 text-center text-[10px] font-orbitron text-amber-400 bg-amber-950/40 border border-amber-500/40 rounded-sm">
                  ★ MAXIMUM TIER LEVEL REACHED ★
                </div>
              )}

              <button
                onClick={() => onSellTower(selectedTower)}
                className="w-full py-1 px-2.5 rounded-sm flex items-center justify-between text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-500/40 cursor-pointer font-orbitron"
              >
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>DECOMMISSION</span>
                </div>
                <span className="font-mono-code font-bold text-red-300">+{sellValue}⚡</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Selection Placeholder */
          <div className="p-3 rounded-sm bg-slate-950/50 border border-purple-500/20 text-center">
            <div className="text-[10px] font-orbitron text-slate-400 uppercase mb-1">
              COMMAND SELECTION
            </div>
            <p className="text-xs text-slate-500 font-rajdhani">
              Click any placed turret on the battlefield to inspect stats, upgrade tiers, change targeting algorithm, or sell for refund.
            </p>
          </div>
        )}

        {/* SECTION 2: ENEMY WAVE INFORMATION */}
        <div className="p-3 rounded-sm bg-[#0e1630]/90 border border-purple-500/30">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-orbitron text-[11px] text-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
              <span>WAVE INTEL (50 WAVES)</span>
            </div>
            <span className="text-[10px] font-mono-code text-pink-400">
              WAVE {gameState ? gameState.currentWave : 1}/50
            </span>
          </div>

          {/* Countdown & Call Early */}
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 mb-2 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-orbitron text-slate-400">NEXT WAVE TIMER</div>
              <div className="text-base font-bold font-orbitron text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {gameState && gameState.waveState === 'idle'
                    ? `${gameState.waveTimer}s`
                    : 'IN ACTION'}
                </span>
              </div>
            </div>

            {gameState && gameState.waveState === 'idle' && (
              <button
                onClick={onCallWaveEarly}
                className="cyber-btn px-2.5 py-1 text-[10px] bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-black font-bold rounded cursor-pointer border border-amber-400"
              >
                CALL EARLY (+25⚡)
              </button>
            )}
          </div>

          {/* Threat Profile Roster */}
          <div className="space-y-1 text-[10px] font-rajdhani">
            <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-pink-400 font-bold">Void Scout:</span>
              <span className="text-slate-400">Fast, High Density Swarm</span>
            </div>
            <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-purple-400 font-bold">Chrono Brute:</span>
              <span className="text-slate-400">Heavy Armor Mech (Takes -8 dmg)</span>
            </div>
            <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold">Phase Shifter:</span>
              <span className="text-slate-400">Periodic Stealth Cloaking</span>
            </div>
            <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-emerald-400 font-bold">Nano Regenerator:</span>
              <span className="text-slate-400">Heals Self & Adjacent Allies</span>
            </div>
            <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-amber-400 font-bold">EMP Disruptor:</span>
              <span className="text-slate-400">Disables Defense Turrets</span>
            </div>
            <div className="flex items-center justify-between p-1 rounded bg-red-950/40 border border-red-500/30">
              <span className="text-red-400 font-bold">Boss Leviathan:</span>
              <span className="text-red-300">Appears every 10 Waves (W10-50)</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: TACTICAL COMMAND GUIDE */}
        <div className="p-2.5 rounded-sm bg-slate-950/60 border border-purple-500/20 text-[10px] font-mono-code text-slate-400 space-y-1">
          <div className="flex items-center gap-1 text-slate-300 font-orbitron text-[10px] mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>TACTICAL SHORTCUTS</span>
          </div>
          <div className="flex justify-between">
            <span>[1-5]: Select Tower</span>
            <span>[ESC]: Cancel/Deselect</span>
          </div>
          <div className="flex justify-between">
            <span>[SPACE]: Pause/Resume</span>
            <span>[U]: Upgrade Selected</span>
          </div>
          <div className="flex justify-between">
            <span>[S]: Sell Selected</span>
            <span>[B]: Benchmark Mode</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
