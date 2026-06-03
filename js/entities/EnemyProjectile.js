const SPEED_BASE  = 180;
const LIFESPAN    = 2.5;

export class EnemyProjectile {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this._vx = 0;
    this._vy = 0;
    this._age = 0;
    this._radius = 6;
    this._canvasWidth = 800;
  }

  fire(x, y, targetX, targetY, canvasWidth = 800) {
    const s = canvasWidth / 800;
    this.x = x;
    this.y = y;
    this.active = true;
    this._age = 0;
    this._canvasWidth = canvasWidth;
    this._radius = 6 * s;
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = SPEED_BASE * s;
    this._vx = (dx / dist) * speed;
    this._vy = (dy / dist) * speed;
  }

  update(delta) {
    if (!this.active) return;
    this._age += delta;
    if (this._age >= LIFESPAN) { this.active = false; return; }
    this.x += this._vx * delta;
    this.y += this._vy * delta;
  }

  render(ctx) {
    if (!this.active) return;
    const t = this._age / LIFESPAN;
    const alpha = (1 - t) * 0.85;
    const r = this._radius * (1 - t * 0.4);
    const s = this._canvasWidth / 800;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2222';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 12 * s;
    ctx.fill();
    ctx.restore();
  }
}
