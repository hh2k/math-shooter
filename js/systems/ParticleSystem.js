const POOL_SIZE = 120;

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 1;
    this.radius = 4;
    this.color = '#fff';
    this.active = false;
  }
}

export class ParticleSystem {
  constructor() {
    this._pool = Array.from({ length: POOL_SIZE }, () => new Particle());
  }

  burst(x, y, color = '#7eb8ff', count = 14) {
    let spawned = 0;
    for (const p of this._pool) {
      if (p.active || spawned >= count) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0;
      p.maxLife = 0.4 + Math.random() * 0.3;
      p.radius = 3 + Math.random() * 5;
      p.color = color;
      p.active = true;
      spawned++;
    }
  }

  update(delta) {
    for (const p of this._pool) {
      if (!p.active) continue;
      p.life += delta;
      if (p.life >= p.maxLife) { p.active = false; continue; }
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 200 * delta; // gravity
    }
  }

  render(ctx) {
    for (const p of this._pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      const alpha = 1 - t;
      const r = p.radius * (1 - t * 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }
}
