const SHOOT_COOLDOWN = 0.25; // seconds between shots

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this._cooldown = 0;
    this.lives = 3;
    this.score = 0;
  }

  canShoot() {
    return this._cooldown <= 0;
  }

  shoot() {
    this._cooldown = SHOOT_COOLDOWN;
  }

  update(delta, mouseX, mouseY) {
    this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    if (this._cooldown > 0) this._cooldown -= delta;
  }

  render(ctx) {
    const s = ctx.canvas.width / 800; // scale relative to original design
    ctx.save();
    ctx.translate(this.x, this.y);

    // Base platform
    ctx.beginPath();
    ctx.arc(0, 0, 22 * s, 0, Math.PI * 2);
    const baseGrad = ctx.createRadialGradient(-5*s, -5*s, 3*s, 0, 0, 22*s);
    baseGrad.addColorStop(0, '#5588cc');
    baseGrad.addColorStop(1, '#223366');
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = '#7ab4ff';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Barrel
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.rect(8*s, -7*s, 28*s, 14*s);
    ctx.fillStyle = '#7ab4ff';
    ctx.fill();
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Muzzle tip
    ctx.beginPath();
    ctx.rect(34*s, -5*s, 8*s, 10*s);
    ctx.fillStyle = '#aaddff';
    ctx.fill();

    ctx.restore();
  }
}
