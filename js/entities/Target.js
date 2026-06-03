const BUBBLE_COLORS = ['#4488ff', '#44aaff', '#44ccff', '#66aaee', '#3377dd'];
const FLOAT_SPEED = 45;
export const BASE_RADIUS = 36; // radius at the reference 800px canvas width

export class Target {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.value = 0;
    this.isCorrect = false;
    this.active = false;
    this.radius = 36;
    this._colorIdx = 0;
    this._hitFlash = 0;
    this._vx = 0;
    this._vy = 0;
    this._sinOffset = 0;
    this._sinSpeed = 0;
    this._sinAmp = 0;
    this._baseX = 0;
    this._time = 0;
  }

  spawn(x, y, value, isCorrect, speed = FLOAT_SPEED, canvasWidth = 800, sizeScale = 1) {
    this.x = x;
    this.y = y;
    this._baseX = x;
    this.value = value;
    this.isCorrect = isCorrect;
    this.active = true;
    this.radius = BASE_RADIUS * (canvasWidth / 800) * sizeScale;
    this._colorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);
    this._hitFlash = 0;
    this._time = Math.random() * Math.PI * 2;
    const angle = Math.random() * Math.PI * 2;
    this._vx = Math.cos(angle) * speed;
    this._vy = Math.sin(angle) * speed;
    this._sinAmp = 20 + Math.random() * 30;
    this._sinSpeed = 0.8 + Math.random() * 0.8;
  }

  flashWrong() {
    this._hitFlash = 0.3;
  }

  update(delta, bounds = { minX: 44, maxX: 756, minY: 56, maxY: 490 }) {
    if (!this.active) return;
    if (this._hitFlash > 0) this._hitFlash -= delta;

    this._time += delta;
    this.x += this._vx * delta;
    this.y += this._vy * delta;

    // Add sinusoidal wobble perpendicular to drift
    const speed = Math.hypot(this._vx, this._vy) || FLOAT_SPEED;
    const perpX = -this._vy / speed;
    const perpY = this._vx / speed;
    const wobble = Math.sin(this._time * this._sinSpeed * Math.PI * 2) * this._sinAmp * delta;
    this.x += perpX * wobble;
    this.y += perpY * wobble;

    // Bounce off walls
    if (this.x < bounds.minX) { this.x = bounds.minX; this._vx = Math.abs(this._vx); }
    if (this.x > bounds.maxX) { this.x = bounds.maxX; this._vx = -Math.abs(this._vx); }
    if (this.y < bounds.minY) { this.y = bounds.minY; this._vy = Math.abs(this._vy); }
    if (this.y > bounds.maxY) { this.y = bounds.maxY; this._vy = -Math.abs(this._vy); }
  }

  render(ctx) {
    if (!this.active) return;
    const r = this.radius; // already scaled at spawn time
    const s = r / BASE_RADIUS; // for line widths and font sizes
    ctx.save();

    const color = this._hitFlash > 0 ? '#ff4444' : BUBBLE_COLORS[this._colorIdx];

    const grad = ctx.createRadialGradient(
      this.x - r * 0.3, this.y - r * 0.3, r * 0.1,
      this.x, this.y, r
    );
    grad.addColorStop(0, lighten(color));
    grad.addColorStop(1, darken(color));
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = lighten(color);
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    const fs = Math.round((this.value > 99 ? 20 : 26) * s);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fs}px Segoe UI, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.value, this.x, this.y);

    ctx.restore();
  }
}

function lighten(hex) {
  return hex.replace(/([0-9a-f]{2})/gi, m => {
    const v = Math.min(255, parseInt(m, 16) + 60);
    return v.toString(16).padStart(2, '0');
  });
}

function darken(hex) {
  return hex.replace(/([0-9a-f]{2})/gi, m => {
    const v = Math.max(0, parseInt(m, 16) - 30);
    return v.toString(16).padStart(2, '0');
  });
}
