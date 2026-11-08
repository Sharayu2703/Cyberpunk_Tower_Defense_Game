export const TOWER_TYPES = {
  pulse_tower: {
    id: 'pulse_tower',
    name: 'Pulse Tower',
    role: 'Rapid Single-Target',
    color: '#25b8ff', // Electric Blue
    accentColor: '#38bdf8',
    cost: 100,
    range: 135,
    damage: 18,
    fireRate: 5.5, // shots per sec
    projectileSpeed: 680,
    projectileType: 'laser',
    description: 'High-frequency directed particle beam. Melts through fast hostile swarms.',
    upgrades: [
      { cost: 95, damage: 28, fireRate: 6.5, range: 150, name: 'Dual Capacitor Core' },
      { cost: 185, damage: 52, fireRate: 8.0, range: 170, name: 'Quantum Overcharge Matrix' },
    ],
  },
  frost_tower: {
    id: 'frost_tower',
    name: 'Frost Tower',
    role: 'Field Crowd Control',
    color: '#38bdf8', // Subtle Cyan / Ice Blue
    accentColor: '#7dd3fc',
    cost: 135,
    range: 130,
    damage: 14,
    fireRate: 2.2,
    slowMultiplier: 0.5,
    slowDuration: 2.5,
    splashRadius: 50,
    projectileSpeed: 460,
    projectileType: 'cryo',
    description: 'Emits cryogenic deceleration pulses, slowing hostile advance speeds by 50%.',
    upgrades: [
      { cost: 115, damage: 25, slowMultiplier: 0.38, slowDuration: 3.2, range: 150, name: 'Sub-Zero Resonance' },
      { cost: 215, damage: 48, slowMultiplier: 0.25, slowDuration: 4.0, range: 170, name: 'Absolute Zero Vortex' },
    ],
  },
  mortar_tower: {
    id: 'mortar_tower',
    name: 'Mortar Tower',
    role: 'Heavy AoE Artillery',
    color: '#f59e0b', // Cyber Amber / Orange
    accentColor: '#fbbf24',
    cost: 160,
    range: 195,
    damage: 80,
    fireRate: 0.85,
    splashRadius: 70,
    projectileSpeed: 290,
    projectileType: 'mortar',
    description: 'Long-range explosive ordnance that obliterates clusters with shockwave splash.',
    upgrades: [
      { cost: 145, damage: 145, splashRadius: 85, range: 220, fireRate: 0.95, name: 'Thermobaric Warhead' },
      { cost: 275, damage: 260, splashRadius: 110, range: 245, fireRate: 1.1, name: 'Supernova Singularity' },
    ],
  },
  tesla_tower: {
    id: 'tesla_tower',
    name: 'Tesla Tower',
    role: 'Chain Lightning',
    color: '#a855f7', // Neon Violet
    accentColor: '#c084fc',
    cost: 190,
    range: 155,
    damage: 40,
    fireRate: 1.4,
    chainCount: 4,
    chainRadius: 95,
    projectileType: 'tesla',
    description: 'Arcs high-voltage discharge recursively jumping between up to 4 hostiles.',
    upgrades: [
      { cost: 165, damage: 68, chainCount: 6, chainRadius: 115, range: 175, name: 'Cascade Ionizer' },
      { cost: 295, damage: 125, chainCount: 8, chainRadius: 140, range: 195, name: 'Plasma Storm Overdrive' },
    ],
  },
  railgun_tower: {
    id: 'railgun_tower',
    name: 'Railgun Tower',
    role: 'Piercing Kinetic Obliterator',
    color: '#ec4899', // Plasma Pink
    accentColor: '#f43f5e',
    cost: 260,
    range: 260,
    damage: 190,
    fireRate: 0.5,
    isArmorPiercing: true,
    projectileType: 'railgun',
    description: 'Hyper-velocity magnetic slug piercing completely through an entire line of hostiles.',
    upgrades: [
      { cost: 225, damage: 340, range: 295, fireRate: 0.6, name: 'Magnetic Super-Coil' },
      { cost: 395, damage: 650, range: 335, fireRate: 0.75, name: 'Antimatter Kinetic Accelerator' },
    ],
  },
};

// Aliases for backward compatibility
TOWER_TYPES.pulse_laser = TOWER_TYPES.pulse_tower;
TOWER_TYPES.cryo_disrupter = TOWER_TYPES.frost_tower;
TOWER_TYPES.plasma_mortar = TOWER_TYPES.mortar_tower;
TOWER_TYPES.tesla_arc = TOWER_TYPES.tesla_tower;
TOWER_TYPES.void_railgun = TOWER_TYPES.railgun_tower;

