import { MAP_WIDTH, MAP_HEIGHT, CELL_SIZE, COLS, ROWS, BASE_CORE, SPAWN_PORTALS, WAYPOINTS_LANE_A, WAYPOINTS_LANE_B } from '../map/MapConfig.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.time = 0;
    this.pulseAnim = 0;

    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(MAP_WIDTH * this.dpr);
    this.canvas.height = Math.floor(MAP_HEIGHT * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  render(engine) {
    const ctx = this.ctx;
    this.time = performance.now() * 0.001;
    this.pulseAnim = (this.pulseAnim + 0.02) % (Math.PI * 2);

    // 1. Terrain & High-Tech Circuit Grid
    this.drawTerrain(ctx);

    // 2. Dual-Lane Tactical Paths & Warp Portals
    this.drawPaths(ctx);
    this.drawPortals(ctx);

    // 3. Outpost Command Core (Base Nexus)
    this.drawBaseCore(ctx, engine);

    // 4. Defense Turrets & Selected Range
    this.drawTowers(ctx, engine);

    // 5. Hostile Entities (Viewport Culled & Batched)
    this.drawEnemies(ctx, engine);

    // 6. Projectiles & Ballistics
    this.drawProjectiles(ctx, engine);

    // 7. Instant Beams (Railgun & Tesla Arcs)
    this.drawInstantBeams(ctx, engine);

    // 8. Controlled Particles & Detonations
    this.drawParticles(ctx, engine);

    // 9. Floating Combat Text
    this.drawFloatingTexts(ctx, engine);

    // 10. Holographic Placement Preview
    if (engine.placementMode) {
      this.drawPlacementPreview(ctx, engine);
    }
  }

  drawTerrain(ctx) {
    // Deep Black Canvas Base (#070710)
    ctx.fillStyle = '#070710';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Dark Navy Circuit Substrate (#0A1024)
    ctx.fillStyle = '#0a1024';
    ctx.fillRect(8, 8, MAP_WIDTH - 16, MAP_HEIGHT - 16);

    // Tactical Circuit Grid Lines
    ctx.strokeStyle = 'rgba(112, 39, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= MAP_WIDTH; x += CELL_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
    }
    for (let y = 0; y <= MAP_HEIGHT; y += CELL_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
    }
    ctx.stroke();

    // Subtle Circuit Crossings & Junction Lights
    ctx.fillStyle = 'rgba(37, 184, 255, 0.04)';
    for (let c = 0; c < COLS; c += 3) {
      for (let r = 0; r < ROWS; r += 3) {
        ctx.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, 4, 4);
      }
    }
  }

  drawPaths(ctx) {
    const drawLane = (waypoints, primaryColor, glowColor, laneLabel) => {
      // Wide Outer Glow Track
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();

      // Guardrail Edges
      ctx.strokeStyle = 'rgba(14, 22, 48, 0.95)';
      ctx.lineWidth = 22;
      ctx.stroke();

      // Inner Conduit Pathway
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Flowing Directional Energy Chevrons (>>>)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 22]);
      ctx.lineDashOffset = -this.time * 45;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawLane(WAYPOINTS_LANE_A, 'rgba(37, 184, 255, 0.35)', 'rgba(37, 184, 255, 0.08)', 'LANE-ALPHA');
    drawLane(WAYPOINTS_LANE_B, 'rgba(236, 72, 153, 0.35)', 'rgba(236, 72, 153, 0.08)', 'LANE-BETA');
  }

  drawPortals(ctx) {
    for (const portal of SPAWN_PORTALS) {
      const radius = 26;

      // Outer containment ring
      ctx.strokeStyle = portal.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, radius + Math.sin(this.time * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();

      // Swirling portal core
      ctx.fillStyle = portal.id === 'alpha' ? 'rgba(37, 184, 255, 0.25)' : 'rgba(236, 72, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, radius - 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating containment pylons
      ctx.save();
      ctx.translate(portal.x, portal.y);
      ctx.rotate(this.time * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(radius - 8, 0);
        ctx.lineTo(radius, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawBaseCore(ctx, engine) {
    const { x, y, radius } = BASE_CORE;
    const hpRatio = Math.max(0, engine.baseHealth / engine.maxBaseHealth);
    const isCritical = hpRatio < 0.3;

    // Defense Shield Bubble
    ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.45)' : 'rgba(112, 39, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 10 + Math.sin(this.time * 3) * 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Outpost Reactor Rings
    ctx.save();
    ctx.translate(x, y);

    // Outer Octagonal Hull
    ctx.rotate(this.time * 1.2);
    ctx.strokeStyle = '#7027ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);

    // Inner Gyro Ring
    ctx.rotate(-this.time * 2.4);
    ctx.strokeStyle = '#25b8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-radius * 0.5, -radius * 0.5, radius, radius);

    // Central Quantum Singularity
    ctx.fillStyle = isCritical ? '#ef4444' : '#a855f7';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Circular Health / Shield Gauge Arc
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(x, y, radius + 18, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.stroke();

    ctx.strokeStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, radius + 18, -Math.PI * 0.75, -Math.PI * 0.75 + (Math.PI * 1.5 * hpRatio));
    ctx.stroke();

    // Outpost Core Label
    ctx.font = '700 11px Orbitron, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText('OUTPOST CORE', x, y + radius + 32);

    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.fillStyle = isCritical ? '#f87171' : '#25b8ff';
    ctx.fillText(`${Math.round(engine.baseHealth)}/100 HP`, x, y + radius + 46);
  }

  drawTowers(ctx, engine) {
    const towers = engine.towers;
    const selected = engine.selectedTower;

    // Selected Tower Range Circle & Tactical Target Lock
    if (selected) {
      ctx.fillStyle = 'rgba(112, 39, 255, 0.08)';
      ctx.strokeStyle = 'rgba(37, 184, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(selected.x, selected.y, selected.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      if (selected.target && selected.target.active && !selected.target.dead) {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(selected.x, selected.y);
        ctx.lineTo(selected.target.x, selected.target.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Render Each Tower with Silhouettes
    for (let i = 0; i < towers.length; i++) {
      const tower = towers[i];
      const isSelected = selected === tower;

      // Base Pedestal
      ctx.fillStyle = '#0a1024';
      ctx.strokeStyle = isSelected ? '#ffffff' : tower.def.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // EMP Stunned indicator
      if (tower.stunTimer > 0) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Rotating Turret Top & Weapons
      ctx.save();
      ctx.translate(tower.x, tower.y);
      ctx.rotate(tower.rotation);

      const recoilOffset = tower.recoil * 3;

      if (tower.type === 'pulse_tower' || tower.type === 'pulse_laser') {
        // Dual Plasma Emitters
        ctx.fillStyle = '#25b8ff';
        ctx.fillRect(-recoilOffset - 2, -6, 16, 3);
        ctx.fillRect(-recoilOffset - 2, 3, 16, 3);
        ctx.beginPath();
        ctx.arc(-recoilOffset, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (tower.type === 'frost_tower' || tower.type === 'cryo_disrupter') {
        // Cryogenic Condenser Pylon
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-recoilOffset, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-recoilOffset + 2, -8);
        ctx.lineTo(-recoilOffset + 14, 0);
        ctx.lineTo(-recoilOffset + 2, 8);
        ctx.stroke();
      } else if (tower.type === 'mortar_tower' || tower.type === 'plasma_mortar') {
        // Heavy Armored Cannon
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-recoilOffset - 4, -5, 20, 10);
        ctx.fillStyle = '#070710';
        ctx.fillRect(-recoilOffset + 12, -4, 4, 8);
      } else if (tower.type === 'tesla_tower' || tower.type === 'tesla_arc') {
        // Tesla Quad Coils
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(-recoilOffset, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-recoilOffset, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Railgun Accelerator
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-recoilOffset - 4, -3, 24, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-recoilOffset - 2, -1, 20, 2);
      }

      ctx.restore();

      // Upgrade Tier Pips (Tier 1: 1 pip, Tier 2: 2 pips, Tier 3: 3 pips)
      ctx.fillStyle = '#fbbf24';
      for (let p = 0; p < tower.level; p++) {
        ctx.beginPath();
        ctx.arc(tower.x - 6 + p * 6, tower.y + tower.radius + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawEnemies(ctx, engine) {
    const enemies = engine.activeEnemies;
    const len = enemies.length;
    if (len === 0) return;

    const minX = -30;
    const maxX = MAP_WIDTH + 30;
    const minY = -30;
    const maxY = MAP_HEIGHT + 30;

    for (let i = 0; i < len; i++) {
      const e = enemies[i];
      if (!e.active || e.dead) continue;

      // Viewport / Frustum Culling
      if (e.x < minX || e.x > maxX || e.y < minY || e.y > maxY) continue;

      const alpha = e.isPhased ? 0.35 : 1.0;
      ctx.globalAlpha = alpha;

      if (e.isBoss) {
        // Colossal Void Leviathan Boss
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'brute') {
        // Armored Chrono Brute Mech
        ctx.fillStyle = '#7027ff';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = e.x + Math.cos(angle) * e.radius;
          const py = e.y + Math.sin(angle) * e.radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'phase_shifter') {
        // Phase Shifter Diamond
        ctx.fillStyle = '#25b8ff';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.radius * 1.2);
        ctx.lineTo(e.x + e.radius, e.y);
        ctx.lineTo(e.x, e.y + e.radius * 1.2);
        ctx.lineTo(e.x - e.radius, e.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Scout / Regenerator / Disruptor
        ctx.fillStyle = e.type === 'regenerator' ? '#10b981' : e.type === 'emp_disruptor' ? '#f59e0b' : '#ec4899';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Slowed Ice Frost Ring
      if (e.slowTimer > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Health Bar
      if (e.hp < e.maxHp || e.isBoss) {
        const barWidth = e.radius * 2.2;
        const barHeight = e.isBoss ? 5 : 3;
        const barX = e.x - barWidth / 2;
        const barY = e.y - e.radius - (e.isBoss ? 10 : 6);
        const hpPct = Math.max(0, e.hp / e.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

        if (e.maxShield > 0 && e.shield > 0) {
          const shieldPct = e.shield / e.maxShield;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(barX, barY - 3, barWidth * shieldPct, 2);
        }
      }
    }

    ctx.globalAlpha = 1.0;
  }

  drawProjectiles(ctx, engine) {
    const projectiles = engine.activeProjectiles;
    const len = projectiles.length;

    for (let i = 0; i < len; i++) {
      const p = projectiles[i];
      if (!p.active || p.dead) continue;

      if (p.isMortar) {
        const arcHeight = Math.sin(p.progress * Math.PI) * 45;
        const drawY = p.y - arcHeight;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ground shadow reticle
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, p.splashRadius * p.progress, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Tracer line
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
        ctx.stroke();
      }
    }
  }

  drawInstantBeams(ctx, engine) {
    const beams = engine.instantBeams;
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      b.life -= 0.016;
      if (b.life <= 0) {
        beams.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = b.life / b.maxLife;

      if (b.type === 'railgun') {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (b.type === 'tesla') {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        const segments = 4;
        const dx = (b.x2 - b.x1) / segments;
        const dy = (b.y2 - b.y1) / segments;
        for (let s = 1; s < segments; s++) {
          const jitterX = (Math.random() - 0.5) * 16;
          const jitterY = (Math.random() - 0.5) * 16;
          ctx.lineTo(b.x1 + dx * s + jitterX, b.y1 + dy * s + jitterY);
        }
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawParticles(ctx, engine) {
    const particles = engine.activeParticles;
    const len = particles.length;

    for (let i = 0; i < len; i++) {
      const p = particles[i];
      if (!p.active || p.dead) continue;

      ctx.globalAlpha = p.alpha;
      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  drawFloatingTexts(ctx, engine) {
    const texts = engine.activeFloatingTexts;
    const len = texts.length;
    if (len === 0) return;

    ctx.font = '700 12px Orbitron, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < len; i++) {
      const ft = texts[i];
      if (!ft.active || ft.dead) continue;

      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
  }

  drawPlacementPreview(ctx, engine) {
    const { gridX, gridY, towerType, isValid } = engine.placementPreview;
    if (gridX === undefined || gridY === undefined || !towerType) return;

    const x = gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = gridY * CELL_SIZE + CELL_SIZE / 2;
    const towerDef = engine.towerDefs[towerType];
    if (!towerDef) return;

    // Range preview circle
    ctx.fillStyle = isValid ? 'rgba(37, 184, 255, 0.12)' : 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = isValid ? '#25b8ff' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, towerDef.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid Cell Footprint
    ctx.fillStyle = isValid ? 'rgba(37, 184, 255, 0.3)' : 'rgba(239, 68, 68, 0.4)';
    ctx.strokeStyle = isValid ? '#25b8ff' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Tower Silhouette
    ctx.fillStyle = towerDef.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
