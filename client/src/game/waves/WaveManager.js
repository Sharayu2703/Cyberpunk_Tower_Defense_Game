/**
 * WaveManager - 50 Balanced Hand-Crafted & Procedurally Escalating Waves
 * Provides strategic variety, boss checkpoints, and scalable threat profiles.
 */

export function generateWaveDefinition(waveNum) {
  // Waves 1 to 50
  const isBossWave = waveNum % 10 === 0;
  const isMiniBoss = waveNum % 5 === 0 && !isBossWave;
  
  // Exponential / polynomial scaling factors
  const hpMultiplier = Math.pow(1.085, waveNum - 1) * (1 + waveNum * 0.035);
  const speedMultiplier = Math.min(1.4, 1.0 + (waveNum - 1) * 0.007);
  const countMultiplier = 1 + Math.floor(waveNum * 0.35);

  const spawns = [];

  if (isBossWave) {
    // Wave 10, 20, 30, 40, 50
    const bossCount = waveNum === 50 ? 3 : waveNum >= 30 ? 2 : 1;
    for (let b = 0; b < bossCount; b++) {
      spawns.push({
        type: 'leviathan',
        count: 1,
        interval: 3.5,
        lane: b % 2 === 0 ? 'alpha' : 'beta',
        hpMultiplier: hpMultiplier * 1.5,
        speedMultiplier: speedMultiplier * 0.9,
      });
    }

    // Escort units
    spawns.push({
      type: 'brute',
      count: 4 + Math.floor(waveNum * 0.3),
      interval: 0.9,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'regenerator',
      count: 2 + Math.floor(waveNum * 0.2),
      interval: 1.4,
      lane: 'beta',
      hpMultiplier,
      speedMultiplier,
    });
    if (waveNum >= 30) {
      spawns.push({
        type: 'emp_disruptor',
        count: 3 + Math.floor(waveNum * 0.15),
        interval: 1.6,
        lane: 'alpha',
        hpMultiplier,
        speedMultiplier,
      });
    }
  } else if (waveNum <= 5) {
    // Early waves: Scouts introduction
    const scoutCount = 8 + waveNum * 4;
    spawns.push({
      type: 'scout',
      count: scoutCount,
      interval: Math.max(0.35, 0.8 - waveNum * 0.08),
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    if (waveNum >= 3) {
      spawns.push({
        type: 'scout',
        count: 6 + waveNum * 2,
        interval: 0.6,
        lane: 'beta',
        hpMultiplier,
        speedMultiplier,
      });
    }
  } else if (waveNum <= 15) {
    // Introduction of Brutes and Phase Shifters
    spawns.push({
      type: 'scout',
      count: 14 + countMultiplier * 2,
      interval: 0.45,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'brute',
      count: 4 + Math.floor(waveNum * 0.6),
      interval: 1.2,
      lane: 'beta',
      hpMultiplier,
      speedMultiplier,
    });
    if (waveNum >= 11) {
      spawns.push({
        type: 'phase_shifter',
        count: 6 + Math.floor(waveNum * 0.4),
        interval: 0.8,
        lane: 'alpha',
        hpMultiplier,
        speedMultiplier,
      });
    }
  } else if (waveNum <= 25) {
    // Introduction of Nano Regenerators & EMP Disruptors
    spawns.push({
      type: 'phase_shifter',
      count: 10 + countMultiplier,
      interval: 0.5,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'regenerator',
      count: 4 + Math.floor(waveNum * 0.3),
      interval: 1.1,
      lane: 'beta',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'brute',
      count: 8 + countMultiplier,
      interval: 0.9,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    if (waveNum >= 21) {
      spawns.push({
        type: 'emp_disruptor',
        count: 4 + Math.floor(waveNum * 0.2),
        interval: 1.5,
        lane: 'beta',
        hpMultiplier,
        speedMultiplier,
      });
    }
  } else {
    // Late-game Waves 26 to 50: Intense mixed armada
    spawns.push({
      type: 'scout',
      count: 25 + countMultiplier * 3,
      interval: 0.25,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'brute',
      count: 10 + countMultiplier,
      interval: 0.7,
      lane: 'beta',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'phase_shifter',
      count: 12 + countMultiplier,
      interval: 0.45,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'regenerator',
      count: 6 + Math.floor(waveNum * 0.25),
      interval: 1.0,
      lane: 'beta',
      hpMultiplier,
      speedMultiplier,
    });
    spawns.push({
      type: 'emp_disruptor',
      count: 6 + Math.floor(waveNum * 0.2),
      interval: 1.2,
      lane: 'alpha',
      hpMultiplier,
      speedMultiplier,
    });
  }

  // Calculate total enemy count in wave
  let totalEnemies = 0;
  for (const s of spawns) {
    totalEnemies += s.count;
  }

  return {
    waveNumber: waveNum,
    isBossWave,
    isMiniBoss,
    title: isBossWave ? `BOSS ENCOUNTER: WAVE ${waveNum}` : `INCURSION WAVE ${waveNum}`,
    rewardBonus: 50 + waveNum * 15,
    spawns,
    totalEnemies,
  };
}

export class WaveManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentWave = 1;
    this.maxWaves = 50;
    this.waveState = 'idle'; // 'idle' | 'spawning' | 'active' | 'completed' | 'victory'
    this.waveTimer = 8.0; // Countdown between waves
    this.waveData = null;

    // Spawning queue
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.enemiesRemainingToSpawn = 0;
  }

  startWave(waveNum = this.currentWave) {
    this.currentWave = waveNum;
    this.waveData = generateWaveDefinition(waveNum);
    this.spawnQueue.length = 0;

    // Flatten spawns into interleaved event queue
    for (const group of this.waveData.spawns) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          lane: group.lane,
          hpMultiplier: group.hpMultiplier,
          speedMultiplier: group.speedMultiplier,
          delay: i * group.interval,
        });
      }
    }

    // Sort by scheduled delay
    this.spawnQueue.sort((a, b) => a.delay - b.delay);
    this.enemiesRemainingToSpawn = this.spawnQueue.length;
    this.spawnTimer = 0;
    this.waveState = 'spawning';
  }

  callWaveEarly() {
    if (this.waveState === 'idle') {
      // Early wave energy bonus!
      const bonus = Math.floor(this.waveTimer * 5) + 20;
      this.gameEngine.addEnergy(bonus);
      this.gameEngine.spawnFloatingText(700, 350, `EARLY CALL: +${bonus} ENERGY!`, '#22d3ee', 1.2);
      this.waveTimer = 0;
      this.startWave(this.currentWave);
    }
  }

  update(dt) {
    if (this.waveState === 'idle') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.startWave(this.currentWave);
      }
      return;
    }

    if (this.waveState === 'spawning') {
      this.spawnTimer += dt;

      while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= this.spawnTimer) {
        const item = this.spawnQueue.shift();
        this.gameEngine.spawnEnemy(item.type, item.lane, item.hpMultiplier, item.speedMultiplier);
        this.enemiesRemainingToSpawn = this.spawnQueue.length;
      }

      if (this.spawnQueue.length === 0) {
        this.waveState = 'active';
      }
    }

    if (this.waveState === 'active') {
      // Check if all enemies in wave are defeated
      if (this.gameEngine.activeEnemies.length === 0 && this.spawnQueue.length === 0) {
        this.handleWaveClear();
      }
    }
  }

  handleWaveClear() {
    this.gameEngine.handleWaveCompleted(this.currentWave, this.waveData.rewardBonus);

    if (this.currentWave >= this.maxWaves) {
      this.waveState = 'victory';
      this.gameEngine.triggerVictory();
    } else {
      this.waveState = 'idle';
      this.currentWave++;
      this.waveTimer = 10.0; // 10 second breather between waves
    }
  }

  reset() {
    this.currentWave = 1;
    this.waveState = 'idle';
    this.waveTimer = 5.0;
    this.spawnQueue.length = 0;
    this.enemiesRemainingToSpawn = 0;
    this.waveData = null;
  }
}
