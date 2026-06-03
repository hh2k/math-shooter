export const POWERUP_TYPES = ['freeze', 'multishot', 'shield'];

export const POWERUP_INFO = {
  freeze:    { icon: '❄', color: '#00eeff', label: 'Freeze'    },
  multishot: { icon: '⚡', color: '#ff9900', label: 'Multishot' },
  shield:    { icon: '🛡', color: '#44ff88', label: 'Shield'    },
};

const RADIUS_BASE = 22;
const LIFESPAN    = 9;
const FADE_START  = 7;
const SPEED_BASE  = 60;

export class PowerUp {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.type = 'freeze';
    this.radius = RADIUS_BASE;
    this._vx = 0;
    this._vy = 0;
    this._age = 0;
    this._canvasWidth = 800;
  }

  spawn(x, y, type, canvasWidth = 800) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this._age = 0;
    this._canvasWidth = canvasWidth;
    const s = canvasWidth / 800;
    this.radius = RADIUS_BASE * s;
    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED_BASE * s;
    this._vx = Math.cos(angle) * speed;
    this._vy = Math.sin(angle) * speed;
  }

  update(delta, bounds) {
    if (!this.active) return;
    this._age += delta;
    if (this._age >= LIFESPAN) { this.active = false; return; }

    this.x += this._vx * delta;
    this.y += this._vy * delta;

    if (this.x < bounds.minX) { this.x = bounds.minX; this._vx = Math.abs(this._vx); }
    if (this.x > bounds.maxX) { this.x = bounds.maxX; this._vx = -Math.abs(this._vx); }
    if (this.y < bounds.minY) { this.y = bounds.minY; this._vy = Math.abs(this._vy); }
    if (this.y > bounds.maxY) { this.y = bounds.maxY; this._vy = -Math.abs(this._vy); }
  }

  render(ctx) {
    if (!this.active) return;
    const info = POWERUP_INFO[this.type];
    const r = this.radius;
    const s = this._canvasWidth / 800;

    const alpha = this._age >= FADE_START
      ? 1 - (this._age - FADE_START) / (LIFESPAN - FADE_START)
      : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    const pulse = 1 + Math.sin(this._age * 4) * 0.06;
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2.5 * s;
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 14 * s;
    ctx.stroke();

    ctx.font = `${Math.round(r * 1.1)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(info.icon, 0, 1 * s);

    ctx.restore();
  }
}
