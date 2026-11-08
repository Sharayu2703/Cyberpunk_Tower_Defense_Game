export class Projectile {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.id = 0;
    this.type = 'laser';
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetEnemy = null;
    this.sourceTower = null;

    this.vx = 0;
    this.vy = 0;
    this.speed = 500;
    this.damage = 10;
    this.radius = 4;
    this.color = '#06b6d4';
    this.isArmorPiercing = false;

    // Special properties
    this.splashRadius = 0;
    this.slowMultiplier = 1.0;
    this.slowDuration = 0;
    this.chainCount = 0;
    this.chainRadius = 0;

    // Lifetime
    this.life = 0;
    this.maxLife = 2.5;
    this.dead = false;

    // Mortar arc progression
    this.isMortar = false;
    this.progress = 0;
    this.duration = 0.5;

    this._poolIndex = -1;
  }

  init(tower, targetEnemy) {
    this.reset();
    this.sourceTower = tower;
    this.targetEnemy = targetEnemy;
    this.type = tower.def.projectileType;
    this.damage = tower.damage;
    this.splashRadius = tower.splashRadius;
    this.slowMultiplier = tower.slowMultiplier;
    this.slowDuration = tower.slowDuration;
    this.chainCount = tower.chainCount;
    this.chainRadius = tower.chainRadius;
    this.isArmorPiercing = tower.isArmorPiercing;
    this.color = tower.def.color;

    this.x = tower.x;
    this.y = tower.y;
    this.startX = tower.x;
    this.startY = tower.y;
    this.targetX = targetEnemy ? targetEnemy.x : tower.targetX;
    this.targetY = targetEnemy ? targetEnemy.y : tower.targetY;

    if (this.type === 'mortar') {
      this.isMortar = true;
      const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
      this.duration = Math.max(0.35, dist / (tower.def.projectileSpeed || 280));
      this.progress = 0;
      this.radius = 6;
    } else {
      this.isMortar = false;
      this.speed = tower.def.projectileSpeed || 600;
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.vx = (dx / len) * this.speed;
      this.vy = (dy / len) * this.speed;
      this.radius = this.type === 'cryo' ? 5 : 3.5;
    }

    this.active = true;
    this.dead = false;
    this.life = 0;
  }

  update(dt, spatialGrid, gameEngine) {
    if (!this.active || this.dead) return;

    this.life += dt;
    if (this.life > this.maxLife) {
      this.dead = true;
      return;
    }

    if (this.isMortar) {
      this.progress += dt / this.duration;
      if (this.progress >= 1.0) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.detonateMortar(spatialGrid, gameEngine);
        this.dead = true;
        return;
      }
      this.x = this.startX + (this.targetX - this.startX) * this.progress;
      this.y = this.startY + (this.targetY - this.startY) * this.progress;
      return;
    }

    // Direct / Homing projectile
    if (this.targetEnemy && this.targetEnemy.active && !this.targetEnemy.dead) {
      this.targetX = this.targetEnemy.x;
      this.targetY = this.targetEnemy.y;
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.vx = (dx / len) * this.speed;
      this.vy = (dy / len) * this.speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check hit against target enemy or spatial query
    if (this.targetEnemy && this.targetEnemy.active && !this.targetEnemy.dead) {
      const distSq = (this.targetEnemy.x - this.x) ** 2 + (this.targetEnemy.y - this.y) ** 2;
      const hitRadius = this.targetEnemy.radius + this.radius;
      if (distSq <= hitRadius * hitRadius) {
        this.hitEnemy(this.targetEnemy, spatialGrid, gameEngine);
        this.dead = true;
        return;
      }
    } else {
      // Spatial lookup for collision
      const nearby = spatialGrid.queryRadius(this.x, this.y, this.radius + 12);
      if (nearby.length > 0) {
        this.hitEnemy(nearby[0], spatialGrid, gameEngine);
        this.dead = true;
        return;
      }
    }
  }

  hitEnemy(enemy, spatialGrid, gameEngine) {
    if (!enemy.active || enemy.dead) return;

    const dmgDealt = enemy.takeDamage(this.damage, this.isArmorPiercing);
    this.sourceTower.totalDamage += dmgDealt;

    if (this.slowDuration > 0) {
      enemy.applySlow(this.slowMultiplier, this.slowDuration);
    }

    // Spawn damage floating text
    gameEngine.spawnFloatingText(enemy.x, enemy.y - 10, `-${Math.round(dmgDealt)}`, this.color);

    // Spawn impact sparks
    gameEngine.spawnSparks(this.x, this.y, this.color, 4);

    if (enemy.dead) {
      this.sourceTower.kills++;
      gameEngine.handleEnemyKilled(enemy);
    }

    // Splash damage if mortar or cryo
    if (this.splashRadius > 0) {
      this.detonateSplash(enemy, spatialGrid, gameEngine);
    }
  }

  detonateMortar(spatialGrid, gameEngine) {
    gameEngine.spawnExplosion(this.x, this.y, this.splashRadius, this.color);

    const hitEnemies = spatialGrid.queryRadius(this.x, this.y, this.splashRadius);
    for (let i = 0; i < hitEnemies.length; i++) {
      const e = hitEnemies[i];
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      // Falloff damage
      const factor = Math.max(0.4, 1 - (dist / this.splashRadius) * 0.6);
      const splashDmg = this.damage * factor;
      const dmg = e.takeDamage(splashDmg, this.isArmorPiercing);
      this.sourceTower.totalDamage += dmg;

      if (e.dead) {
        this.sourceTower.kills++;
        gameEngine.handleEnemyKilled(e);
      }
    }
  }

  detonateSplash(hitEnemy, spatialGrid, gameEngine) {
    const splashTargets = spatialGrid.queryRadius(this.x, this.y, this.splashRadius);
    for (let i = 0; i < splashTargets.length; i++) {
      const e = splashTargets[i];
      if (e === hitEnemy) continue;
      const dmg = e.takeDamage(this.damage * 0.5, this.isArmorPiercing);
      this.sourceTower.totalDamage += dmg;
      if (this.slowDuration > 0) {
        e.applySlow(this.slowMultiplier, this.slowDuration * 0.8);
      }
      if (e.dead) {
        this.sourceTower.kills++;
        gameEngine.handleEnemyKilled(e);
      }
    }
  }
}
