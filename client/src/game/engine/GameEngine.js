import { SpatialHashGrid } from './SpatialHashGrid.js';
import { ObjectPool } from './ObjectPool.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { Renderer } from './Renderer.js';
import { Enemy, ENEMY_TYPES } from '../entities/Enemy.js';
import { Tower, TOWER_TYPES } from '../entities/Tower.js';
import { Projectile } from '../entities/Projectile.js';
import { Particle, FloatingText } from '../entities/Particle.js';
import { WaveManager } from '../waves/WaveManager.js';
import { MAP_WIDTH, MAP_HEIGHT, CELL_SIZE, COLS, ROWS, generateGridMap, BASE_CORE } from '../map/MapConfig.js';
import { audio } from '../../components/AudioController.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.perfMonitor = new PerformanceMonitor();

    // Map & Placement Grid
    this.gridMap = generateGridMap();
    this.towerGrid = new Array(COLS * ROWS).fill(null);
    this.towerDefs = TOWER_TYPES;

    // Fixed timestep accumulator for cross-display refresh rate consistency
    this.fixedDelta = 1 / 60; // 60Hz physics tick
    this.accumulator = 0;
    this.lastFrameTime = performance.now();
    this.gameSpeed = 1; // 1x, 2x, 3x (strictly per requirement)
    this.isPaused = false;
    this.isGameStarted = true; // Started state
    this.isGameOver = false;
    this.isVictory = false;
    this.isRunning = false;
    this.rafId = null;

    // Game Economy & Core Stats
    this.maxBaseHealth = 100;
    this.baseHealth = 100;
    this.credits = 450; // Primary currency term
    this.energy = 450;  // Alias for backward compatibility
    this.score = 0;
    this.enemiesKilled = 0;
    this.towersBuiltCount = 0;

    // Real-time Combat Event Feed / Log Buffer
    this.combatLog = [
      { id: 1, time: '00:00', text: 'OUTPOST DEFENSE PROTOCOL ONLINE. ALL DEFENSE SYSTEMS STANDING BY.', type: 'system' },
      { id: 2, time: '00:00', text: 'DEPLOY TURRETS TO COVER ALPHA & BETA INGRESS LANES.', type: 'info' },
    ];
    this.logIdCounter = 3;

    // Spatial Partitioning Grid (Cell Size = 64px)
    this.spatialGrid = new SpatialHashGrid(64, MAP_WIDTH, MAP_HEIGHT);

    // ZERO-ALLOCATION Object Pools
    this.enemyPool = new ObjectPool(() => new Enemy(), 6000);
    this.projectilePool = new ObjectPool(() => new Projectile(), 2000);
    this.particlePool = new ObjectPool(() => new Particle(), 3000);
    this.textPool = new ObjectPool(() => new FloatingText(), 500);

    // Active Entity Arrays (Dense lists for fast iteration)
    this.activeEnemies = [];
    this.activeProjectiles = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.towers = [];
    this.instantBeams = []; // Visual lightning & railgun tracers

    // Wave Manager (50 Waves)
    this.waveManager = new WaveManager(this);

    // Selection & Placement
    this.selectedTower = null;
    this.placementMode = null; // towerType string or null
    this.placementPreview = { gridX: 0, gridY: 0, towerType: null, isValid: false };

    // Stress Test / Benchmark Mode
    this.isStressMode = false;
    this.naiveMode = false; // When true: uses O(N*M) naive distance loop for live before/after demonstration!
    this.enemyIdCounter = 1;

    // React state listener
    this.stateListeners = new Set();
    this.lastStateNotifyTime = 0;

    // Initial resize to support device pixel ratio
    this.handleResize();
  }

  handleResize() {
    this.renderer.resize();
  }

  logEvent(text, type = 'info') {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    this.combatLog.unshift({
      id: this.logIdCounter++,
      time: timeStr,
      text,
      type, // 'system' | 'kill' | 'wave' | 'build' | 'alert' | 'info'
    });
    if (this.combatLog.length > 40) {
      this.combatLog.pop();
    }
  }

  subscribe(listener) {
    this.stateListeners.add(listener);
    this.notifyState();
    return () => this.stateListeners.delete(listener);
  }

  notifyState() {
    const perf = this.perfMonitor.getSnapshot();
    const state = {
      baseHealth: this.baseHealth,
      maxBaseHealth: this.maxBaseHealth,
      credits: this.credits,
      energy: this.credits, // alias
      score: this.score,
      currentWave: this.waveManager.currentWave,
      maxWaves: this.waveManager.maxWaves,
      waveState: this.waveManager.waveState,
      waveTimer: Math.ceil(this.waveManager.waveTimer),
      enemiesRemaining: this.activeEnemies.length + this.waveManager.enemiesRemainingToSpawn,
      enemiesKilled: this.enemiesKilled,
      isPaused: this.isPaused,
      isGameStarted: this.isGameStarted,
      gameSpeed: this.gameSpeed,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      selectedTower: this.selectedTower,
      isStressMode: this.isStressMode,
      naiveMode: this.naiveMode,
      combatLog: [...this.combatLog],
      perf: {
        fps: perf.fps,
        avgFps: perf.avgFps,
        minFps: perf.minFps,
        p95FrameTime: perf.p95FrameTime,
        pctAbove33ms: perf.pctAbove33ms,
        memoryMB: perf.memoryMB,
        meets45FpsP95: perf.meets45FpsP95,
        meets33msRequirement: perf.meets33msRequirement,
        activeEnemiesCount: this.activeEnemies.length,
        activeTowersCount: this.towers.length,
        activeProjectilesCount: this.activeProjectiles.length,
        activeParticlesCount: this.activeParticles.length,
      },
    };

    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // --- MASTER SINGLE GAME LOOP ---
  loop(currentTime) {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.loop);

    // Frame Telemetry
    this.perfMonitor.recordFrame(currentTime);

    const delta = (currentTime - this.lastFrameTime) * 0.001;
    this.lastFrameTime = currentTime;

    // Prevent spiral of death on background tab resume
    const safeDelta = Math.min(0.2, delta);

    if (this.isGameStarted && !this.isPaused && !this.isGameOver && !this.isVictory) {
      this.accumulator += safeDelta * this.gameSpeed;

      // Fixed timestep sub-stepping for physics stability
      const maxSubSteps = 4;
      let subSteps = 0;
      while (this.accumulator >= this.fixedDelta && subSteps < maxSubSteps) {
        this.update(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
        subSteps++;
      }
    }

    // Render frame
    this.renderer.render(this);

    // Throttled notification to React UI (10 times per sec to prevent React overhead)
    if (currentTime - this.lastStateNotifyTime > 100) {
      this.lastStateNotifyTime = currentTime;
      this.notifyState();
    }
  }

  update(dt) {
    // 1. Update Wave Manager
    if (!this.isStressMode) {
      this.waveManager.update(dt);
    }

    // 2. Update Towers (Targeting & Firing)
    const towerLen = this.towers.length;
    for (let i = 0; i < towerLen; i++) {
      this.towers[i].update(dt, this.spatialGrid, this, this.naiveMode);
    }

    // 3. Update Enemies (Path movement & Spatial Grid update)
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      enemy.update(dt, this.spatialGrid, this);

      // Check if enemy reached Base Core
      if (enemy.reachedEnd) {
        this.handleEnemyReachedBase(enemy);
        this.spatialGrid.remove(enemy);
        this.enemyPool.release(enemy);
        this.activeEnemies.splice(i, 1);
        continue;
      }

      // Check if enemy was killed
      if (enemy.dead) {
        this.spatialGrid.remove(enemy);
        this.enemyPool.release(enemy);
        this.activeEnemies.splice(i, 1);
      }
    }

    // 4. Update Projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      proj.update(dt, this.spatialGrid, this);
      if (proj.dead) {
        this.projectilePool.release(proj);
        this.activeProjectiles.splice(i, 1);
      }
    }

    // 5. Update Particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const part = this.activeParticles[i];
      part.update(dt);
      if (part.dead) {
        this.particlePool.release(part);
        this.activeParticles.splice(i, 1);
      }
    }

    // 6. Update Floating Combat Texts
    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const text = this.activeFloatingTexts[i];
      text.update(dt);
      if (text.dead) {
        this.textPool.release(text);
        this.activeFloatingTexts.splice(i, 1);
      }
    }
  }

  // --- ENTITY SPAWNERS & POOLING ---

  spawnEnemy(typeKey, lane = 'alpha', hpMult = 1.0, speedMult = 1.0) {
    const enemy = this.enemyPool.acquire();
    enemy.init(this.enemyIdCounter++, typeKey, lane, hpMult, speedMult);
    this.spatialGrid.insert(enemy);
    this.activeEnemies.push(enemy);
    return enemy;
  }

  spawnProjectile(tower, targetEnemy) {
    if (tower.type === 'railgun_tower' || tower.type === 'void_railgun') {
      this.fireRailgunBeam(tower);
      audio.playRailgun();
      return;
    }

    if (tower.type === 'tesla_tower' || tower.type === 'tesla_arc') {
      this.fireTeslaChain(tower, targetEnemy);
      audio.playTeslaArc();
      return;
    }

    // Normal projectile (Pulse, Mortar, Frost)
    const proj = this.projectilePool.acquire();
    proj.init(tower, targetEnemy);
    this.activeProjectiles.push(proj);

    // Audio SFX
    if (tower.type === 'pulse_tower' || tower.type === 'pulse_laser') audio.playLaser();
    else if (tower.type === 'mortar_tower' || tower.type === 'plasma_mortar') audio.playPlasmaMortar();
    else if (tower.type === 'frost_tower' || tower.type === 'cryo_disrupter') audio.playCryoPulse();
  }

  fireRailgunBeam(tower) {
    const angle = tower.rotation;
    const range = tower.range;
    const endX = tower.x + Math.cos(angle) * range;
    const endY = tower.y + Math.sin(angle) * range;

    this.instantBeams.push({
      type: 'railgun',
      x1: tower.x,
      y1: tower.y,
      x2: endX,
      y2: endY,
      life: 0.18,
      maxLife: 0.18,
    });

    const minX = Math.min(tower.x, endX) - 20;
    const maxX = Math.max(tower.x, endX) + 20;
    const minY = Math.min(tower.y, endY) - 20;
    const maxY = Math.max(tower.y, endY) + 20;

    const candidates = this.spatialGrid.queryBox(minX, minY, maxX, maxY);
    const lineLenSq = (endX - tower.x) ** 2 + (endY - tower.y) ** 2;

    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      if (!e.active || e.dead) continue;

      const t = Math.max(0, Math.min(1, ((e.x - tower.x) * (endX - tower.x) + (e.y - tower.y) * (endY - tower.y)) / lineLenSq));
      const projX = tower.x + t * (endX - tower.x);
      const projY = tower.y + t * (endY - tower.y);
      const distSq = (e.x - projX) ** 2 + (e.y - projY) ** 2;

      if (distSq <= (e.radius + 14) ** 2) {
        const dmg = e.takeDamage(tower.damage, true);
        tower.totalDamage += dmg;
        this.spawnFloatingText(e.x, e.y - 12, `CRIT -${Math.round(dmg)}`, '#f43f5e', 0.9);
        this.spawnSparks(e.x, e.y, '#f43f5e', 6);

        if (e.dead) {
          tower.kills++;
          this.handleEnemyKilled(e);
        }
      }
    }
  }

  fireTeslaChain(tower, primaryTarget) {
    if (!primaryTarget || !primaryTarget.active || primaryTarget.dead) return;

    let current = primaryTarget;
    let prevX = tower.x;
    let prevY = tower.y;
    const maxChains = tower.chainCount || 4;
    const chainRadius = tower.chainRadius || 95;
    const visited = new Set();
    let currentDamage = tower.damage;

    for (let c = 0; c < maxChains; c++) {
      if (!current || !current.active || current.dead) break;
      visited.add(current);

      this.instantBeams.push({
        type: 'tesla',
        x1: prevX,
        y1: prevY,
        x2: current.x,
        y2: current.y,
        life: 0.12,
        maxLife: 0.12,
      });

      const dmg = current.takeDamage(currentDamage, false);
      tower.totalDamage += dmg;
      this.spawnFloatingText(current.x, current.y - 8, `-${Math.round(dmg)}`, '#c084fc', 0.7);

      if (current.dead) {
        tower.kills++;
        this.handleEnemyKilled(current);
      }

      prevX = current.x;
      prevY = current.y;
      currentDamage *= 0.8;

      const nearby = this.spatialGrid.queryRadius(current.x, current.y, chainRadius);
      let nextTarget = null;
      let minDistSq = 9999999;

      for (let n = 0; n < nearby.length; n++) {
        const cand = nearby[n];
        if (visited.has(cand) || !cand.active || cand.dead || cand.isPhased) continue;
        const d2 = (cand.x - current.x) ** 2 + (cand.y - current.y) ** 2;
        if (d2 < minDistSq) {
          minDistSq = d2;
          nextTarget = cand;
        }
      }

      current = nextTarget;
    }
  }

  spawnExplosion(x, y, radius, color = '#f59e0b') {
    audio.playExplosion(radius > 70 ? 1.4 : 1.0);

    const ring = this.particlePool.acquire();
    ring.init(x, y, 0, 0, color, 2, 0.45, true, radius);
    this.activeParticles.push(ring);

    const count = Math.min(25, Math.floor(radius * 0.35));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const p = this.particlePool.acquire();
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() > 0.4 ? color : '#ffffff',
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.3
      );
      this.activeParticles.push(p);
    }
  }

  spawnSparks(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      const p = this.particlePool.acquire();
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        1.5 + Math.random() * 2,
        0.2 + Math.random() * 0.2
      );
      this.activeParticles.push(p);
    }
  }

  spawnFloatingText(x, y, text, color = '#25b8ff', maxLife = 0.8) {
    if (this.activeFloatingTexts.length > 150) return;
    const ft = this.textPool.acquire();
    ft.init(x, y, text, color, maxLife);
    this.activeFloatingTexts.push(ft);
  }

  triggerEmpBurst(x, y, radius, duration) {
    const ring = this.particlePool.acquire();
    ring.init(x, y, 0, 0, '#f59e0b', 2, 0.5, true, radius);
    this.activeParticles.push(ring);

    const r2 = radius * radius;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      const d2 = (t.x - x) ** 2 + (t.y - y) ** 2;
      if (d2 <= r2) {
        t.stun(duration);
        this.spawnFloatingText(t.x, t.y - 12, 'EMP STUNNED!', '#f59e0b', 1.0);
      }
    }
    this.logEvent(`ELECTROMAGNETIC PULSE DETECTED! Nearby defenses offline for ${duration.toFixed(1)}s`, 'alert');
  }

  // --- GAMEPLAY EVENTS & ECONOMY ---

  handleEnemyKilled(enemy) {
    this.enemiesKilled++;
    this.addCredits(enemy.reward);
    this.addScore(enemy.score);

    this.spawnSparks(enemy.x, enemy.y, enemy.isBoss ? '#fbbf24' : '#ec4899', enemy.isBoss ? 20 : 8);

    if (enemy.isBoss) {
      this.spawnFloatingText(enemy.x, enemy.y - 16, `BOSS DESTROYED! +${enemy.reward} CREDITS`, '#fbbf24', 1.8);
      audio.playExplosion(1.8);
      this.logEvent(`CRITICAL VICTORY: Void Leviathan boss neutralized! (+${enemy.reward} Credits)`, 'kill');
    } else {
      if (this.enemiesKilled % 15 === 0) {
        const def = ENEMY_TYPES[enemy.type] || { name: 'Hostile' };
        this.logEvent(`${def.name} neutralized (+${enemy.reward} Credits)`, 'kill');
      }
    }
  }

  handleEnemyReachedBase(enemy) {
    const damage = enemy.isBoss ? 35 : enemy.type === 'brute' ? 12 : 5;
    this.baseHealth = Math.max(0, this.baseHealth - damage);
    audio.playBaseDamage();
    this.spawnFloatingText(BASE_CORE.x, BASE_CORE.y - 20, `BASE HIT: -${damage} HP!`, '#ef4444', 1.5);
    this.logEvent(`HULL BREACH: Outpost sustained ${damage} structural damage!`, 'alert');

    if (this.baseHealth <= 0) {
      this.triggerGameOver();
    }
  }

  handleWaveCompleted(waveNum, bonus) {
    this.addCredits(bonus);
    this.addScore(waveNum * 250);
    this.spawnFloatingText(720, 300, `WAVE ${waveNum} CLEARED! +${bonus} CREDITS`, '#10b981', 2.0);
    audio.playUpgrade();
    this.logEvent(`Wave ${waveNum} Cleared! Perimeter secured. (+${bonus} Credits award)`, 'wave');
  }

  addCredits(amount) {
    this.credits += amount;
    this.energy = this.credits;
  }

  addScore(amount) {
    this.score += amount;
  }

  triggerVictory() {
    this.isVictory = true;
    audio.playVictory();
    this.logEvent('MISSION ACCOMPLISHED: All 50 incursion waves eliminated. Outpost secured!', 'system');
    this.notifyState();
  }

  triggerGameOver() {
    this.isGameOver = true;
    audio.playGameOver();
    this.logEvent('CRITICAL FAILURE: Outpost Command Core destroyed. Operation terminated.', 'alert');
    this.notifyState();
  }

  // --- TOWER MANAGEMENT ---

  setPlacementMode(towerType) {
    this.placementMode = towerType;
    this.selectedTower = null;
    this.updatePlacementPreview();
    this.notifyState();
  }

  cancelPlacement() {
    this.placementMode = null;
    this.placementPreview.towerType = null;
    this.notifyState();
  }

  updateHoverPosition(canvasX, canvasY) {
    const gridX = Math.floor(canvasX / CELL_SIZE);
    const gridY = Math.floor(canvasY / CELL_SIZE);

    if (this.placementMode) {
      const isValid = this.isCellBuildable(gridX, gridY);
      this.placementPreview = {
        gridX,
        gridY,
        towerType: this.placementMode,
        isValid,
      };
    }
  }

  updatePlacementPreview() {
    if (this.placementPreview && this.placementMode) {
      this.placementPreview.towerType = this.placementMode;
      this.placementPreview.isValid = this.isCellBuildable(this.placementPreview.gridX, this.placementPreview.gridY);
    }
  }

  handleCanvasClick(canvasX, canvasY) {
    audio.init();

    const gridX = Math.floor(canvasX / CELL_SIZE);
    const gridY = Math.floor(canvasY / CELL_SIZE);

    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;

    if (this.placementMode) {
      this.buildTower(this.placementMode, gridX, gridY);
      return;
    }

    const tower = this.towerGrid[gridY * COLS + gridX];
    if (tower) {
      this.selectedTower = tower;
    } else {
      this.selectedTower = null;
    }
    this.notifyState();
  }

  isCellBuildable(gridX, gridY) {
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return false;
    const tileType = this.gridMap[gridY * COLS + gridX];
    if (tileType !== 0) return false;
    if (this.towerGrid[gridY * COLS + gridX] !== null) return false;
    return true;
  }

  buildTower(towerType, gridX, gridY) {
    const def = this.towerDefs[towerType];
    if (!def) return false;
    if (this.credits < def.cost) {
      this.spawnFloatingText(gridX * CELL_SIZE + 20, gridY * CELL_SIZE, 'INSUFFICIENT CREDITS!', '#ef4444', 1.0);
      return false;
    }
    if (!this.isCellBuildable(gridX, gridY)) {
      this.spawnFloatingText(gridX * CELL_SIZE + 20, gridY * CELL_SIZE, 'INVALID PLACEMENT ZONE', '#ef4444', 0.8);
      return false;
    }

    this.credits -= def.cost;
    this.energy = this.credits;
    this.towersBuiltCount++;

    const worldX = gridX * CELL_SIZE + CELL_SIZE / 2;
    const worldY = gridY * CELL_SIZE + CELL_SIZE / 2;
    const tower = new Tower(this.towersBuiltCount, towerType, gridX, gridY, worldX, worldY);

    this.towers.push(tower);
    this.towerGrid[gridY * COLS + gridX] = tower;
    this.selectedTower = tower;

    audio.playBuild();
    this.spawnSparks(worldX, worldY, def.color, 12);
    this.spawnFloatingText(worldX, worldY - 14, `${def.name} ONLINE`, def.color, 1.0);
    this.logEvent(`${def.name} constructed at grid [${gridX}, ${gridY}] (-${def.cost} Credits)`, 'build');

    if (this.credits < def.cost) {
      this.cancelPlacement();
    } else {
      this.updatePlacementPreview();
      this.notifyState();
    }

    return true;
  }

  upgradeTower(tower) {
    if (!tower || !tower.canUpgrade()) return false;
    const cost = tower.getUpgradeCost();
    if (this.credits < cost) {
      this.spawnFloatingText(tower.x, tower.y - 14, 'INSUFFICIENT CREDITS!', '#ef4444', 1.0);
      return false;
    }

    this.credits -= cost;
    this.energy = this.credits;
    tower.upgrade();
    audio.playUpgrade();
    this.spawnSparks(tower.x, tower.y, '#fbbf24', 15);
    this.spawnFloatingText(tower.x, tower.y - 18, `UPGRADED TIER ${tower.level}!`, '#fbbf24', 1.2);
    this.logEvent(`${tower.def.name} upgraded to Tier ${tower.level} (-${cost} Credits)`, 'build');
    this.notifyState();
    return true;
  }

  sellTower(tower) {
    if (!tower) return false;
    const refund = tower.getSellValue();
    this.addCredits(refund);

    this.towerGrid[tower.gridY * COLS + tower.gridX] = null;
    const idx = this.towers.indexOf(tower);
    if (idx !== -1) {
      this.towers.splice(idx, 1);
    }

    if (this.selectedTower === tower) {
      this.selectedTower = null;
    }

    audio.playSell();
    this.spawnFloatingText(tower.x, tower.y - 14, `DECOMMISSIONED +${refund} CREDITS`, '#25b8ff', 1.0);
    this.logEvent(`${tower.def.name} decommissioned (+${refund} Credits refund)`, 'build');
    this.notifyState();
    return true;
  }

  setGameSpeed(speed) {
    // 1x, 2x, 3x speeds strictly supported
    this.gameSpeed = Math.max(1, Math.min(3, speed));
    this.notifyState();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.notifyState();
  }

  restart() {
    this.activeEnemies.forEach(e => {
      this.spatialGrid.remove(e);
      this.enemyPool.release(e);
    });
    this.activeEnemies.length = 0;

    this.activeProjectiles.forEach(p => this.projectilePool.release(p));
    this.activeProjectiles.length = 0;

    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeParticles.length = 0;

    this.activeFloatingTexts.forEach(t => this.textPool.release(t));
    this.activeFloatingTexts.length = 0;

    this.instantBeams.length = 0;
    this.towers.length = 0;
    this.towerGrid.fill(null);
    this.spatialGrid.clear();

    this.baseHealth = this.maxBaseHealth;
    this.credits = 450;
    this.energy = 450;
    this.score = 0;
    this.enemiesKilled = 0;
    this.towersBuiltCount = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;
    this.selectedTower = null;
    this.placementMode = null;
    this.isStressMode = false;

    this.combatLog = [
      { id: 1, time: '00:00', text: 'OUTPOST RE-INITIALIZED. DEFENSE PROTOCOL ACTIVE.', type: 'system' },
    ];
    this.logIdCounter = 2;

    this.perfMonitor.reset();
    this.waveManager.reset();
    this.notifyState();
  }

  // --- STRESS SCENARIO (5,000 Enemies / 100 Towers / 1,000 Projectiles) ---

  runStressScenario() {
    this.restart();
    this.isStressMode = true;
    this.perfMonitor.reset();

    const towerTypes = ['pulse_tower', 'mortar_tower', 'frost_tower', 'tesla_tower', 'railgun_tower'];
    let towersPlaced = 0;

    for (let r = 1; r < ROWS - 1 && towersPlaced < 100; r++) {
      for (let c = 1; c < COLS - 1 && towersPlaced < 100; c++) {
        if (this.isCellBuildable(c, r)) {
          const type = towerTypes[towersPlaced % towerTypes.length];
          const worldX = c * CELL_SIZE + CELL_SIZE / 2;
          const worldY = r * CELL_SIZE + CELL_SIZE / 2;
          const tower = new Tower(++this.towersBuiltCount, type, c, r, worldX, worldY);
          this.towers.push(tower);
          this.towerGrid[r * COLS + c] = tower;
          towersPlaced++;
        }
      }
    }

    const enemyTypes = ['scout', 'brute', 'phase_shifter', 'regenerator'];
    for (let i = 0; i < 5000; i++) {
      const type = enemyTypes[i % enemyTypes.length];
      const lane = i % 2 === 0 ? 'alpha' : 'beta';
      const enemy = this.enemyPool.acquire();
      enemy.init(this.enemyIdCounter++, type, lane, 1.0, 0.8 + (i % 5) * 0.1);
      enemy.distanceTraveled = (i * 0.35) % (enemy.totalDistance * 0.95);
      this.spatialGrid.insert(enemy);
      this.activeEnemies.push(enemy);
    }

    for (let i = 0; i < 1000; i++) {
      const tower = this.towers[i % this.towers.length];
      const target = this.activeEnemies[i % this.activeEnemies.length];
      const proj = this.projectilePool.acquire();
      proj.init(tower, target);
      proj.x = tower.x + (Math.random() - 0.5) * 80;
      proj.y = tower.y + (Math.random() - 0.5) * 80;
      this.activeProjectiles.push(proj);
    }

    this.logEvent('STRESS TEST DEPLOYED: 5,000 Enemies / 100 Towers / 1,000 Projectiles', 'alert');
    this.notifyState();
  }

  toggleNaiveMode() {
    this.naiveMode = !this.naiveMode;
    this.perfMonitor.reset();
    const modeName = this.naiveMode ? 'NAIVE O(N*M) SEARCH' : 'OPTIMIZED SPATIAL HASH GRID O(1)';
    const color = this.naiveMode ? '#ef4444' : '#10b981';
    this.spawnFloatingText(720, 200, `SWITCHED TO: ${modeName}`, color, 2.5);
    this.logEvent(`SEARCH ALGORITHM TOGGLED: ${modeName}`, this.naiveMode ? 'alert' : 'info');
    this.notifyState();
  }
}
