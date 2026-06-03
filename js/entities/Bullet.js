const SPEED = 1000;      // px/sec (scales with canvas)
const BASE_RADIUS = 5;   // at 800px canvas width

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
  }

  fire(x, y, targetX, targetY, canvasWidth = 800) {
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
  }

  update(delta) {
    if (!this.active) return;
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    if (this.x < -100 || this.x > 9999 || this.y < -100 || this.y > 9999) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
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
