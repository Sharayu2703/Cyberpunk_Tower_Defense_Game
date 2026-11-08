import { PATH_DATA_A, PATH_DATA_B } from '../map/MapConfig.js';

export const ENEMY_TYPES = {
  scout: {
    name: 'Void Scout',
    color: '#ec4899', // Plasma pink
    secondaryColor: '#f43f5e',
    radius: 7,
    baseSpeed: 105, // pixels per sec
    baseHp: 65,
    armor: 0,
    reward: 12,
    score: 50,
    description: 'Fast, swarming recon drone with light shields.',
  },
  brute: {
    name: 'Chrono Brute',
    color: '#8b5cf6', // Violet
    secondaryColor: '#6366f1',
    radius: 12,
    baseSpeed: 52,
    baseHp: 420,
    armor: 8, // Flat damage reduction
    reward: 35,
    score: 160,
    description: 'Heavy armored bipedal mech. Highly resistant to rapid light fire.',
  },
  phase_shifter: {
    name: 'Phase Shifter',
    color: '#06b6d4', // Cyan
    secondaryColor: '#38bdf8',
    radius: 9,
    baseSpeed: 85,
    baseHp: 160,
    armor: 2,
    reward: 25,
    score: 110,
    description: 'Periodically cloaks into phase space, evading targeting and slowing effects.',
  },
  regenerator: {
    name: 'Nano Regenerator',
    color: '#10b981', // Emerald
    secondaryColor: '#34d399',
    radius: 10,
    baseSpeed: 65,
    baseHp: 280,
    armor: 4,
    reward: 30,
    score: 140,
    description: 'Emits nano-repair waves, restoring health to itself and adjacent entities.',
  },
  emp_disruptor: {
    name: 'EMP Disruptor',
    color: '#f59e0b', // Amber
    secondaryColor: '#fbbf24',
    radius: 11,
    baseSpeed: 60,
    baseHp: 340,
    armor: 5,
    reward: 40,
    score: 180,
    description: 'Releases electromagnetic bursts that temporarily disable nearby defense turrets.',
  },
  leviathan: {
    name: 'Void Leviathan (BOSS)',
    color: '#ef4444', // Crimson / Gold
    secondaryColor: '#fbbf24',
    radius: 20,
    baseSpeed: 38,
    baseHp: 3800,
    armor: 15,
    reward: 250,
    score: 1200,
    isBoss: true,
    description: 'Colossal Void Sovereign flagship equipped with kinetic dampeners.',
  },
};

export class Enemy {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.id = 0;
    this.type = 'scout';
    this.x = 0;
    this.y = 0;
    this.radius = 8;
    this.speed = 100;
    this.baseSpeed = 100;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;
    this.maxShield = 0;
    this.armor = 0;
    this.reward = 10;
    this.score = 50;
    this.isBoss = false;

    // Path tracking
    this.lane = 'alpha';
    this.pathData = PATH_DATA_A;
    this.distanceTraveled = 0;
    this.totalDistance = PATH_DATA_A.totalLength;
    this.segmentIndex = 0;
    this.reachedEnd = false;
    this.dead = false;

    // Status effects
    this.slowTimer = 0;
    this.slowMultiplier = 1.0;
    this.stunTimer = 0;
    
    // Ability cooldowns
    this.phaseCooldown = 3.5;
    this.phaseDuration = 0;
    this.isPhased = false;

    this.healCooldown = 2.0;
    this.empCooldown = 5.0;

