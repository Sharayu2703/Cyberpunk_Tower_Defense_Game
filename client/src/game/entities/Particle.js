export class Particle {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.initialSize = 2;
    this.color = '#ffffff';
    this.alpha = 1.0;
    this.life = 0;
    this.maxLife = 0.5;
    this.friction = 0.95;
    this.isRing = false;
    this.ringRadius = 0;
    this.ringMaxRadius = 30;
    this.dead = false;
    this._poolIndex = -1;
  }

  init(x, y, vx, vy, color, size, maxLife, isRing = false, ringMaxRadius = 30) {
    this.reset();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.initialSize = size;
    this.maxLife = maxLife;
    this.life = 0;
    this.alpha = 1.0;
    this.isRing = isRing;
    this.ringRadius = isRing ? 2 : 0;
    this.ringMaxRadius = ringMaxRadius;
    this.active = true;
    this.dead = false;
  }

  update(dt) {
    if (!this.active || this.dead) return;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.dead = true;
      return;
    }

    const progress = this.life / this.maxLife;
    this.alpha = Math.max(0, 1.0 - progress);

    if (this.isRing) {
      this.ringRadius = this.ringMaxRadius * progress;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.size = this.initialSize * (1.0 - progress * 0.5);
    }
  }
}

export class FloatingText {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#ffffff';
    this.alpha = 1.0;
    this.life = 0;
    this.maxLife = 0.8;
    this.dead = false;
    this._poolIndex = -1;
  }

  init(x, y, text, color = '#ffffff', maxLife = 0.8) {
    this.reset();
    this.x = x + (Math.random() * 12 - 6);
    this.y = y;
    this.text = text;
    this.color = color;
    this.maxLife = maxLife;
    this.life = 0;
    this.alpha = 1.0;
    this.active = true;
    this.dead = false;
  }

  update(dt) {
    if (!this.active || this.dead) return;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.dead = true;
      return;
    }

    const progress = this.life / this.maxLife;
    this.y -= 25 * dt; // Float upward
    this.alpha = Math.max(0, 1.0 - progress);
  }
}