export class Tower {
  constructor(id, typeKey, gridX, gridY, worldX, worldY) {
    this.id = id;
    this.type = typeKey;
    this.def = TOWER_TYPES[typeKey] || TOWER_TYPES.pulse_tower;
    
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = worldX;
    this.y = worldY;
    this.radius = 18;

    this.level = 1;
    this.totalInvested = this.def.cost;
    this.targetingMode = 'first'; // 'first' | 'last' | 'strongest' | 'weakest' | 'closest'

    // Computed combat stats
    this.range = this.def.range;
    this.damage = this.def.damage;
    this.fireRate = this.def.fireRate;
    this.cooldown = 0;
    this.fireInterval = 1 / this.fireRate;

    // Type specific mechanics
    this.splashRadius = this.def.splashRadius || 0;
    this.slowMultiplier = this.def.slowMultiplier || 1.0;
    this.slowDuration = this.def.slowDuration || 0;
    this.chainCount = this.def.chainCount || 1;
    this.chainRadius = this.def.chainRadius || 0;
    this.isArmorPiercing = !!this.def.isArmorPiercing;

    // Visual & State
    this.rotation = 0;
    this.target = null;
    this.targetX = worldX + 1;
    this.targetY = worldY;
    this.stunTimer = 0; // EMP stun
    this.recoil = 0;

    // Telemetry
    this.kills = 0;
    this.totalDamage = 0;
    this.shotsFired = 0;
  }

  canUpgrade() {
    return this.level < 3;
  }

  getUpgradeCost() {
    if (!this.canUpgrade()) return 0;
    return this.def.upgrades[this.level - 1].cost;
  }

  getUpgradeInfo() {
    if (!this.canUpgrade()) return null;
    return this.def.upgrades[this.level - 1];
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    const upgradeData = this.def.upgrades[this.level - 1];
    this.totalInvested += upgradeData.cost;
    this.level++;

    this.damage = upgradeData.damage;
    if (upgradeData.range) this.range = upgradeData.range;
    if (upgradeData.fireRate) {
      this.fireRate = upgradeData.fireRate;
      this.fireInterval = 1 / this.fireRate;
    }
    if (upgradeData.splashRadius) this.splashRadius = upgradeData.splashRadius;
    if (upgradeData.slowMultiplier) this.slowMultiplier = upgradeData.slowMultiplier;
    if (upgradeData.slowDuration) this.slowDuration = upgradeData.slowDuration;
    if (upgradeData.chainCount) this.chainCount = upgradeData.chainCount;
    if (upgradeData.chainRadius) this.chainRadius = upgradeData.chainRadius;

    return true;
  }

  getSellValue() {
    return Math.floor(this.totalInvested * 0.75);
  }

  setTargetingMode(mode) {
    this.targetingMode = mode;
  }

  stun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  update(dt, spatialGrid, gameEngine, naiveMode = false) {
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 4);
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // Select target
    this.target = this.findTarget(spatialGrid, gameEngine, naiveMode);

    if (this.target) {
      // Rotate toward target
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.rotation = Math.atan2(dy, dx);
      this.targetX = this.target.x;
      this.targetY = this.target.y;

      // Fire when cooldown ready
      if (this.cooldown <= 0) {
        this.fire(gameEngine);
        this.cooldown = this.fireInterval;
        this.recoil = 1.0;
      }
    }
  }

  findTarget(spatialGrid, gameEngine, naiveMode = false) {
    let candidates;

    if (naiveMode) {
      candidates = [];
      const all = gameEngine.activeEnemies;
      const r2 = this.range * this.range;
      for (let i = 0; i < all.length; i++) {
        const e = all[i];
        if (!e.active || e.dead || e.isPhased) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (dx * dx + dy * dy <= r2) {
          candidates.push(e);
        }
      }
    } else {
      candidates = spatialGrid.queryRadius(this.x, this.y, this.range);
    }

    if (candidates.length === 0) return null;

    let best = null;

    switch (this.targetingMode) {
      case 'first': {
        let maxDist = -1;
        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (e.isPhased) continue;
          if (e.distanceTraveled > maxDist) {
            maxDist = e.distanceTraveled;
            best = e;
          }
        }
        break;
      }
      case 'last': {
        let minDist = 9999999;
        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (e.isPhased) continue;
          if (e.distanceTraveled < minDist) {
            minDist = e.distanceTraveled;
            best = e;
          }
        }
        break;
      }
      case 'strongest': {
        let maxHp = -1;
        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (e.isPhased) continue;
          if (e.hp > maxHp) {
            maxHp = e.hp;
            best = e;
          }
        }
        break;
      }
      case 'weakest': {
        let minHp = 9999999;
        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (e.isPhased) continue;
          if (e.hp < minHp) {
            minHp = e.hp;
            best = e;
          }
        }
        break;
      }
      case 'closest':
      default: {
        let minDistSq = 9999999;
        for (let i = 0; i < candidates.length; i++) {
          const e = candidates[i];
          if (e.isPhased) continue;
          const dx = e.x - this.x;
          const dy = e.y - this.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < minDistSq) {
            minDistSq = d2;
            best = e;
          }
        }
        break;
      }
    }

    return best;
  }

  fire(gameEngine) {
    this.shotsFired++;
    gameEngine.spawnProjectile(this, this.target);
  }
}