    // Spatial hash grid cache
    this._gridKey = undefined;
    this._poolIndex = -1;
  }

  init(id, typeKey, lane = 'alpha', hpMultiplier = 1.0, speedMultiplier = 1.0) {
    this.reset();
    this.id = id;
    this.type = typeKey;
    const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.scout;

    this.lane = lane;
    this.pathData = lane === 'beta' ? PATH_DATA_B : PATH_DATA_A;
    this.totalDistance = this.pathData.totalLength;

    this.radius = def.radius;
    this.baseSpeed = def.baseSpeed * speedMultiplier;
    this.speed = this.baseSpeed;
    this.maxHp = Math.round(def.baseHp * hpMultiplier);
    this.hp = this.maxHp;
    this.armor = def.armor;
    this.reward = Math.round(def.reward * (1 + (hpMultiplier - 1) * 0.2));
    this.score = def.score;
    this.isBoss = !!def.isBoss;

    if (this.isBoss) {
      this.maxShield = Math.round(this.maxHp * 0.4);
      this.shield = this.maxShield;
    }

    // Set initial position to first waypoint
    const startPoint = this.pathData.waypoints[0];
    this.x = startPoint.x;
    this.y = startPoint.y;
    this.distanceTraveled = 0;
    this.segmentIndex = 0;
    this.active = true;
    this.dead = false;
    this.reachedEnd = false;
  }

  update(dt, spatialGrid, gameEngine) {
    if (!this.active || this.dead) return;

    // Handle stun
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    // Handle slow decay
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1.0;
      }
    }

    // Special Ability: Phase Shifter Cloak
    if (this.type === 'phase_shifter') {
      if (this.isPhased) {
        this.phaseDuration -= dt;
        if (this.phaseDuration <= 0) {
          this.isPhased = false;
          this.phaseCooldown = 4.0;
        }
      } else {
        this.phaseCooldown -= dt;
        if (this.phaseCooldown <= 0) {
          this.isPhased = true;
          this.phaseDuration = 1.3;
          this.slowMultiplier = 1.3; // Speed boost while phased!
        }
      }
    }

    // Special Ability: Nano Regenerator Pulse
    if (this.type === 'regenerator') {
      this.healCooldown -= dt;
      if (this.healCooldown <= 0) {
        this.healCooldown = 1.8;
        // Self-heal
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.05);
        // AoE Heal nearby allies using spatial grid
        const allies = spatialGrid.queryRadius(this.x, this.y, 110);
        for (let i = 0; i < allies.length; i++) {
          const ally = allies[i];
          if (ally !== this && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.06);
          }
        }
      }
    }

    // Special Ability: EMP Disruptor
    if (this.type === 'emp_disruptor' && gameEngine) {
      this.empCooldown -= dt;
      if (this.empCooldown <= 0) {
        this.empCooldown = 6.0;
        // Stun nearby towers
        gameEngine.triggerEmpBurst(this.x, this.y, 130, 2.2);
      }
    }

    // Move along precalculated path
    const effectiveSpeed = this.baseSpeed * this.slowMultiplier;
    this.distanceTraveled += effectiveSpeed * dt;

    if (this.distanceTraveled >= this.totalDistance) {
      this.distanceTraveled = this.totalDistance;
      this.reachedEnd = true;
      return;
    }

    // Interpolate waypoint position
    const segments = this.pathData.segments;
    while (this.segmentIndex < segments.length - 1 && this.distanceTraveled > segments[this.segmentIndex].endDist) {
      this.segmentIndex++;
    }

    const seg = segments[this.segmentIndex];
    if (seg) {
      const segProgress = (this.distanceTraveled - seg.startDist) / seg.length;
      this.x = seg.p1.x + seg.dx * segProgress;
      this.y = seg.p1.y + seg.dy * segProgress;
    }

    // Update in spatial partitioning grid
    spatialGrid.update(this);
  }

  takeDamage(amount, isArmorPiercing = false) {
    if (this.isPhased) return 0; // Invulnerable while phased

    let finalDamage = amount;
    if (!isArmorPiercing && this.armor > 0) {
      // Armor reduces damage, minimum 1 damage
      finalDamage = Math.max(1, amount - this.armor);
    }

    // Deplete shield first if present
    if (this.shield > 0) {
      if (this.shield >= finalDamage) {
        this.shield -= finalDamage;
        return finalDamage;
      } else {
        const remaining = finalDamage - this.shield;
        this.shield = 0;
        finalDamage = remaining;
      }
    }

    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }

    return finalDamage;
  }

  applySlow(multiplier, duration) {
    if (this.isPhased) return;
    // Don't override with weaker slow
    if (multiplier < this.slowMultiplier || this.slowTimer <= 0) {
      this.slowMultiplier = Math.max(0.25, multiplier);
      this.slowTimer = duration;
    }
  }

  applyStun(duration) {
    if (this.isPhased) return;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }
}
