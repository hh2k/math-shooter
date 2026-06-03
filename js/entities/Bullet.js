const SPEED = 1000;
const BASE_RADIUS = 5;
const TRAIL_LENGTH = 8;
const MAX_BOUNCES = 2;

export { BASE_RADIUS };

export class Bullet {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.active = false;
    this.radius = BASE_RADIUS;
    this._trail = [];
    this._bounces = 0;
    this._canvasWidth = 800;
    this._canvasHeight = 600;
  }

  fire(x, y, targetX, targetY, canvasWidth = 800, canvasHeight = 600) {
    this.x = x;
    this.y = y;
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = SPEED * (canvasWidth / 800);
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
    this.radius = BASE_RADIUS * (canvasWidth / 800);
    this.active = true;
    this._trail = [];
    this._bounces = 0;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
  }

  update(delta) {
    if (!this.active) return;

    this._trail.push({ x: this.x, y: this.y });
    if (this._trail.length > TRAIL_LENGTH) this._trail.shift();

    this.x += this.vx * delta;
    this.y += this.vy * delta;

    const W = this._canvasWidth;
    const H = this._canvasHeight;

    // Bounce off top and sides
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      this._bounces++;
    } else if (this.x > W - this.radius) {
      this.x = W - this.radius;
      this.vx = -Math.abs(this.vx);
      this._bounces++;
    }
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      this._bounces++;
    }

    if (this._bounces > MAX_BOUNCES) {
      this.active = false;
      return;
    }

    if (this.y > H + 50) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;

    for (let i = 0; i < this._trail.length; i++) {
      const t = (i + 1) / (this._trail.length + 1);
      const alpha = t * 0.55;
      const r = this.radius * t * 0.9;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(this._trail[i].x, this._trail[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcc00';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = this.radius * 2;
    ctx.fill();
    ctx.restore();
  }
}
